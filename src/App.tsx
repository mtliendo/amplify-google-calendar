import React, { useState } from 'react';
import Navigation from './components/Navigation';
import MeetingsPage from './components/MeetingsPage';
import SettingsPage from './components/SettingsPage';

function App() {
  const [currentPage, setCurrentPage] = useState<'meetings' | 'settings'>('meetings');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
      
      {currentPage === 'meetings' ? (
        <MeetingsPage />
      ) : (
        <SettingsPage />
      )}
    </div>
  );
}

export default App;