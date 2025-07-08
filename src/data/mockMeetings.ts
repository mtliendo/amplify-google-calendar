import { Meeting } from '../types/meeting';

// Get today's date for mock meetings
const today = new Date();
const todayStr = today.toISOString().split('T')[0];

export const mockMeetings: Meeting[] = [
  {
    id: '1',
    title: 'Morning Standup',
    description: 'Daily team sync',
    startTime: `${todayStr}T09:00:00`,
    endTime: `${todayStr}T09:30:00`,
    attendees: ['Alice', 'Bob', 'Carol'],
    meetingType: 'team',
    status: 'upcoming',
    location: 'Conference Room A'
  },
  {
    id: '2',
    title: 'Client Call',
    description: 'Project status update',
    startTime: `${todayStr}T11:00:00`,
    endTime: `${todayStr}T12:00:00`,
    attendees: ['Sarah Wilson', 'David Lee'],
    meetingType: 'client',
    status: 'upcoming',
    location: 'Zoom'
  },
  {
    id: '3',
    title: 'Lunch with Mark',
    description: 'Catch up over lunch',
    startTime: `${todayStr}T12:30:00`,
    endTime: `${todayStr}T13:30:00`,
    attendees: ['Mark Johnson'],
    meetingType: 'personal',
    status: 'upcoming',
    location: 'Downtown Cafe'
  },
  {
    id: '4',
    title: 'Design Review',
    description: 'Review new mockups',
    startTime: `${todayStr}T15:00:00`,
    endTime: `${todayStr}T16:00:00`,
    attendees: ['Emma Thompson', 'James Garcia'],
    meetingType: 'work',
    status: 'upcoming',
    location: 'Design Studio'
  }
];