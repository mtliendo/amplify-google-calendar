import { Schema } from '../../../data/resource'
import { Amplify } from 'aws-amplify'
import { generateClient } from 'aws-amplify/data'
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime'
import { env } from '$amplify/env/disconnect-from-jira-oauth'

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env)

Amplify.configure(resourceConfig, libraryOptions)

const client = generateClient<Schema>()

/**
 * given a userId and provider, disconnect the user from the provider and remove the tokens from the database
 */
export const handler: Schema['disconnectFromJiraOauth']['functionHandler'] =
	async (event) => {
		// get the user from the database
		const user = await client.models.User.get({ id: event.arguments.userId })
		const accessToken = user.data?.providers?.jira?.oauth?.accessToken

		if (!accessToken) {
			return { success: false, message: 'No access token found' }
		}

		/**
		 * Revokes the OAuth token for a given provider
		 */
		const revokeOAuthToken = async (
			revocationUrl: string,
			accessToken: string
		) => {
			try {
				await fetch(revocationUrl, {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${accessToken}`,
						'Content-Type': 'application/x-www-form-urlencoded',
					},
					body: new URLSearchParams({}), // required even if empty
				})
			} catch (error) {
				console.error(`Error revoking access token:`, error)
			}
		}

		/**
		 * Removes the provider from the user's account
		 */
		const removeProviderFromUser = async (userId: string) => {
			try {
				await client.models.User.update({
					id: userId,
					providers: {
						jira: null,
					},
				})
				return { success: true, message: `jira disconnected` }
			} catch (error) {
				console.error('Error updating user:', error)
				return { success: false, message: 'Error updating user' }
			}
		}

		// handle the provider-specific disconnection logic
		await revokeOAuthToken(env.DISCONNECT_URL, accessToken)

		// remove the provider from the user's account
		const result = await removeProviderFromUser(event.arguments.userId)
		return result
	}
