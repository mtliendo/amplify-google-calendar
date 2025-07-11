import { defineFunction, secret } from '@aws-amplify/backend'

export const listGoogleCalendarEvents = defineFunction({
	name: 'list-google-calendar-events',
	resourceGroupName: 'data',
	entry: './main.ts',
	runtime: 22,
	environment: {
		GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID as string,
		GOOGLE_CLIENT_SECRET:
			(process.env.GOOGLE_CLIENT_SECRET as string) ||
			secret('GOOGLE_CLIENT_SECRET'),
		GOOGLE_ACCESS_TOKEN_ENDPOINT: 'https://oauth2.googleapis.com/token',
	},
})
