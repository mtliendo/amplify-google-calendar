import { useEffect, useState } from 'react'
import {
	CheckCircle,
	AlertCircle,
	ExternalLink,
	Shield,
	Calendar,
	User,
	ListTodo,
} from 'lucide-react'
import { generateClient } from 'aws-amplify/api'
import { Schema } from '../../amplify/data/resource'
import { Authenticator } from '@aws-amplify/ui-react'

const client = generateClient<Schema>()
const SettingsPage = () => {
	const [isAuthorizingGoogle, setIsAuthorizingGoogle] = useState(false)
	const [isAuthorizingJira, setIsAuthorizingJira] = useState(false)
	const [user, setUser] = useState<Schema['User']['type'] | null>(null)

	const isGoogleAuthorized = !!user?.providers?.google?.oauth?.accessToken
	const isJiraAuthorized = !!user?.providers?.jira?.oauth?.accessToken

	useEffect(() => {
		const fetchUser = async () => {
			const { data: users } = await client.models.User.list()
			if (users.length > 0) {
				const user = users[0]
				setUser(user)
			}
		}
		fetchUser()
	}, [])

	const handleGoogleAuth = async () => {
		if (!user) return
		setIsAuthorizingGoogle(true)
		try {
			const { data } =
				await client.mutations.generateGoogleOauthAuthorizationUrl({
					userId: user.id,
				})

			if (data?.authorizationUrl) {
				window.location.href = data.authorizationUrl
			}
		} catch (error) {
			console.error('Error generating auth URL', error)
			setIsAuthorizingGoogle(false)
		}
	}

	const handleJiraAuth = async () => {
		if (!user) return
		setIsAuthorizingJira(true)
		try {
			const { data } = await client.mutations.generateJiraOauthAuthorizationUrl(
				{
					userId: user.id,
				}
			)

			if (data?.authorizationUrl) {
				window.location.href = data.authorizationUrl
			}
		} catch (error) {
			console.error('Error generating auth URL', error)
			setIsAuthorizingJira(false)
		}
	}

	const handleGoogleDisconnect = async () => {
		if (!user) return
		try {
			await client.mutations.disconnectFromGoogleOauth({
				userId: user.id,
			})
			setUser((currentUser) => {
				if (!currentUser) return null
				const updatedUser = { ...currentUser }
				if (updatedUser.providers?.google) {
					updatedUser.providers.google = null
				}
				return updatedUser
			})
		} catch (error) {
			console.error('Error disconnecting from Google', error)
		}
	}

	const handleJiraDisconnect = async () => {
		if (!user) return
		try {
			await client.mutations.disconnectFromJiraOauth({
				userId: user.id,
			})
			setUser((currentUser) => {
				if (!currentUser) return null
				const updatedUser = { ...currentUser }
				if (updatedUser.providers?.jira) {
					updatedUser.providers.jira = null
				}
				return updatedUser
			})
		} catch (error) {
			console.error('Error disconnecting from Jira', error)
		}
	}

	return (
		<Authenticator>
			<div className="max-w-4xl mx-auto px-4 py-8">
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
					<p className="text-gray-600">
						Manage your integrations and preferences
					</p>
				</div>

				<div className="space-y-6">
					{/* Google Calendar Integration */}
					<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
						<div className="flex items-center mb-4">
							<div className="p-2 bg-blue-100 rounded-lg mr-3">
								<Calendar className="w-6 h-6 text-blue-600" />
							</div>
							<div>
								<h2 className="text-xl font-semibold text-gray-900">
									Google Calendar Integration
								</h2>
								<p className="text-gray-600">
									Connect your Google Calendar to view your meetings
								</p>
							</div>
						</div>

						<div className="border-t border-gray-100 pt-4">
							{!isGoogleAuthorized ? (
								<div className="space-y-4">
									<div className="flex items-start space-x-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
										<AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
										<div>
											<p className="text-sm font-medium text-amber-800">
												Authorization Required
											</p>
											<p className="text-sm text-amber-700 mt-1">
												You need to authorize access to your Google Calendar to
												view your meetings.
											</p>
										</div>
									</div>

									<div className="space-y-3">
										<h3 className="font-medium text-gray-900">
											What we'll access:
										</h3>
										<ul className="space-y-2 text-sm text-gray-600">
											<li className="flex items-center">
												<CheckCircle className="w-4 h-4 text-green-500 mr-2" />
												Read your calendar events
											</li>
											<li className="flex items-center">
												<CheckCircle className="w-4 h-4 text-green-500 mr-2" />
												View event details (title, time, attendees)
											</li>
											<li className="flex items-center">
												<Shield className="w-4 h-4 text-blue-500 mr-2" />
												Your data is securely stored
											</li>
										</ul>
									</div>

									<button
										onClick={handleGoogleAuth}
										disabled={isAuthorizingGoogle || !user}
										className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
									>
										{isAuthorizingGoogle ? (
											<>
												<div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
												Authorizing...
											</>
										) : (
											<>
												<ExternalLink className="w-5 h-5 mr-2" />
												Authorize Google Calendar
											</>
										)}
									</button>
								</div>
							) : (
								<div className="space-y-4">
									<div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
										<CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
										<div className="flex-1">
											<p className="text-sm font-medium text-green-800">
												Successfully Connected
											</p>
											<p className="text-sm text-green-700 mt-1">
												Your Google Calendar is connected and ready to use.
											</p>
										</div>
									</div>

									<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
										<div className="flex items-center">
											<User className="w-5 h-5 text-gray-400 mr-3" />
											<div>
												<p className="text-sm font-medium text-gray-900">
													Connected Account
												</p>
												<p className="text-sm text-gray-600">
													{user.email || 'your.email@gmail.com'}
												</p>
											</div>
										</div>
										<button
											onClick={handleGoogleDisconnect}
											className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
										>
											Disconnect
										</button>
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Jira Integration */}
					<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
						<div className="flex items-center mb-4">
							<div className="p-2 bg-indigo-100 rounded-lg mr-3">
								<ListTodo className="w-6 h-6 text-indigo-600" />
							</div>
							<div>
								<h2 className="text-xl font-semibold text-gray-900">
									Jira Integration
								</h2>
								<p className="text-gray-600">
									Connect your Jira account to view your tickets
								</p>
							</div>
						</div>

						<div className="border-t border-gray-100 pt-4">
							{!isJiraAuthorized ? (
								<div className="space-y-4">
									<div className="flex items-start space-x-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
										<AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
										<div>
											<p className="text-sm font-medium text-amber-800">
												Authorization Required
											</p>
											<p className="text-sm text-amber-700 mt-1">
												You need to authorize access to your Jira account to
												view your tickets.
											</p>
										</div>
									</div>

									<div className="space-y-3">
										<h3 className="font-medium text-gray-900">
											What we'll access:
										</h3>
										<ul className="space-y-2 text-sm text-gray-600">
											<li className="flex items-center">
												<CheckCircle className="w-4 h-4 text-green-500 mr-2" />
												Read your Jira issues
											</li>
											<li className="flex items-center">
												<CheckCircle className="w-4 h-4 text-green-500 mr-2" />
												View issue details (title, status, assignee)
											</li>
											<li className="flex items-center">
												<Shield className="w-4 h-4 text-blue-500 mr-2" />
												Your data is securely stored
											</li>
										</ul>
									</div>

									<button
										onClick={handleJiraAuth}
										disabled={isAuthorizingJira || !user}
										className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
									>
										{isAuthorizingJira ? (
											<>
												<div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
												Authorizing...
											</>
										) : (
											<>
												<ExternalLink className="w-5 h-5 mr-2" />
												Authorize Jira
											</>
										)}
									</button>
								</div>
							) : (
								<div className="space-y-4">
									<div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
										<CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
										<div className="flex-1">
											<p className="text-sm font-medium text-green-800">
												Successfully Connected
											</p>
											<p className="text-sm text-green-700 mt-1">
												Your Jira account is connected and ready to use.
											</p>
										</div>
									</div>

									<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
										<div className="flex items-center">
											<User className="w-5 h-5 text-gray-400 mr-3" />
											<div>
												<p className="text-sm font-medium text-gray-900">
													Connected Account
												</p>
												<p className="text-sm text-gray-600">
													{user.email || 'your.email@atlassian.com'}
												</p>
											</div>
										</div>
										<button
											onClick={handleJiraDisconnect}
											className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
										>
											Disconnect
										</button>
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Privacy & Security */}
					<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
						<div className="flex items-center mb-4">
							<div className="p-2 bg-green-100 rounded-lg mr-3">
								<Shield className="w-6 h-6 text-green-600" />
							</div>
							<div>
								<h2 className="text-xl font-semibold text-gray-900">
									Privacy & Security
								</h2>
								<p className="text-gray-600">How we protect your data</p>
							</div>
						</div>

						<div className="border-t border-gray-100 pt-4">
							<div className="space-y-3 text-sm text-gray-600">
								<div className="flex items-start">
									<CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
									<p>OAuth tokens are encrypted and securely stored</p>
								</div>
								<div className="flex items-start">
									<CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
									<p>We only access the data you explicitly authorize</p>
								</div>
								<div className="flex items-start">
									<CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
									<p>Tokens are automatically refreshed when needed</p>
								</div>
								<div className="flex items-start">
									<CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
									<p>You can revoke access at any time</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</Authenticator>
	)
}

export default SettingsPage
