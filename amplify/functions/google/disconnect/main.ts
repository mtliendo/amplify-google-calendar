import { Schema } from '../../../data/resource'
import { Amplify } from 'aws-amplify'
import { generateClient } from 'aws-amplify/data'
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime'
import { env } from '$amplify/env/disconnect-from-google-oauth'
import { disconnectOAuthProvider } from '../../oauthUtils'

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env)

Amplify.configure(resourceConfig, libraryOptions)

const client = generateClient<Schema>()

export const handler: Schema['disconnectFromGoogleOauth']['functionHandler'] =
	async (event) => {
		return await disconnectOAuthProvider(
			event.arguments.userId,
			'google',
			env.DISCONNECT_URL,
			client
		)
	}
