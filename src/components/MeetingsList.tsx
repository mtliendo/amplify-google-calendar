import React from 'react'
import MeetingCard from './MeetingCard'
import { Calendar } from 'lucide-react'

interface MeetingsListProps {
	meetings: {
		id: string
		title: string
		description: string
		startTime: string
		endTime: string
	}[]
}

const MeetingsList: React.FC<MeetingsListProps> = ({ meetings }) => {
	if (meetings.length === 0) {
		return (
			<div className="text-center py-12">
				<Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
				<h3 className="text-lg font-medium text-gray-900 mb-2">
					No meetings today
				</h3>
				<p className="text-gray-500">
					Click the button above to load your calendar.
				</p>
			</div>
		)
	}

	// Sort meetings by start time
	const sortedMeetings = [...meetings].sort(
		(a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
	)

	return (
		<div className="space-y-4">
			{sortedMeetings.map((meeting) => (
				<MeetingCard key={meeting.id} meeting={meeting} />
			))}
		</div>
	)
}

export default MeetingsList
