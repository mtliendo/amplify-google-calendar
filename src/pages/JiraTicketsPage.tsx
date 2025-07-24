import React, { useState } from 'react'
import {
	ListTodo,
	RefreshCw,
	Clock,
	User,
	AlertCircle,
	Tag,
} from 'lucide-react'
import { generateClient } from 'aws-amplify/api'
import { Schema } from '../../amplify/data/resource'
import { Authenticator } from '@aws-amplify/ui-react'
import { DateTime } from 'luxon'

const client = generateClient<Schema>()

interface JiraTicket {
	id: string
	key: string
	summary: string
	description: string
	status: string
	assignee: string
	reporter: string
	created: string
	updated: string
	priority: string
	issueType: string
}

const JiraTicketsPage: React.FC = () => {
	const [tickets, setTickets] = useState<JiraTicket[]>([])
	const [loading, setLoading] = useState(false)
	const [hasLoaded, setHasLoaded] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const loadTickets = async () => {
		setLoading(true)
		setError(null)
		try {
			const { data: users } = await client.models.User.list()
			const user = users[0]

			if (!user) {
				throw new Error('No user found')
			}

			const { data, errors } = await client.queries.listJiraTickets({
				userIdInDb: user.id,
			})

			if (errors) {
				setError(errors[0].message)
				setTickets([])
			} else if (data?.tickets) {
				const mappedTickets = data.tickets as unknown as JiraTicket[]
				setTickets(mappedTickets)
			} else {
				setTickets([])
			}

			setHasLoaded(true)
		} catch (err) {
			console.error('Error loading tickets:', err)
			setError('Failed to load Jira tickets')
			setTickets([])
		} finally {
			setLoading(false)
		}
	}

	const formatDate = (dateString: string) => {
		return DateTime.fromISO(dateString).toRelative() || dateString
	}

	const getPriorityColor = (priority: string) => {
		switch (priority.toLowerCase()) {
			case 'highest':
			case 'high':
				return 'text-red-600 bg-red-50'
			case 'medium':
				return 'text-yellow-600 bg-yellow-50'
			case 'low':
			case 'lowest':
				return 'text-green-600 bg-green-50'
			default:
				return 'text-gray-600 bg-gray-50'
		}
	}

	const getStatusColor = (status: string) => {
		switch (status.toLowerCase()) {
			case 'done':
			case 'resolved':
			case 'closed':
				return 'text-green-600 bg-green-50'
			case 'in progress':
			case 'in development':
			case 'in review':
				return 'text-blue-600 bg-blue-50'
			case 'to do':
			case 'open':
			case 'backlog':
				return 'text-gray-600 bg-gray-50'
			default:
				return 'text-gray-600 bg-gray-50'
		}
	}

	return (
		<Authenticator>
			<div className="max-w-6xl mx-auto px-4 py-8">
				{/* Header */}
				<div className="text-center mb-8">
					<div className="flex items-center justify-center mb-4">
						<div className="p-3 bg-indigo-100 rounded-full mr-3">
							<ListTodo className="w-8 h-8 text-indigo-600" />
						</div>
						<div className="text-left">
							<h1 className="text-3xl font-bold text-gray-900">Jira Tickets</h1>
							<p className="text-gray-600">
								View and manage your assigned tickets
							</p>
						</div>
					</div>

					{/* Load Tickets Button */}
					<button
						onClick={loadTickets}
						disabled={loading}
						className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
					>
						{loading ? (
							<>
								<RefreshCw className="w-5 h-5 mr-2 animate-spin" />
								Loading...
							</>
						) : (
							<>
								<ListTodo className="w-5 h-5 mr-2" />
								{hasLoaded ? 'Refresh Tickets' : 'Load Tickets'}
							</>
						)}
					</button>
				</div>

				{/* Error State */}
				{error && (
					<div className="mb-6 flex items-center justify-center">
						<div className="flex items-start space-x-3 p-4 bg-red-50 rounded-lg border border-red-200">
							<AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
							<div>
								<p className="text-sm font-medium text-red-800">
									Error loading tickets
								</p>
								<p className="text-sm text-red-700 mt-1">{error}</p>
							</div>
						</div>
					</div>
				)}

				{/* Tickets Count */}
				{hasLoaded && !loading && tickets.length > 0 && !error && (
					<div className="text-center mb-6">
						<p className="text-gray-600">
							You have{' '}
							<span className="font-semibold text-gray-900">
								{tickets.length}
							</span>{' '}
							ticket{tickets.length !== 1 ? 's' : ''}
						</p>
					</div>
				)}

				{/* Tickets List */}
				<div className="bg-white rounded-xl shadow-sm border border-gray-200">
					{loading ? (
						<div className="p-12 text-center">
							<RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
							<p className="text-gray-500">Loading your Jira tickets...</p>
						</div>
					) : hasLoaded && tickets.length === 0 && !error ? (
						<div className="p-12 text-center">
							<ListTodo className="w-12 h-12 text-gray-300 mx-auto mb-4" />
							<p className="text-gray-500 mb-2">No tickets found</p>
							<p className="text-sm text-gray-400">
								You don't have any assigned tickets at the moment
							</p>
						</div>
					) : (
						<div className="divide-y divide-gray-200">
							{tickets.map((ticket) => (
								<div
									key={ticket.id}
									className="p-6 hover:bg-gray-50 transition-colors"
								>
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<div className="flex items-center mb-2">
												<span className="text-sm font-medium text-gray-500 mr-3">
													{ticket.key}
												</span>
												<span
													className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}
												>
													{ticket.status}
												</span>
												<span
													className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-2 ${getPriorityColor(ticket.priority)}`}
												>
													{ticket.priority}
												</span>
											</div>
											<h3 className="text-lg font-medium text-gray-900 mb-2">
												{ticket.summary}
											</h3>
											{ticket.description && (
												<p className="text-sm text-gray-600 mb-3 line-clamp-2">
													{ticket.description}
												</p>
											)}
											<div className="flex items-center space-x-4 text-sm text-gray-500">
												<div className="flex items-center">
													<User className="w-4 h-4 mr-1" />
													<span>Assignee: {ticket.assignee}</span>
												</div>
												<div className="flex items-center">
													<Tag className="w-4 h-4 mr-1" />
													<span>{ticket.issueType}</span>
												</div>
												<div className="flex items-center">
													<Clock className="w-4 h-4 mr-1" />
													<span>Updated {formatDate(ticket.updated)}</span>
												</div>
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</Authenticator>
	)
}

export default JiraTicketsPage
