import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'
import { Amplify } from 'aws-amplify'
import awsConfig from '../amplify_outputs.json'
import '@aws-amplify/ui-react/styles.css'
import { Authenticator } from '@aws-amplify/ui-react'
import { BrowserRouter, Route, Routes } from 'react-router'
import MeetingsPage from './pages/MeetingsPage.tsx'
import SettingsPage from './pages/SettingsPage.tsx'
import JiraTicketsPage from './pages/JiraTicketsPage.tsx'
import Navigation from './components/Navigation.tsx'

Amplify.configure(awsConfig)

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<Authenticator.Provider>
			<BrowserRouter>
				<Navigation />
				<Routes>
					<Route path="/" element={<MeetingsPage />} />
					<Route path="/tickets" element={<JiraTicketsPage />} />
					<Route path="/settings" element={<SettingsPage />} />
				</Routes>
			</BrowserRouter>
		</Authenticator.Provider>
	</StrictMode>
)
