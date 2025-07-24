import { Schema } from '../../../data/resource'
import { Amplify } from 'aws-amplify'
import { generateClient } from 'aws-amplify/data'
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime'
import { env } from '$amplify/env/list-jira-tickets'
import { getValidJiraAccessToken } from '../utils'

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env)

Amplify.configure(resourceConfig, libraryOptions)

const client = generateClient<Schema>()

export const handler: Schema['listJiraTickets']['functionHandler'] = async (
	event
) => {
	console.log('Listing Jira tickets', event.arguments)
	// 1. get the user from the database to get their accesstoken
	const res = await client.models.User.get({ id: event.arguments.userIdInDb })
	const user = res.data

	if (!user) {
		throw new Error('No user found')
	}

	const { accessToken, error } = await getValidJiraAccessToken(user.id)
	console.log('user', user)
	console.log('accessToken', accessToken)
	console.log('error', error)
	if (error) {
		return {
			tickets: null,
			error: error,
		}
	}
	try {
		// Get the user's email for the JQL query
		const userEmail = user.email || ''

		// Use the user's CloudID from their Jira auth data
		const cloudId = user.providers?.jira?.cloudId

		const jiraTicketsResponse = await fetch(
			`https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/search?jql=assignee="${userEmail}" OR reporter="${userEmail}" ORDER BY updated DESC&maxResults=50`,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
					Accept: 'application/json',
				},
			}
		)

		if (!jiraTicketsResponse.ok) {
			const errorText = await jiraTicketsResponse.text()
			console.error('Jira API error:', jiraTicketsResponse.status, errorText)
			return {
				tickets: null,
				error: `Jira API error: ${jiraTicketsResponse.status}`,
			}
		}

		const jiraTicketsData = await jiraTicketsResponse.json()
		console.log('Jira response:', jiraTicketsData)

		if (!jiraTicketsData.issues) {
			console.error('No issues in Jira response:', jiraTicketsData)
			return {
				tickets: null,
				error: 'No issues found in response',
			}
		}

		const tickets = jiraTicketsData.issues.map(
			(issue: {
				id: string
				key: string
				fields: {
					summary: string
					description?:
						| string
						| {
								content: {
									type: string
									content: { type: string; text: string }[]
								}[]
						  }
					status?: { name: string }
					assignee?: { displayName: string; emailAddress: string }
					reporter?: { displayName: string; emailAddress: string }
					created: string
					updated: string
					priority?: { name: string }
					issuetype?: { name: string }
				}
			}) => {
				// Handle description which could be a string or an ADF (Atlassian Document Format) object
				let description = ''
				if (typeof issue.fields.description === 'string') {
					description = issue.fields.description
				} else if (issue.fields.description?.content) {
					// Simple extraction of text from ADF format
					description = issue.fields.description.content
						.map(
							(block: {
								type: string
								content: { type: string; text: string }[]
							}) => {
								if (block.type === 'paragraph' && block.content) {
									return block.content
										.map(
											(inline: { type: string; text: string }) =>
												inline.text || ''
										)
										.join('')
								}
								return ''
							}
						)
						.join('\n')
				}

				return {
					id: issue.id,
					key: issue.key,
					summary: issue.fields.summary,
					description: description,
					status: issue.fields.status?.name || 'Unknown',
					assignee: issue.fields.assignee?.displayName || 'Unassigned',
					reporter: issue.fields.reporter?.displayName || 'Unknown',
					created: issue.fields.created,
					updated: issue.fields.updated,
					priority: issue.fields.priority?.name || 'None',
					issueType: issue.fields.issuetype?.name || 'Unknown',
				}
			}
		)

		console.log('Mapped tickets:', tickets)
		return {
			tickets: tickets,
			error: null,
		} as unknown as Schema['listJiraTickets']['returnType']
	} catch (error) {
		console.error('Error listing Jira tickets:', error)
		return {
			tickets: null,
			error: 'Error listing Jira tickets',
		}
	}
}
