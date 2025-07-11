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
		const timeMin = event.arguments.timeMin
		const timeMax = event.arguments.timeMax
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
				`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`,
				{
					headers: {
						Authorization: `Bearer ${accessToken}`,
					},
				}
			)
			const googleCalendarData = await googleCalendarResponse.json()
			console.log(googleCalendarData)
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

// //sample response
// const json = {
// 	kind: 'calendar#events',
// 	etag: '"p33vrv355jaq8s0o"',
// 	summary: 'michael.liendo@orkes.io',
// 	description: '',
// 	updated: '2025-07-11T06:44:34.935Z',
// 	timeZone: 'America/Los_Angeles',
// 	accessRole: 'owner',
// 	defaultReminders: [{ method: 'popup', minutes: 10 }],
// 	nextSyncToken: 'CP-_jKWatI4DEP-_jKWatI4DGAUgpczu8wIopczu8wI=',
// 	items: [
// 		{
// 			kind: 'calendar#event',
// 			etag: '"3491912534921310"',
// 			id: 'mg5ib6onrvuf5ml7b9fstuv5n0',
// 			status: 'confirmed',
// 			htmlLink:
// 				'https://www.google.com/calendar/event?eid=bWc1aWI2b25ydnVmNW1sN2I5ZnN0dXY1bjBfMjAyNTA1MDEgbWljaGFlbC5saWVuZG9Ab3JrZXMuaW8',
// 			created: '2025-04-29T19:51:07.000Z',
// 			updated: '2025-04-29T19:51:07.460Z',
// 			summary: 'Home',
// 			creator: { email: 'michael.liendo@orkes.io', self: true },
// 			organizer: { email: 'michael.liendo@orkes.io', self: true },
// 			start: { date: '2025-05-01' },
// 			end: { date: '2025-05-02' },
// 			recurrence: ['RRULE:FREQ=WEEKLY;BYDAY=TH'],
// 			transparency: 'transparent',
// 			visibility: 'public',
// 			iCalUID: 'mg5ib6onrvuf5ml7b9fstuv5n0@google.com',
// 			sequence: 0,
// 			reminders: { useDefault: false },
// 			workingLocationProperties: { type: 'homeOffice', homeOffice: {} },
// 			eventType: 'workingLocation',
// 		},
// 		{
// 			kind: 'calendar#event',
// 			etag: '"3491912536080734"',
// 			id: 'qft1pmgdhipstd9ndefu35ngm0',
// 			status: 'confirmed',
// 			htmlLink:
// 				'https://www.google.com/calendar/event?eid=cWZ0MXBtZ2RoaXBzdGQ5bmRlZnUzNW5nbTBfMjAyNTA1MDIgbWljaGFlbC5saWVuZG9Ab3JrZXMuaW8',
// 			created: '2025-04-29T19:51:07.000Z',
// 			updated: '2025-04-29T19:51:08.040Z',
// 			summary: 'Home',
// 			creator: { email: 'michael.liendo@orkes.io', self: true },
// 			organizer: { email: 'michael.liendo@orkes.io', self: true },
// 			start: { date: '2025-05-02' },
// 			end: { date: '2025-05-03' },
// 			recurrence: ['RRULE:FREQ=WEEKLY;BYDAY=FR'],
// 			transparency: 'transparent',
// 			visibility: 'public',
// 			iCalUID: 'qft1pmgdhipstd9ndefu35ngm0@google.com',
// 			sequence: 0,
// 			reminders: { useDefault: false },
// 			workingLocationProperties: { type: 'homeOffice', homeOffice: {} },
// 			eventType: 'workingLocation',
// 		},
// 		{
// 			kind: 'calendar#event',
// 			etag: '"3504313741755166"',
// 			id: '1ekpgkituet5pr0itudln4lq9o',
// 			status: 'confirmed',
// 			htmlLink:
// 				'https://www.google.com/calendar/event?eid=MWVrcGdraXR1ZXQ1cHIwaXR1ZGxuNGxxOW9fMjAyNTA3MDhUMTUzMDAwWiBtaWNoYWVsLmxpZW5kb0Bvcmtlcy5pbw',
// 			created: '2025-07-07T17:01:26.000Z',
// 			updated: '2025-07-10T14:14:30.877Z',
// 			summary: '[Orkes] Daily meeting',
// 			description:
// 				'Hi!\n\nSetting up some time to go through our current progress and discuss next steps.\n\nThank you,\nBest regards,\nKonstantin Voytovich',
// 			creator: { email: 'konstantin.voytovich@siliconmint.com' },
// 			organizer: { email: 'konstantin.voytovich@siliconmint.com' },
// 			start: {
// 				dateTime: '2025-07-08T08:30:00-07:00',
// 				timeZone: 'America/Los_Angeles',
// 			},
// 			end: {
// 				dateTime: '2025-07-08T09:00:00-07:00',
// 				timeZone: 'America/Los_Angeles',
// 			},
// 			recurrence: [
// 				'RRULE:FREQ=WEEKLY;UNTIL=20250709T065959Z;BYDAY=FR,MO,TH,TU,WE',
// 			],
// 			iCalUID: '1ekpgkituet5pr0itudln4lq9o@google.com',
// 			sequence: 0,
// 			attendees: [
// 				{ email: 'igor.chvyrov@siliconmint.com', responseStatus: 'accepted' },
// 				{
// 					email: 'konstantin.voytovich@siliconmint.com',
// 					organizer: true,
// 					responseStatus: 'accepted',
// 				},
// 				{
// 					email: 'ivan.kulik@siliconmint.com',
// 					responseStatus: 'needsAction',
// 				},
// 				{
// 					email: 'denis@siliconmint.com',
// 					displayName: 'Denis Kulgavin',
// 					responseStatus: 'needsAction',
// 				},
// 				{ email: 'eugene.kisel@siliconmint.com', responseStatus: 'accepted' },
// 				{ email: 'aseem.mohanty@orkes.io', responseStatus: 'accepted' },
// 				{ email: 'ilya.kozik@siliconmint.com', responseStatus: 'accepted' },
// 				{ email: 'shailesh.padave@orkes.io', responseStatus: 'accepted' },
// 				{
// 					email: 'michael.liendo@orkes.io',
// 					self: true,
// 					optional: true,
// 					responseStatus: 'needsAction',
// 				},
// 				{
// 					email: 'manan.bhatt@orkes.io',
// 					optional: true,
// 					responseStatus: 'needsAction',
// 				},
// 				{
// 					email: 'viren@orkes.io',
// 					optional: true,
// 					responseStatus: 'needsAction',
// 				},
// 				{ email: 'dilip@orkes.io', responseStatus: 'needsAction' },
// 				{
// 					email: 'bernard.pietraga@orkes.io',
// 					optional: true,
// 					responseStatus: 'needsAction',
// 				},
// 				{ email: 'riza.farheen@orkes.io', responseStatus: 'accepted' },
// 				{ email: 'ahmed.kamal@orkes.io', responseStatus: 'accepted' },
// 			],
// 			hangoutLink: 'https://meet.google.com/ksi-degb-bvn',
// 			conferenceData: {
// 				entryPoints: [
// 					{
// 						entryPointType: 'video',
// 						uri: 'https://meet.google.com/ksi-degb-bvn',
// 						label: 'meet.google.com/ksi-degb-bvn',
// 					},
// 					{
// 						entryPointType: 'more',
// 						uri: 'https://tel.meet/ksi-degb-bvn?pin=9689949635133',
// 						pin: '9689949635133',
// 					},
// 					{
// 						regionCode: 'GB',
// 						entryPointType: 'phone',
// 						uri: 'tel:+44-20-3937-1316',
// 						label: '+44 20 3937 1316',
// 						pin: '869300004',
// 					},
// 				],
// 				conferenceSolution: {
// 					key: { type: 'hangoutsMeet' },
// 					name: 'Google Meet',
// 					iconUri:
// 						'https://fonts.gstatic.com/s/i/productlogos/meet_2020q4/v6/web-512dp/logo_meet_2020q4_color_2x_web_512dp.png',
// 				},
// 				conferenceId: 'ksi-degb-bvn',
// 			},
// 			reminders: { useDefault: true },
// 			eventType: 'default',
// 		},
// 		{
// 			kind: 'calendar#event',
// 			etag: '"3504313741755166"',
// 			id: '1ekpgkituet5pr0itudln4lq9o_R20250710T153000',
// 			status: 'confirmed',
// 			htmlLink:
// 				'https://www.google.com/calendar/event?eid=MWVrcGdraXR1ZXQ1cHIwaXR1ZGxuNGxxOW9fMjAyNTA3MTBUMTUzMDAwWiBtaWNoYWVsLmxpZW5kb0Bvcmtlcy5pbw',
// 			created: '2025-07-07T17:01:26.000Z',
// 			updated: '2025-07-10T14:14:30.877Z',
// 			summary: '[Orkes] Daily meeting',
// 			description:
// 				'Hi!\n\nSetting up some time to go through our current progress and discuss next steps.\n\nThank you,\nBest regards,\nKonstantin Voytovich',
// 			creator: { email: 'konstantin.voytovich@siliconmint.com' },
// 			organizer: { email: 'konstantin.voytovich@siliconmint.com' },
// 			start: {
// 				dateTime: '2025-07-10T08:30:00-07:00',
// 				timeZone: 'America/Los_Angeles',
// 			},
// 			end: {
// 				dateTime: '2025-07-10T09:00:00-07:00',
// 				timeZone: 'America/Los_Angeles',
// 			},
// 			recurrence: ['RRULE:FREQ=WEEKLY;BYDAY=FR,MO,TH,TU,WE'],
// 			iCalUID: '1ekpgkituet5pr0itudln4lq9o_R20250710T153000@google.com',
// 			sequence: 0,
// 			attendees: [
// 				{ email: 'igor.chvyrov@siliconmint.com', responseStatus: 'accepted' },
// 				{
// 					email: 'konstantin.voytovich@siliconmint.com',
// 					organizer: true,
// 					responseStatus: 'accepted',
// 				},
// 				{ email: 'ivan.kulik@siliconmint.com', responseStatus: 'accepted' },
// 				{
// 					email: 'denis@siliconmint.com',
// 					displayName: 'Denis Kulgavin',
// 					responseStatus: 'needsAction',
// 				},
// 				{ email: 'eugene.kisel@siliconmint.com', responseStatus: 'accepted' },
// 				{ email: 'aseem.mohanty@orkes.io', responseStatus: 'accepted' },
// 				{ email: 'ilya.kozik@siliconmint.com', responseStatus: 'accepted' },
// 				{ email: 'shailesh.padave@orkes.io', responseStatus: 'accepted' },
// 				{
// 					email: 'michael.liendo@orkes.io',
// 					self: true,
// 					optional: true,
// 					responseStatus: 'needsAction',
// 				},
// 				{
// 					email: 'manan.bhatt@orkes.io',
// 					optional: true,
// 					responseStatus: 'needsAction',
// 				},
// 				{
// 					email: 'viren@orkes.io',
// 					optional: true,
// 					responseStatus: 'needsAction',
// 				},
// 				{ email: 'dilip@orkes.io', responseStatus: 'declined' },
// 				{
// 					email: 'bernard.pietraga@orkes.io',
// 					optional: true,
// 					responseStatus: 'needsAction',
// 				},
// 				{ email: 'riza.farheen@orkes.io', responseStatus: 'accepted' },
// 				{ email: 'ahmed.kamal@orkes.io', responseStatus: 'accepted' },
// 			],
// 			hangoutLink: 'https://meet.google.com/ksi-degb-bvn',
// 			conferenceData: {
// 				entryPoints: [
// 					{
// 						entryPointType: 'video',
// 						uri: 'https://meet.google.com/ksi-degb-bvn',
// 						label: 'meet.google.com/ksi-degb-bvn',
// 					},
// 					{
// 						entryPointType: 'more',
// 						uri: 'https://tel.meet/ksi-degb-bvn?pin=9689949635133',
// 						pin: '9689949635133',
// 					},
// 					{
// 						regionCode: 'GB',
// 						entryPointType: 'phone',
// 						uri: 'tel:+44-20-3937-1316',
// 						label: '+44 20 3937 1316',
// 						pin: '869300004',
// 					},
// 				],
// 				conferenceSolution: {
// 					key: { type: 'hangoutsMeet' },
// 					name: 'Google Meet',
// 					iconUri:
// 						'https://fonts.gstatic.com/s/i/productlogos/meet_2020q4/v6/web-512dp/logo_meet_2020q4_color_2x_web_512dp.png',
// 				},
// 				conferenceId: 'ksi-degb-bvn',
// 			},
// 			reminders: { useDefault: true },
// 			eventType: 'default',
// 		},
// 		{
// 			kind: 'calendar#event',
// 			etag: '"3504432549871614"',
// 			id: '1ekpgkituet5pr0itudln4lq9o_20250711T153000Z',
// 			status: 'confirmed',
// 			htmlLink:
// 				'https://www.google.com/calendar/event?eid=MWVrcGdraXR1ZXQ1cHIwaXR1ZGxuNGxxOW9fMjAyNTA3MTFUMTUzMDAwWiBtaWNoYWVsLmxpZW5kb0Bvcmtlcy5pbw',
// 			created: '2025-07-07T17:01:26.000Z',
// 			updated: '2025-07-11T06:44:34.935Z',
// 			summary: '[Orkes] Daily meeting',
// 			description:
// 				'Hi!\n\nSetting up some time to go through our current progress and discuss next steps.\n\nThank you,\nBest regards,\nKonstantin Voytovich',
// 			creator: { email: 'konstantin.voytovich@siliconmint.com' },
// 			organizer: { email: 'konstantin.voytovich@siliconmint.com' },
// 			start: {
// 				dateTime: '2025-07-11T08:30:00-07:00',
// 				timeZone: 'Europe/Minsk',
// 			},
// 			end: {
// 				dateTime: '2025-07-11T09:00:00-07:00',
// 				timeZone: 'Europe/Minsk',
// 			},
// 			recurringEventId: '1ekpgkituet5pr0itudln4lq9o_R20250710T153000',
// 			originalStartTime: {
// 				dateTime: '2025-07-11T08:30:00-07:00',
// 				timeZone: 'Europe/Minsk',
// 			},
// 			iCalUID: '1ekpgkituet5pr0itudln4lq9o_R20250710T153000@google.com',
// 			sequence: 0,
// 			attendees: [
// 				{ email: 'igor.chvyrov@siliconmint.com', responseStatus: 'accepted' },
// 				{
// 					email: 'konstantin.voytovich@siliconmint.com',
// 					organizer: true,
// 					responseStatus: 'accepted',
// 				},
// 				{ email: 'ivan.kulik@siliconmint.com', responseStatus: 'accepted' },
// 				{
// 					email: 'denis@siliconmint.com',
// 					displayName: 'Denis Kulgavin',
// 					responseStatus: 'needsAction',
// 				},
// 				{ email: 'eugene.kisel@siliconmint.com', responseStatus: 'accepted' },
// 				{ email: 'aseem.mohanty@orkes.io', responseStatus: 'accepted' },
// 				{ email: 'ilya.kozik@siliconmint.com', responseStatus: 'accepted' },
// 				{ email: 'shailesh.padave@orkes.io', responseStatus: 'accepted' },
// 				{
// 					email: 'michael.liendo@orkes.io',
// 					self: true,
// 					optional: true,
// 					responseStatus: 'needsAction',
// 				},
// 				{
// 					email: 'manan.bhatt@orkes.io',
// 					optional: true,
// 					responseStatus: 'needsAction',
// 				},
// 				{
// 					email: 'viren@orkes.io',
// 					optional: true,
// 					responseStatus: 'declined',
// 					comment: 'Declined because I am out of office',
// 				},
// 				{ email: 'dilip@orkes.io', responseStatus: 'declined' },
// 				{
// 					email: 'bernard.pietraga@orkes.io',
// 					optional: true,
// 					responseStatus: 'needsAction',
// 				},
// 				{ email: 'riza.farheen@orkes.io', responseStatus: 'tentative' },
// 				{ email: 'ahmed.kamal@orkes.io', responseStatus: 'accepted' },
// 			],
// 			hangoutLink: 'https://meet.google.com/ksi-degb-bvn',
// 			conferenceData: {
// 				entryPoints: [
// 					{
// 						entryPointType: 'video',
// 						uri: 'https://meet.google.com/ksi-degb-bvn',
// 						label: 'meet.google.com/ksi-degb-bvn',
// 					},
// 					{
// 						entryPointType: 'more',
// 						uri: 'https://tel.meet/ksi-degb-bvn?pin=9689949635133',
// 						pin: '9689949635133',
// 					},
// 					{
// 						regionCode: 'GB',
// 						entryPointType: 'phone',
// 						uri: 'tel:+44-20-3937-1316',
// 						label: '+44 20 3937 1316',
// 						pin: '869300004',
// 					},
// 				],
// 				conferenceSolution: {
// 					key: { type: 'hangoutsMeet' },
// 					name: 'Google Meet',
// 					iconUri:
// 						'https://fonts.gstatic.com/s/i/productlogos/meet_2020q4/v6/web-512dp/logo_meet_2020q4_color_2x_web_512dp.png',
// 				},
// 				conferenceId: 'ksi-degb-bvn',
// 			},
// 			reminders: { useDefault: true },
// 			eventType: 'default',
// 		},
// 	],
// }
