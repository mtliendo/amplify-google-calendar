import { Schema } from '../../data/resource'
import { Amplify } from 'aws-amplify'
import { generateClient } from 'aws-amplify/data'
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime'
import { env } from '$amplify/env/list-google-calendar-events'
const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env)

Amplify.configure(resourceConfig, libraryOptions)

const client = generateClient<Schema>()

export const getValidGoogleAccessToken = async (userId: string) => {
	const user = await client.models.User.get({ id: userId })
	const googleOneHourTTLInSeconds = 3600
	const nowInSeconds = Math.floor(Date.now() / 1000)

	if (!user.data?.providers?.google?.oauth?.accessToken) {
		return {
			error: 'No access token found',
		}
	}

	const googleOauthDataFromUser = user.data?.providers?.google?.oauth

	if (
		googleOauthDataFromUser?.expiresAt &&
		googleOauthDataFromUser?.expiresAt > nowInSeconds
	) {
		// Token is still valid
		return {
			accessToken: user.data?.providers?.google?.oauth?.accessToken,
			error: null,
		}
	}

	// Token expired or about to expire → refresh it
	const params = new URLSearchParams()
	params.append('grant_type', 'refresh_token')
	params.append('refresh_token', googleOauthDataFromUser.refreshToken!)
	params.append('client_id', env.GOOGLE_CLIENT_ID)
	params.append('client_secret', env.GOOGLE_CLIENT_SECRET)

	const res = await fetch(env.GOOGLE_ACCESS_TOKEN_ENDPOINT, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: params,
	})

	const data = await res.json()

	if (!res.ok) {
		console.error('Token refresh failed:', res.status, data)
		return {
			error: `Token refresh failed: ${data.error || res.statusText}`,
		}
	}

	if (!data.access_token) {
		return {
			error: 'Failed to refresh token - no access token in response',
		}
	}

	const newAccessToken = data.access_token
	const newRefreshToken = data.refresh_token || googleOauthDataFromUser.refreshToken // Keep existing if not provided
	const newScope = data.scope || googleOauthDataFromUser.scope
	const newExpiresAt = nowInSeconds + googleOneHourTTLInSeconds

	// Update user tokens
	await client.models.User.update({
		id: userId,
		providers: {
			google: {
				oauth: {
					accessToken: newAccessToken,
					refreshToken: newRefreshToken,
					scope: newScope,
					expiresAt: newExpiresAt,
				},
			},
		},
	})

	return { accessToken: newAccessToken }
}
