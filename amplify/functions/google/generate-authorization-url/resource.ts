import { defineFunction } from '@aws-amplify/backend'

export const generateGoogleOauthAuthorizationUrl = defineFunction({
	name: 'generate-google-oauth-authorization-url',
	resourceGroupName: 'data',
	entry: './main.ts',
	runtime: 22,
	environment: {
		GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
		REDIRECT_URI: process.env.REDIRECT_URI!,
		AUTHORIZATION_URL: 'https://accounts.google.com/o/oauth2/v2/auth',
		SCOPES: ['https://www.googleapis.com/auth/calendar'].join(','),
	},
})
