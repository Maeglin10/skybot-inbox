'use client';

import { CalendarEvent } from './calendar.types';

interface CalendarMonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
}

export default function CalendarMonthView({ currentDate, events }: CalendarMonthViewProps) {
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    
    // Add previous month's days
    const startPadding = firstDay.getDay(); // 0 = Sunday
    for (let i = startPadding - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, isCurrentMonth: false });
    }
    
    // Add current month's days
    for (let i = 1; i <= lastDay.getDate(); i++) {
        const d = new Date(year, month, i);
        days.push({ date: d, isCurrentMonth: true });
    }
    
    // Add next month's days to fill grid (42 cells likely)
    const endPadding = 42 - days.length;
    for (let i = 1; i <= endPadding; i++) {
        const d = new Date(year, month + 1, i);
        days.push({ date: d, isCurrentMonth: false });
    }
    
    return days;
  };

  const days = getDaysInMonth(currentDate);
  const weekDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getEventsForDay = (date: Date) => {
    return events.filter(e => 
      e.start.getDate() === date.getDate() &&
      e.start.getMonth() === date.getMonth() &&
      e.start.getFullYear() === date.getFullYear()
    );
  };

  const isToday = (date: Date) => {
      const today = new Date();
      return date.getDate() === today.getDate() &&
             date.getMonth() === today.getMonth() &&
             date.getFullYear() === today.getFullYear();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/30">
        {weekDayNames.map(day => (
          <div key={day} className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-6">
        {days.map((dayItem, idx) => {
            const dayEvents = getEventsForDay(dayItem.date);
            const isCurrentDay = isToday(dayItem.date);

            return (
                <div 
                    key={idx} 
                    className={`
                        min-h-[100px] border-b border-r border-border p-2 flex flex-col gap-1 transition-colors
                        ${!dayItem.isCurrentMonth ? 'bg-muted/10 text-muted-foreground' : ''}
                        ${(idx + 1) % 7 === 0 ? 'border-r-0' : ''} /* Remove right border for last col */
                        hover:bg-muted/20
                    `}
                >
                    <div className="flex justify-between items-start">
                        <span className={`
                            text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                            ${isCurrentDay ? 'bg-primary text-primary-foreground' : ''}
                        `}>
                            {dayItem.date.getDate()}
                        </span>
                    </div>

                    <div className="flex-1 flex flex-col gap-1 overflow-hidden mt-1">
                        {dayEvents.slice(0, 3).map(event => (
                            <div 
                                key={event.id}
                                className={`
                                    text-xs truncate px-1.5 py-0.5 rounded border
                                    ${event.type === 'meeting' ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400' : ''}
                                    ${event.type === 'task' ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400' : ''}
                                    ${event.type === 'call' ? 'bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400' : ''}
                                    ${event.type === 'reminder' ? 'bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400' : ''}
                                `}
                            >
                                {event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {event.title}
                            </div>
                        ))}
                        {dayEvents.length > 3 && (
                            <div className="text-[10px] text-muted-foreground px-1">
                                + {dayEvents.length - 3} more
                            </div>
                        )}
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
}
