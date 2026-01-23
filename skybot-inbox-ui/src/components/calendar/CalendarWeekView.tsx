'use client';

import { CalendarEvent } from './calendar.types';

interface CalendarWeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onSlotClick: (start: Date) => void;
}

export default function CalendarWeekView({ 
  currentDate, 
  events, 
  onEventClick,
  onSlotClick 
}: CalendarWeekViewProps) {
  // Generate days for the week (Monday start)
  const getDaysInWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(d.setDate(diff));
    
    const days = [];
    for (let i = 0; i < 7; i++) {
        const nextDay = new Date(monday);
        nextDay.setDate(monday.getDate() + i);
        days.push(nextDay);
    }
    return days;
  };

  const days = getDaysInWeek(currentDate);
  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 to 20:00

  const getEventsForDay = (date: Date) => {
    return events.filter(e => 
      e.start.getDate() === date.getDate() &&
      e.start.getMonth() === date.getMonth() &&
      e.start.getFullYear() === date.getFullYear() &&
      !e.allDay
    );
  };

  const isToday = (date: Date) => {
      const today = new Date();
      return date.getDate() === today.getDate() &&
             date.getMonth() === today.getMonth() &&
             date.getFullYear() === today.getFullYear();
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
        {/* Header (Days) */}
        <div className="grid grid-cols-8 border-b border-border bg-muted/30 flex-none pr-4"> {/* +1 for timeline col, pr for scrollbar */}
            <div className="p-2 border-r border-border/50 text-xs text-muted-foreground text-center">
                GMT+1
            </div>
            {days.map((day, i) => (
                <div key={i} className={`p-2 text-center border-r border-border/50 last:border-r-0 ${isToday(day) ? 'bg-primary/5' : ''}`}>
                    <div className="text-xs uppercase text-muted-foreground font-semibold">
                        {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className={`text-sm font-bold w-7 h-7 mx-auto flex items-center justify-center rounded-full mt-1 ${isToday(day) ? 'bg-primary text-primary-foreground' : ''}`}>
                        {day.getDate()}
                    </div>
                </div>
            ))}
        </div>

        {/* Scrollable Time Grid */}
        <div className="flex-1 overflow-y-auto relative">
             <div className="grid grid-cols-8 relative min-h-[600px]">
                 
                 {/* Timeline Column */}
                 <div className="border-r border-border/50 bg-background sticky left-0 z-10">
                     {hours.map(hour => (
                         <div key={hour} className="h-20 border-b border-border/30 text-xs text-muted-foreground relative">
                             <span className="absolute -top-2.5 right-2 bg-background px-1">
                                 {hour.toString().padStart(2, '0')}:00
                             </span>
                         </div>
                     ))}
                 </div>

                 {/* Day Columns */}
                 {days.map((day, dayIdx) => {
                     const dayEvents = getEventsForDay(day);
                     
                     return (
                         <div 
                             key={dayIdx} 
                             className="border-r border-border/50 relative h-full bg-surface/30 hover:bg-muted/10 transition-colors"
                         >
                             {/* Hour Slots (for clicking) */}
                             {hours.map(hour => (
                                 <div 
                                     key={hour} 
                                     className="h-20 border-b border-border/30 cursor-pointer"
                                     onClick={() => {
                                         const slotDate = new Date(day);
                                         slotDate.setHours(hour, 0, 0, 0);
                                         onSlotClick(slotDate);
                                     }}
                                 ></div>
                             ))}

                             {/* Events Overlay */}
                             {dayEvents.map(event => {
                                 const startHour = event.start.getHours();
                                 const startMinute = event.start.getMinutes();
                                 const endHour = event.end.getHours();
                                 const endMinute = event.end.getMinutes();
                                 
                                 // Calculate top offset (relative to 08:00 start)
                                 const startTotalMinutes = (startHour * 60) + startMinute;
                                 const gridStartMinutes = 8 * 60; // 08:00
                                 const top = ((startTotalMinutes - gridStartMinutes) / 60) * 80; // 80px per hour
                                 
                                 // Calculate height
                                 const durationMinutes = ((endHour * 60) + endMinute) - startTotalMinutes;
                                 const height = (durationMinutes / 60) * 80;

                                 // Skip if before start time
                                 if (top < 0) return null;

                                 return (
                                     <div
                                         key={event.id}
                                         onClick={(e) => {
                                             e.stopPropagation();
                                             onEventClick(event);
                                         }}
                                         className={`
                                             absolute left-1 right-1 rounded px-2 py-1 text-xs border cursor-pointer hover:brightness-95 transition-all shadow-sm z-10
                                             ${event.type === 'meeting' ? 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300' : ''}
                                             ${event.type === 'task' ? 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300' : ''}
                                             ${event.type === 'call' ? 'bg-orange-500/10 border-orange-500/20 text-orange-700 dark:text-orange-300' : ''}
                                             ${event.type === 'reminder' ? 'bg-purple-500/10 border-purple-500/20 text-purple-700 dark:text-purple-300' : ''}
                                         `}
                                         style={{ top: `${top}px`, height: `${Math.max(height, 24)}px` }}
                                     >
                                         <div className="font-semibold truncate leading-none mb-1">
                                             {event.title}
                                         </div>
                                         <div className="truncate opacity-80 text-[10px]">
                                             {event.start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - 
                                             {event.end.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                         </div>
                                     </div>
                                 );
                             })}
                         </div>
                     );
                 })}
             </div>
        </div>
    </div>
  );
}
