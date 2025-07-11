import React from 'react'

import { Clock } from 'lucide-react'

interface MeetingCardProps {
	meeting: {
		id: string
		title: string
		description: string
		startTime: string
		endTime: string
	}
}

const MeetingCard: React.FC<MeetingCardProps> = ({ meeting }) => {
	const formatTime = (timeString: string) => {
		return new Date(timeString).toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true,
		})
	}

	return (
		<div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 p-4">
			<div className="flex items-start justify-between mb-3">
				<div className="text-sm font-medium text-gray-900">
					{formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
				</div>
			</div>

			<h3 className="text-lg font-semibold text-gray-900 mb-2">
				{meeting.title}
			</h3>

			{meeting.description && (
				<p className="text-gray-600 text-sm mb-3">{meeting.description}</p>
			)}

			<div className="space-y-2">
				<div className="flex items-center text-sm text-gray-500"></div>

				<div className="flex items-center text-sm text-gray-500">
					<Clock className="w-4 h-4 mr-2 text-gray-400" />
					{Math.round(
						(new Date(meeting.endTime).getTime() -
							new Date(meeting.startTime).getTime()) /
							(1000 * 60)
					)}{' '}
					min
				</div>
			</div>
		</div>
	)
}

export default MeetingCard
