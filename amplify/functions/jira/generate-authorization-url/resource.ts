import { defineFunction } from '@aws-amplify/backend'

export const generateJiraOauthAuthorizationUrl = defineFunction({
	name: 'generate-jira-oauth-authorization-url',
	resourceGroupName: 'data',
	entry: './main.ts',
	runtime: 22,
	environment: {
		JIRA_CLIENT_ID: process.env.JIRA_CLIENT_ID!,
		REDIRECT_URI: process.env.JIRA_REDIRECT_URI!,
		AUTHORIZATION_URL: 'https://auth.atlassian.com/authorize',
		SCOPES: ['read:jira-user', 'read:jira-work', 'read:jira-issue'].join(' '),
	},
})
