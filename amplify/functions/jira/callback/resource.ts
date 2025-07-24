import { defineFunction, secret } from '@aws-amplify/backend'

export const jiraOauthCallback = defineFunction({
	name: 'jira-oauth-callback',
	resourceGroupName: 'data',
	entry: './main.ts',
	runtime: 22,
	environment: {
		JIRA_ACCESS_TOKEN_ENDPOINT: 'https://auth.atlassian.com/oauth/token',
		JIRA_CLIENT_ID: process.env.JIRA_CLIENT_ID!,
		JIRA_CLIENT_SECRET:
			process.env.JIRA_CLIENT_SECRET || secret('JIRA_CLIENT_SECRET'),
		REDIRECT_URI: process.env.JIRA_REDIRECT_URI as string,
		HOST_URL: process.env.HOST_URL as string,
	},
})
