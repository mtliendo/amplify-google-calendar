import { defineFunction, secret } from '@aws-amplify/backend'

export const googleOauthCallback = defineFunction({
	name: 'google-oauth-callback',
	resourceGroupName: 'data',
	entry: './main.ts',
	runtime: 22,
	environment: {
		GOOGLE_ACCESS_TOKEN_ENDPOINT: 'https://oauth2.googleapis.com/token',
		GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
		GOOGLE_CLIENT_SECRET:
			process.env.GOOGLE_CLIENT_SECRET || secret('GOOGLE_CLIENT_SECRET'),
		REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI as string,
		HOST_URL: process.env.HOST_URL as string,
	},
})
