import React, { useState } from 'react'
import { Calendar, RefreshCw } from 'lucide-react'

import MeetingsList from '../components/MeetingsList'
import LoadingSpinner from '../components/LoadingSpinner'
import { generateClient } from 'aws-amplify/api'
import { Schema } from '../../amplify/data/resource'
import { DateTime } from 'luxon'
import { Authenticator } from '@aws-amplify/ui-react'

const client = generateClient<Schema>()

const MeetingsPage: React.FC = () => {
	const [meetings, setMeetings] = useState<
		{
			id: string
			title: string
			description: string
			startTime: string
			endTime: string
		}[]
	>([])
	const [loading, setLoading] = useState(false)
	const [hasLoaded, setHasLoaded] = useState(false)

	const loadMeetings = async () => {
		setLoading(true)
		const { data: users } = await client.models.User.list()
		const user = users[0]
		const { data } = await client.queries.listGoogleCalendarEvents({
			userIdInDb: user.id,
			timeMin: DateTime.local().startOf('day').toISO(),
			timeMax: DateTime.local().endOf('day').toISO(),
		})

		const events = data?.events as unknown as {
			id: string
			summary: string
			description: string
			startTime: string
			endTime: string
		}[]
		console.log('fetched meetings', data?.events)
		const meetings = events.map((event) => {
			return {
				id: event.id,
				title: event.summary,
				description: event.description || '',
				startTime: event.startTime,
				endTime: event.endTime,
			}
		})
		console.log('meetings', meetings)

		setMeetings(meetings)
		setLoading(false)
		setHasLoaded(true)
	}

	const todayDate = new Date().toLocaleDateString('en-US', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	})

	return (
		<Authenticator>
			<div className="max-w-4xl mx-auto px-4 py-8">
				{/* Header */}
				<div className="text-center mb-8">
					<div className="flex items-center justify-center mb-4">
						<div className="p-3 bg-blue-100 rounded-full mr-3">
							<Calendar className="w-8 h-8 text-blue-600" />
						</div>
						<div className="text-left">
							<h1 className="text-3xl font-bold text-gray-900">
								Today's Meetings
							</h1>
							<p className="text-gray-600">{todayDate}</p>
						</div>
					</div>

					{/* Load Meetings Button */}
					<button
						onClick={loadMeetings}
						disabled={loading}
						className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
					>
						{loading ? (
							<>
								<RefreshCw className="w-5 h-5 mr-2 animate-spin" />
								Loading...
							</>
						) : (
							<>
								<Calendar className="w-5 h-5 mr-2" />
								{hasLoaded ? 'Refresh Calendar' : "Load Today's Calendar"}
							</>
						)}
					</button>
				</div>

				{/* Meetings Count */}
				{hasLoaded && !loading && meetings.length > 0 && (
					<div className="text-center mb-6">
						<p className="text-gray-600">
							You have{' '}
							<span className="font-semibold text-gray-900">
								{meetings.length}
							</span>{' '}
							meeting{meetings.length !== 1 ? 's' : ''} today
						</p>
					</div>
				)}

				{/* Content */}
				<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
					{loading ? <LoadingSpinner /> : <MeetingsList meetings={meetings} />}
				</div>
			</div>
		</Authenticator>
	)
}

export default MeetingsPage
