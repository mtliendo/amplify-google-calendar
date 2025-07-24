import { type Schema } from '../../../data/resource'
import { Amplify } from 'aws-amplify'
import { generateClient } from 'aws-amplify/data'
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime'
import { env } from '$amplify/env/jira-oauth-callback'
import { type LambdaFunctionURLHandler } from 'aws-lambda'
import {
	validateOAuthState,
	exchangeCodeForTokens,
	updateUserWithTokens,
} from '../../oauthUtils'

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env)

Amplify.configure(resourceConfig, libraryOptions)

const client = generateClient<Schema>()

const getJiraCloudId = async (accessToken: string) => {
	try {
		const sitesResponse = await fetch(
			'https://api.atlassian.com/oauth/token/accessible-resources',
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
					Accept: 'application/json',
				},
			}
		)

		if (sitesResponse.ok) {
			const sites = await sitesResponse.json()
			if (sites.length > 0) {
				console.log('Auto-selected Jira cloudId:', sites[0].id)
				return sites[0].id
			}
		}
	} catch (error) {
		console.error('Error fetching Jira cloudId:', error)
	}
	return undefined
}

export const handler: LambdaFunctionURLHandler = async (
	event
): Promise<{
	statusCode: number
	headers: { Location: string }
}> => {
	const { code, state } = (event.queryStringParameters || {}) as {
		code?: string
		state?: string
	}

	const stateValidation = await validateOAuthState(
		code,
		state,
		client,
		env.HOST_URL
	)
	if (stateValidation.error) return stateValidation.error

	const tokenExchange = await exchangeCodeForTokens(
		code!,
		env.JIRA_ACCESS_TOKEN_ENDPOINT,
		env.JIRA_CLIENT_ID,
		env.JIRA_CLIENT_SECRET,
		env.REDIRECT_URI,
		env.HOST_URL
	)
	if (tokenExchange.error) return tokenExchange.error

	// Get Jira-specific cloudId
	const cloudId = await getJiraCloudId(tokenExchange.tokens.access_token)

	await updateUserWithTokens(
		stateValidation.userId,
		'jira',
		tokenExchange.tokens,
		client,
		cloudId ? { cloudId } : undefined
	)

	return {
		statusCode: 302,
		headers: {
			Location: `${env.HOST_URL}/?success=true`,
		},
	}
}
