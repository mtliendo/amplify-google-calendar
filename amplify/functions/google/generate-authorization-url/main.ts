import { type Schema } from '../../../data/resource'
import { Amplify } from 'aws-amplify'
import { generateClient } from 'aws-amplify/data'
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime'
import { env } from '$amplify/env/generate-google-oauth-authorization-url'

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env)

Amplify.configure(resourceConfig, libraryOptions)

const client = generateClient<Schema>()

/**
 * This function is used to generate a random state and ttl for the oauth state and save it to the database
 * It is used to generate the url to the provider oauth page
 * It is modular and can be used for any provider
 * Each item in the database will only live for 5 minutes as determined by the ttl
 */
export const handler: Schema['generateOauthAuthorizationUrl']['functionHandler'] =
	async (event) => {
		const { provider } = event.arguments as {
			provider: Schema['SupportedProviders']['type']
		}
		//1. generate a random state and ttl for dynamoDB
		const state =
			crypto.randomUUID() + '::' + event.arguments.userId + '::' + provider

		const unixEpochSeconds = Math.floor(Date.now() / 1000)
		const ttl = 60 * 5 + unixEpochSeconds // 5 minutes from now in seconds (unix timestamp)

		//2. save the state and ttl to the database as a new OAuthState item for the user
		await client.models.OAuthState.create({
			userId: event.arguments.userId,
			state,
			ttl,
		})

		//3. create the url to the provider oauth page.
		const url = new URL(env.AUTHORIZATION_URL)
		url.searchParams.set('client_id', env.GOOGLE_CLIENT_ID)
		url.searchParams.set('scope', env.SCOPES)
		url.searchParams.set('redirect_uri', env.REDIRECT_URI)
		url.searchParams.set('state', state)
		url.searchParams.set('response_type', 'code')
		url.searchParams.set('access_type', 'offline')
		url.searchParams.set('prompt', 'consent')

		//4. return the url to the client to redirect to the provider oauth page
		return {
			authorizationUrl: url.toString(),
		}
	}
