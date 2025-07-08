export interface Meeting {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  attendees: string[];
  meetingType: 'work' | 'personal' | 'interview' | 'team' | 'client';
  status: 'upcoming' | 'ongoing' | 'completed';
  location?: string;
  isRecurring?: boolean;
}