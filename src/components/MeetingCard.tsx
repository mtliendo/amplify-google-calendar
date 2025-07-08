import React from 'react';
import { Meeting } from '../types/meeting';
import { Clock, MapPin, Users, Video } from 'lucide-react';

interface MeetingCardProps {
  meeting: Meeting;
}

const MeetingCard: React.FC<MeetingCardProps> = ({ meeting }) => {
  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getMeetingTypeColor = (type: string) => {
    switch (type) {
      case 'work': return 'bg-blue-100 text-blue-800';
      case 'personal': return 'bg-pink-100 text-pink-800';
      case 'team': return 'bg-green-100 text-green-800';
      case 'client': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isVirtual = meeting.location?.toLowerCase().includes('zoom') || 
                   meeting.location?.toLowerCase().includes('meet');

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 p-4">
      <div className="flex items-start justify-between mb-3">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMeetingTypeColor(meeting.meetingType)}`}>
          {meeting.meetingType}
        </span>
        <div className="text-sm font-medium text-gray-900">
          {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">{meeting.title}</h3>
      
      {meeting.description && (
        <p className="text-gray-600 text-sm mb-3">{meeting.description}</p>
      )}

      <div className="space-y-2">
        {meeting.location && (
          <div className="flex items-center text-sm text-gray-500">
            {isVirtual ? (
              <Video className="w-4 h-4 mr-2 text-blue-500" />
            ) : (
              <MapPin className="w-4 h-4 mr-2 text-gray-400" />
            )}
            {meeting.location}
          </div>
        )}
        
        <div className="flex items-center text-sm text-gray-500">
          <Users className="w-4 h-4 mr-2 text-gray-400" />
          {meeting.attendees.length === 1 ? 
            meeting.attendees[0] : 
            `${meeting.attendees.length} attendees`
          }
        </div>

        <div className="flex items-center text-sm text-gray-500">
          <Clock className="w-4 h-4 mr-2 text-gray-400" />
          {Math.round((new Date(meeting.endTime).getTime() - new Date(meeting.startTime).getTime()) / (1000 * 60))} min
        </div>
      </div>
    </div>
  );
};

export default MeetingCard;