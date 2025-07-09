import { defineFunction } from '@aws-amplify/backend'

export const disconnectFromGoogleOauth = defineFunction({
	name: 'disconnect-from-google-oauth',
	resourceGroupName: 'data',
	entry: './main.ts',
	runtime: 22,
	environment: {
		DISCONNECT_URL: 'https://oauth2.googleapis.com/revoke',
	},
})
