import { Calendar, Settings } from 'lucide-react'
import { Link } from 'react-router'
import { useAuthenticator } from '@aws-amplify/ui-react'

const Navigation = () => {
	const { signOut, user } = useAuthenticator((context) => [
		context.signOut,
		context.user,
	])
	return (
		<nav className="bg-white shadow-sm border-b border-gray-200 mb-8">
			<div className="max-w-4xl mx-auto px-4">
				<div className="flex justify-between items-center h-16">
					<div className="flex items-center space-x-8">
						<div className="flex items-center">
							<div className="p-2 bg-blue-100 rounded-lg mr-3">
								<Calendar className="w-6 h-6 text-blue-600" />
							</div>
							<span className="text-xl font-bold text-gray-900">
								Calendar App
							</span>
						</div>

						<div className="flex space-x-4">
							<Link to="/" className="flex items-center">
								<Calendar className="w-4 h-4 inline mr-2" />
								Today's Meetings
							</Link>

							<Link to="/settings" className="flex items-center">
								<Settings className="w-4 h-4 inline mr-2" />
								Settings
							</Link>
							<div className="flex justify-end p-4">
								{user ? (
									<button
										className="bg-red-500 text-white p-2 rounded-md"
										onClick={signOut}
									>
										Sign out
									</button>
								) : (
									<button className="bg-red-500 text-white p-2 rounded-md">
										Sign in
									</button>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</nav>
	)
}

export default Navigation
