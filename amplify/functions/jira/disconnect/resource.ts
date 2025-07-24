import { defineFunction } from '@aws-amplify/backend'

export const disconnectFromJiraOauth = defineFunction({
	name: 'disconnect-from-jira-oauth',
	resourceGroupName: 'data',
	entry: './main.ts',
	runtime: 22,
	environment: {
		DISCONNECT_URL: 'https://auth.atlassian.com/oauth/revoke',
	},
})
