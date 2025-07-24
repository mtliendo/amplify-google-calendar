import { Schema } from '../../data/resource'
import { Amplify } from 'aws-amplify'
import { generateClient } from 'aws-amplify/data'
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime'
import { env } from '$amplify/env/list-google-calendar-events'
import { refreshAccessToken } from '../oauthUtils'

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env)

Amplify.configure(resourceConfig, libraryOptions)

const client = generateClient<Schema>()

export const getValidGoogleAccessToken = async (userId: string) => {
	return await refreshAccessToken(
		userId,
		'google',
		client,
		env.GOOGLE_ACCESS_TOKEN_ENDPOINT,
		env.GOOGLE_CLIENT_ID,
		env.GOOGLE_CLIENT_SECRET
	)
}
