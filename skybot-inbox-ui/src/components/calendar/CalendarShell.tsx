'use client';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Plus } from 'lucide-react';
import { CalendarEvent, CalendarViewType } from './calendar.types';
import { calendarAdapter } from './calendarAdapter';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import CalendarMonthView from '@/components/calendar/CalendarMonthView';
import CalendarWeekView from './CalendarWeekView';
import EventDialog from './EventDialog';
import { useTranslations } from '@/lib/translations';

export default function CalendarShell() {
  const t = useTranslations('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Changed default view to 'week' as requested
  const [view, setView] = useState<CalendarViewType>('week');
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedEvent, setSelectedEvent] = useState<Partial<CalendarEvent> | null>(null);

  useEffect(() => {
    fetchEvents();
  }, [currentDate]); 

  const fetchEvents = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await calendarAdapter.getEvents();
      setEvents(data);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const nextPeriod = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const prevPeriod = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const today = () => {
    setCurrentDate(new Date());
  };

  // Event Handlers
  const handleSlotClick = (start: Date) => {
    const end = new Date(start);
    end.setHours(start.getHours() + 1);

    setSelectedEvent({
        start,
        end,
        title: '',
        type: 'meeting'
    });
    setDialogMode('create');
    setIsDialogOpen(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setDialogMode('view');
    setIsDialogOpen(true);
  };

  const handleCreateNew = () => {
      const now = new Date();
      now.setMinutes(0, 0, 0);
      const end = new Date(now);
      end.setHours(now.getHours() + 1);
      
      setSelectedEvent({
         start: now,
         end,
         title: '',
         type: 'meeting'
      });
      setDialogMode('create');
      setIsDialogOpen(true);
  };

  const handleSaveEvent = async (eventData: Partial<CalendarEvent>) => {
     try {
         if (dialogMode === 'create') {
             const newEvent = await calendarAdapter.createEvent(eventData as Omit<CalendarEvent, 'id'>);
             setEvents([...events, newEvent]);
         } 
         // Implementation for edit would go here if we added full edit flow
     } catch (err) {
         console.error('Failed to save event', err);
         alert('Failed to save event');
     } finally {
         fetchEvents(); // Refresh to be safe/simple
         setIsDialogOpen(false);
     }
  };

  const handleDeleteEvent = async (id: string) => {
      try {
          await calendarAdapter.deleteEvent(id);
          setEvents(events.filter(e => e.id !== id));
      } catch (err) {
          console.error(err);
          alert('Failed to delete event');
      } finally {
           setIsDialogOpen(false);
      }
  };

  const monthName = currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
  // Capitalize first letter
  const formattedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold w-64">
            {view === 'week' 
                ? `${t('week')} ${currentDate.toLocaleDateString()}` 
                : formattedMonthName
            }
          </h2>
          <div className="flex items-center bg-muted rounded-md p-1 border border-border">
            <button 
              onClick={prevPeriod}
              className="p-1 hover:bg-surface rounded-sm transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              onClick={today}
              className="px-3 py-1 text-sm font-medium hover:bg-surface rounded-sm transition-colors"
            >
              {t('today')}
            </button>
            <button 
              onClick={nextPeriod}
              className="p-1 hover:bg-surface rounded-sm transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-muted rounded-md p-1 border border-border">
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1 text-sm rounded-sm transition-colors ${view === 'month' ? 'bg-surface shadow-sm' : 'hover:bg-surface/50'}`}
            >
              {t('month')}
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1 text-sm rounded-sm transition-colors ${view === 'week' ? 'bg-surface shadow-sm' : 'hover:bg-surface/50'}`}
            >
              {t('week')}
            </button>
          </div>
          
          <Button className="gap-2" onClick={handleCreateNew}>
            <Plus size={16} />
            <span>Event</span>
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-surface/50 z-10 flex items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        )}
        
        {error ? (
          <div className="flex items-center justify-center h-full">
            <ErrorState onRetry={fetchEvents} />
          </div>
        ) : (
          <>
            {view === 'month' && (
              <CalendarMonthView 
                currentDate={currentDate} 
                events={events} 
              />
            )}
            
            {view === 'week' && (
              <CalendarWeekView
                currentDate={currentDate}
                events={events}
                onEventClick={handleEventClick}
                onSlotClick={handleSlotClick}
              />
            )}
          </>
        )}
      </div>

      <EventDialog
        isOpen={isDialogOpen}
        mode={dialogMode}
        initialData={selectedEvent}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
      />
    </div>
  );
}
