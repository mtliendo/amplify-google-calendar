import React, { useState } from 'react';
import { Calendar, RefreshCw } from 'lucide-react';
import { Meeting } from '../types/meeting';
import { mockMeetings } from '../data/mockMeetings';
import MeetingsList from './MeetingsList';
import LoadingSpinner from './LoadingSpinner';

const MeetingsPage: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadMeetings = async () => {
    setLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setMeetings(mockMeetings);
    setLoading(false);
    setHasLoaded(true);
  };

  const todayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-blue-100 rounded-full mr-3">
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
          <div className="text-left">
            <h1 className="text-3xl font-bold text-gray-900">Today's Meetings</h1>
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
              {hasLoaded ? 'Refresh Calendar' : 'Load Today\'s Calendar'}
            </>
          )}
        </button>
      </div>

      {/* Meetings Count */}
      {hasLoaded && !loading && meetings.length > 0 && (
        <div className="text-center mb-6">
          <p className="text-gray-600">
            You have <span className="font-semibold text-gray-900">{meetings.length}</span> meeting{meetings.length !== 1 ? 's' : ''} today
          </p>
        </div>
      )}

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <MeetingsList meetings={meetings} />
        )}
      </div>
    </div>
  );
};

export default MeetingsPage;