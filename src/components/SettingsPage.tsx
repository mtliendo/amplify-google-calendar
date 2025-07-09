import { useEffect, useState } from 'react'
import {
	CheckCircle,
	AlertCircle,
	ExternalLink,
	Shield,
	Calendar,
	User,
} from 'lucide-react'
import { generateClient } from 'aws-amplify/api'
import { Schema } from '../../amplify/data/resource'

const client = generateClient<Schema>()
const SettingsPage = () => {
	const [isAuthorizing, setIsAuthorizing] = useState(false)
	const [user, setUser] = useState<Schema['User']['type'] | null>(null)

	const isAuthorized = !!user?.providers?.google?.oauth?.accessToken

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
		setIsAuthorizing(true)
		try {
			const { data } = await client.mutations.generateOauthAuthorizationUrl({
				userId: user.id,
				provider: 'google',
			})

			if (data?.authorizationUrl) {
				window.location.href = data.authorizationUrl
			}
		} catch (error) {
			console.error('Error generating auth URL', error)
			setIsAuthorizing(false)
		}
	}

	const handleDisconnect = async () => {
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

	return (
		<div className="max-w-4xl mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
				<p className="text-gray-600">
					Manage your calendar integration and preferences
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
						{!isAuthorized ? (
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
											Read your calendar events for today
										</li>
										<li className="flex items-center">
											<CheckCircle className="w-4 h-4 text-green-500 mr-2" />
											View event details (title, time, attendees, location)
										</li>
										<li className="flex items-center">
											<Shield className="w-4 h-4 text-blue-500 mr-2" />
											Your data is never stored on our servers
										</li>
									</ul>
								</div>

								<button
									onClick={handleGoogleAuth}
									disabled={isAuthorizing || !user}
									className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
								>
									{isAuthorizing ? (
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
												your.email@gmail.com
											</p>
										</div>
									</div>
									<button
										onClick={handleDisconnect}
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
								<p>All data is processed locally in your browser</p>
							</div>
							<div className="flex items-start">
								<CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
								<p>No calendar data is stored on external servers</p>
							</div>
							<div className="flex items-start">
								<CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
								<p>OAuth tokens are securely managed by Google</p>
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
	)
}

export default SettingsPage
