import { type Schema } from '../../../data/resource'
import { Amplify } from 'aws-amplify'
import { generateClient } from 'aws-amplify/data'
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime'
import { env } from '$amplify/env/generate-jira-oauth-authorization-url'
import { generateOauthState, buildAuthorizationUrl } from '../../oauthUtils'

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env)

Amplify.configure(resourceConfig, libraryOptions)

const client = generateClient<Schema>()

export const handler: Schema['generateJiraOauthAuthorizationUrl']['functionHandler'] =
	async (event) => {
		const { state, ttl } = generateOauthState(event.arguments.userId, 'jira')

		await client.models.OAuthState.create({
			userId: event.arguments.userId,
			state,
			ttl,
		})

		const authorizationUrl = buildAuthorizationUrl(env.AUTHORIZATION_URL, {
			audience: 'api.atlassian.com',
			client_id: env.JIRA_CLIENT_ID,
			scope: env.SCOPES,
			redirect_uri: env.REDIRECT_URI,
			state,
			response_type: 'code',
			prompt: 'consent',
		})

		return { authorizationUrl }
	}
