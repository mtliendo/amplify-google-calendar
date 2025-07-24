/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * This function is used to generate a random state and ttl for the oauth state and save it to the database
 * It is used to generate the url to the provider oauth page
 * It is modular and can be used for any provider
 * Each item in the database will only live for 5 minutes as determined by the ttl
 * @param userId - The user id of the user in the database, not the cognito user id
 * @param provider - The provider to generate the oauth state for (google, etc)
 * @returns The state and ttl for the oauth state
 */
export const generateOauthState = (userId: string, provider: string) => {
	const state = crypto.randomUUID() + '::' + userId + '::' + provider

	const unixEpochSeconds = Math.floor(Date.now() / 1000)
	const ttl = 60 * 5 + unixEpochSeconds // 5 minutes from now in seconds (unix timestamp)

	return { state, ttl }
}

/**
 * Validates OAuth state and extracts userId from callback
 */
export const validateOAuthState = async (
	code: string | undefined,
	state: string | undefined,
	client: any,
	hostUrl: string
) => {
	if (!code || !state) {
		return {
			error: {
				statusCode: 302,
				headers: { Location: `${hostUrl}/?error=invalid_request` },
			},
		}
	}

	const stateParts = state.split('::')
	if (stateParts.length < 3) {
		return {
			error: {
				statusCode: 302,
				headers: { Location: `${hostUrl}/?error=invalid_state` },
			},
		}
	}

	const userId = stateParts[1]
	const { data: oauthStates } =
		await client.models.OAuthState.listOAuthStateByUserId(
			{ userId },
			{ filter: { state: { eq: state } } }
		)

	if (oauthStates.length === 0) {
		return {
			error: {
				statusCode: 302,
				headers: { Location: `${hostUrl}/?error=invalid_state_not_found` },
			},
		}
	}

	const mostRecentState = oauthStates.sort(
		(a: { ttl: number }, b: { ttl: number }) => b.ttl - a.ttl
	)[0].state
	if (mostRecentState !== state) {
		return {
			error: {
				statusCode: 302,
				headers: { Location: `${hostUrl}/?error=invalid_state_mismatch` },
			},
		}
	}

	return { userId, error: null }
}

/**
 * Exchanges authorization code for OAuth tokens
 */
export const exchangeCodeForTokens = async (
	code: string,
	tokenEndpoint: string,
	clientId: string,
	clientSecret: string,
	redirectUri: string,
	hostUrl: string
) => {
	const params = new URLSearchParams()
	params.append('grant_type', 'authorization_code')
	params.append('code', code)
	params.append('redirect_uri', redirectUri)
	params.append('client_id', clientId)
	params.append('client_secret', clientSecret)

	const res = await fetch(tokenEndpoint, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: params,
	})

	const data = await res.json()

	if (!data.access_token) {
		console.log('the not ok data from provider', data)
		return {
			error: {
				statusCode: 302,
				headers: { Location: `${hostUrl}/?error=bad_request` },
			},
			tokens: null,
		}
	}

	console.log('the ok data from provider', data)
	return { tokens: data, error: null }
}

/**
 * Updates user with OAuth tokens for a specific provider
 */
export const updateUserWithTokens = async (
	userId: string,
	provider: 'google' | 'jira',
	tokens: {
		access_token: string
		refresh_token: string
		scope: string
		expires_in: number
	},
	client: any,
	additionalData?: any
) => {
	const { data: currentUser } = await client.models.User.get({ id: userId })

	const providerData = {
		oauth: {
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token,
			scope: tokens.scope,
			expiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in,
		},
		...additionalData,
	}

	await client.models.User.update({
		id: userId,
		providers: {
			...currentUser?.providers,
			[provider]: providerData,
		},
	})
}

/**
 * Generic token refresh utility
 */
export const refreshAccessToken = async (
	userId: string,
	provider: 'google' | 'jira',
	client: any,
	tokenEndpoint: string,
	clientId: string,
	clientSecret: string
) => {
	const user = await client.models.User.get({ id: userId })
	const nowInSeconds = Math.floor(Date.now() / 1000)
	const oneHourTTL = 3600

	const oauthData = user.data?.providers?.[provider]?.oauth
	if (!oauthData?.accessToken) {
		return { error: 'No access token found' }
	}

	if (oauthData.expiresAt && oauthData.expiresAt > nowInSeconds) {
		return { accessToken: oauthData.accessToken, error: null }
	}

	// Refresh token
	const params = new URLSearchParams()
	params.append('grant_type', 'refresh_token')
	params.append('refresh_token', oauthData.refreshToken!)
	params.append('client_id', clientId)
	params.append('client_secret', clientSecret)

	const res = await fetch(tokenEndpoint, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: params,
	})

	const data = await res.json()

	if (!res.ok) {
		console.error('Token refresh failed:', res.status, data)
		return { error: `Token refresh failed: ${data.error || res.statusText}` }
	}

	if (!data.access_token) {
		return { error: 'Failed to refresh token - no access token in response' }
	}

	// Update tokens
	const updateData = {
		id: userId,
		providers: {
			[provider]: {
				oauth: {
					accessToken: data.access_token,
					refreshToken: data.refresh_token || oauthData.refreshToken,
					scope: data.scope || oauthData.scope,
					expiresAt: nowInSeconds + oneHourTTL,
				},
			},
		},
	}

	await client.models.User.update(updateData)
	return { accessToken: data.access_token, error: null }
}

/**
 * Disconnects OAuth provider from user account
 */
export const disconnectOAuthProvider = async (
	userId: string,
	provider: 'google' | 'jira',
	revocationUrl: string,
	client: any
) => {
	const user = await client.models.User.get({ id: userId })
	const accessToken = user.data?.providers?.[provider]?.oauth?.accessToken

	if (!accessToken) {
		return { success: false, message: 'No access token found' }
	}

	// Revoke token
	try {
		await fetch(revocationUrl, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams({}),
		})
	} catch (error) {
		console.error(`Error revoking access token:`, error)
	}

	// Remove provider from user
	try {
		await client.models.User.update({
			id: userId,
			providers: { [provider]: null },
		})
		return { success: true, message: `${provider} disconnected` }
	} catch (error) {
		console.error('Error updating user:', error)
		return { success: false, message: 'Error updating user' }
	}
}

/**
 * Builds authorization URL with parameters
 */
export const buildAuthorizationUrl = (
	baseUrl: string,
	params: Record<string, string>
) => {
	const url = new URL(baseUrl)
	Object.entries(params).forEach(([key, value]) => {
		url.searchParams.set(key, value)
	})
	return url.toString()
}
