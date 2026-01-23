import { CalendarEvent } from './calendar.types';

// In-memory store for events to persist during session
let memoryEvents: CalendarEvent[] = [];
let initialized = false;

const CONTRIBUTORS = [
  'Alice Johnson',
  'Bob Smith', 
  'Charlie Brown',
  'Diana Prince'
];

const EVENT_TYPES: CalendarEvent['type'][] = ['meeting', 'task', 'reminder', 'call'];

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addHours(date: Date, hours: number) {
  const d = new Date(date);
  d.setHours(d.getHours() + hours);
  return d;
}

// Generate initial mock data if empty
function initializeMockData() {
    if (initialized) return;
    
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    const events: CalendarEvent[] = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Generate random events for current and adjacent months
    for (let m = month - 1; m <= month + 1; m++) {
         const mDays = new Date(year, m + 1, 0).getDate();
         for (let i = 1; i <= mDays; i++) {
            if (Math.random() > 0.7) continue;

            const numEvents = getRandomInt(1, 3);
            
            for (let j = 0; j < numEvents; j++) {
                const startHour = getRandomInt(8, 17);
                const duration = getRandomInt(1, 2);
                const date = new Date(year, m, i, startHour, 0);
                
                events.push({
                    id: Math.random().toString(36).substr(2, 9),
                    title: `Sample Event ${m+1}/${i}`,
                    description: 'This is a mock event description.',
                    start: date,
                    end: addHours(date, duration),
                    allDay: Math.random() > 0.9,
                    type: EVENT_TYPES[getRandomInt(0, 3)],
                    attendees: CONTRIBUTORS.slice(0, getRandomInt(1, 3)),
                    location: Math.random() > 0.5 ? 'Conference Room A' : 'Zoom',
                });
            }
        }
    }
    
    memoryEvents = events;
    initialized = true;
}

export const calendarAdapter = {
  getEvents: async (): Promise<CalendarEvent[]> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 400));
    initializeMockData();
    return [...memoryEvents];
  },

  createEvent: async (event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const newEvent: CalendarEvent = {
        ...event,
        id: Math.random().toString(36).substr(2, 9)
    };
    memoryEvents.push(newEvent);
    return newEvent;
  },

  updateEvent: async (id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const index = memoryEvents.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Event not found');
    
    memoryEvents[index] = { ...memoryEvents[index], ...updates };
    return memoryEvents[index];
  },

  deleteEvent: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    memoryEvents = memoryEvents.filter(e => e.id !== id);
  }
};
