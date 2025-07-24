import { type Schema } from '../../../data/resource'
import { Amplify } from 'aws-amplify'
import { generateClient } from 'aws-amplify/data'
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime'
import { env } from '$amplify/env/google-oauth-callback'
import { type LambdaFunctionURLHandler } from 'aws-lambda'
import { validateOAuthState, exchangeCodeForTokens, updateUserWithTokens } from '../../oauthUtils'

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env)

Amplify.configure(resourceConfig, libraryOptions)

const client = generateClient<Schema>()

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

	const stateValidation = await validateOAuthState(code, state, client, env.HOST_URL)
	if (stateValidation.error) return stateValidation.error

	const tokenExchange = await exchangeCodeForTokens(
		code!,
		env.GOOGLE_ACCESS_TOKEN_ENDPOINT,
		env.GOOGLE_CLIENT_ID,
		env.GOOGLE_CLIENT_SECRET,
		env.REDIRECT_URI,
		env.HOST_URL
	)
	if (tokenExchange.error) return tokenExchange.error

	await updateUserWithTokens(stateValidation.userId, 'google', tokenExchange.tokens, client)

	return {
		statusCode: 302,
		headers: {
			Location: `${env.HOST_URL}/?success=true`,
		},
	}
}
