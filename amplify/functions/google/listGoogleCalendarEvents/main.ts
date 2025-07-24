import { Schema } from '../../../data/resource'
import { Amplify } from 'aws-amplify'
import { generateClient } from 'aws-amplify/data'
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime'
import { env } from '$amplify/env/list-google-calendar-events'
import { getValidGoogleAccessToken } from '../utils'

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env)

Amplify.configure(resourceConfig, libraryOptions)

const client = generateClient<Schema>()

export const handler: Schema['listGoogleCalendarEvents']['functionHandler'] =
	async (event) => {
		console.log('Listing Google Calendar events', event.arguments)
		const timeMin = event.arguments.timeMin
		const timeMax = event.arguments.timeMax
		// 1. get the user from the database to get their accesstoken
		const res = await client.models.User.get({ id: event.arguments.userIdInDb })
		const user = res.data

		if (!user) {
			throw new Error('No user found')
		}

		const { accessToken, error } = await getValidGoogleAccessToken(user.id)

		if (error) {
			return {
				events: null,
				error: error,
			}
		}
		try {
			const googleCalendarResponse = await fetch(
				`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`,
				{
					headers: {
						Authorization: `Bearer ${accessToken}`,
					},
				}
			)

			if (!googleCalendarResponse.ok) {
				const errorText = await googleCalendarResponse.text()
				console.error(
					'Google Calendar API error:',
					googleCalendarResponse.status,
					errorText
				)
				return {
					events: null,
					error: `Google Calendar API error: ${googleCalendarResponse.status}`,
				}
			}

			const googleCalendarData = await googleCalendarResponse.json()
			console.log(googleCalendarData)

			if (!googleCalendarData.items) {
				console.error(
					'No items in Google Calendar response:',
					googleCalendarData
				)
				return {
					events: null,
					error: 'No calendar items found in response',
				}
			}

			const eventItems = googleCalendarData.items as {
				id: string
				summary: string
				description?: string
				start: { dateTime: string }
				end: { dateTime: string }
				eventType: string
			}[]
			const events = eventItems
				.filter((googleEvent: { eventType: string; id: string }) => {
					return (
						googleEvent.eventType !== 'workingLocation' &&
						!googleEvent.id.includes('_')
					)
				})
				.map(
					(googleEvent: {
						id: string
						summary: string
						description?: string
						start: { dateTime: string }
						end: { dateTime: string }
					}) => {
						return {
							id: googleEvent.id,
							summary: googleEvent.summary,
							description: googleEvent.description || '',
							startTime: googleEvent.start.dateTime,
							endTime: googleEvent.end.dateTime,
						}
					}
				)
			console.log('events', events)
			return {
				events: events,
				error: null,
			} as unknown as Schema['listGoogleCalendarEvents']['returnType']
		} catch (error) {
			console.error(error)
			return {
				events: null,
				error: 'Error listing Google Calendar events',
			}
		}
	}
