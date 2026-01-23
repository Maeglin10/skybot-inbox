export type CalendarViewType = 'month' | 'week' | 'day';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  type: 'meeting' | 'task' | 'reminder' | 'call';
  category?: 'work' | 'personal' | 'urgent'; // Optional expansion
  attendees?: string[];
  location?: string;
}

export interface CalendarState {
  currentDate: Date;
  view: CalendarViewType;
  events: CalendarEvent[];
  isLoading: boolean;
  selectedEventId: string | null;
  isEventModalOpen: boolean;
}
