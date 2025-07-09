// 1. Import dependencies
import { type Schema } from '../../../data/resource'
import { Amplify } from 'aws-amplify'
import { generateClient } from 'aws-amplify/data'
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime'
import { env } from '$amplify/env/google-oauth-callback'
import { type LambdaFunctionURLHandler } from 'aws-lambda'

// 2. Configure Amplify
const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env)

Amplify.configure(resourceConfig, libraryOptions)

// 3. Create an Amplify Data client
const client = generateClient<Schema>()

// 4. Define the handler function
export const handler: LambdaFunctionURLHandler = async (
	event
): Promise<{
	statusCode: number
	headers: { Location: string }
}> => {
	// 5. Verify the state and get the user details from the event
	const { code, state } = (event.queryStringParameters || {}) as {
		code?: string
		state?: string
	}

	// 5a. If the code or state are not present, return an error
	if (!code || !state) {
		return {
			statusCode: 302,
			headers: {
				Location: `${env.HOST_URL}/?error=invalid_request`,
			},
		}
	}

	// 5b. If the state is not valid, return an error
	const stateParts = state.split('::')
	console.log('stateParts', stateParts)
	if (stateParts.length < 3) {
		return {
			statusCode: 302,
			headers: {
				Location: `${env.HOST_URL}/?error=invalid_state`,
			},
		}
	}

	// 5c. Get the userId and provider from the state
	const userId = stateParts[1]
	const provider = stateParts[2]

	// 5d. Get the most recent state from the database
	const { data: oauthStates } =
		await client.models.OAuthState.listOAuthStateByUserId(
			{ userId: userId },
			{ filter: { state: { eq: state } } }
		)

	// 5e. If no state is found, return an error
	if (oauthStates.length === 0) {
		return {
			statusCode: 302,
			headers: {
				Location: `${env.HOST_URL}/?error=invalid_state_not_found`,
			},
		}
	}

	// 5f. If the state does not match, return an error
	const mostRecentState = oauthStates.sort((a, b) => b.ttl - a.ttl)[0].state

	if (mostRecentState !== state) {
		return {
			statusCode: 302,
			headers: {
				Location: `${env.HOST_URL}/?error=invalid_state_mismatch`,
			},
		}
	}
	// 6. Create the body of the request to the provider
	const params = new URLSearchParams()
	params.append('grant_type', 'authorization_code')
	params.append('code', code)
	params.append('redirect_uri', env.REDIRECT_URI)
	params.append('client_id', env.GOOGLE_CLIENT_ID)
	params.append('client_secret', env.GOOGLE_CLIENT_SECRET)

	// 7. Exchange the authorization code for an access token
	const res = await fetch(env.ACCESS_TOKEN_ENDPOINT, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: params,
	})
	const data = await res.json()

	// 8. If the request was not successful, return an error
	if (!data.access_token) {
		console.log('the not ok data from provider', data)
		return {
			statusCode: 302,
			headers: {
				Location: `${env.HOST_URL}/?error=bad_request`,
			},
		}
	}

	// 9. If the request was successful, save the access token to the database
	console.log('the ok data from provider', data)
	if (data.access_token) {
		await client.models.User.update({
			id: userId,
			providers: {
				[provider]: {
					oauth: {
						accessToken: data.access_token,
						refreshToken: data.refresh_token,
						scope: data.scope,
						expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
					},
				},
			},
		})

		// 10. Return a success response to the client
		return {
			statusCode: 302,
			headers: {
				Location: `${env.HOST_URL}/?success=true`,
			},
		}
	}

	// 11. If the user update failed, return an error
	return {
		statusCode: 302,
		headers: {
			Location: `${env.HOST_URL}/?error=user_update_error`,
		},
	}
}
