import { Schema } from '../../../data/resource'
import { Amplify } from 'aws-amplify'
import { generateClient } from 'aws-amplify/data'
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime'
import { env } from '$amplify/env/list-google-calendar-events'
import { getValidGoogleAccessToken } from './utils'

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env)

Amplify.configure(resourceConfig, libraryOptions)

const client = generateClient<Schema>()

export const handler: Schema['listGoogleCalendarEvents']['functionHandler'] =
	async (event) => {
		console.log('Listing Google Calendar events', event.arguments)
		// 1. get the user from the database to get their accesstoken
		const res = await client.models.User.get({ id: event.arguments.userIdInDb })
		const user = res.data

		if (!user) {
			throw new Error('No user found')
		}

		const { accessToken, error } = await getValidGoogleAccessToken(user.id)
		console.log('user', user)
		console.log('accessToken', accessToken)
		console.log('error', error)
		if (error) {
			return {
				events: null,
				error: error,
			}
		}
		try {
			const googleCalendarResponse = await fetch(
				'https://www.googleapis.com/calendar/v3/calendars/primary/events',
				{
					method: 'POST',
					headers: {
						Authorization: `Bearer ${accessToken}`,
						'Content-Type': 'application/json; charset=utf-8',
					},
					body: JSON.stringify({
						accessToken: accessToken,
					}),
				}
			)
			const googleCalendarData = await googleCalendarResponse.json()
			console.log(googleCalendarData)
			return {
				events: JSON.stringify(googleCalendarData),
				error: null,
			}
		} catch (error) {
			console.error(error)
			return {
				events: null,
				error: 'Error listing Google Calendar events',
			}
		}
	}
