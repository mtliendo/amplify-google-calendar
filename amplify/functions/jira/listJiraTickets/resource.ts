import { defineFunction, secret } from '@aws-amplify/backend'

export const listJiraTickets = defineFunction({
	name: 'list-jira-tickets',
	resourceGroupName: 'data',
	entry: './main.ts',
	runtime: 22,
	environment: {
		JIRA_CLIENT_ID: process.env.JIRA_CLIENT_ID as string,
		JIRA_CLIENT_SECRET:
			(process.env.JIRA_CLIENT_SECRET as string) ||
			secret('JIRA_CLIENT_SECRET'),
		JIRA_ACCESS_TOKEN_ENDPOINT: 'https://auth.atlassian.com/oauth/token',
	},
})
