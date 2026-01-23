'use client';

import { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock, AlignLeft, Type } from 'lucide-react';
import { CalendarEvent } from './calendar.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface EventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Partial<CalendarEvent>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  initialData?: Partial<CalendarEvent> | null;
  mode: 'create' | 'edit' | 'view';
}

export default function EventDialog({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete,
  initialData, 
  mode 
}: EventDialogProps) {
  const [formData, setFormData] = useState<Partial<CalendarEvent>>({
    title: '',
    description: '',
    type: 'meeting',
    allDay: false
  });
  
  const [startDateStr, setStartDateStr] = useState('');
  const [startTimeStr, setStartTimeStr] = useState('');
  const [endTimeStr, setEndTimeStr] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData && isOpen) {
       setFormData({ ...initialData });
       
       // Parse dates for inputs
       if (initialData.start) {
           setStartDateStr(initialData.start.toISOString().split('T')[0]);
           setStartTimeStr(initialData.start.toTimeString().slice(0, 5));
       }
       if (initialData.end) {
           setEndTimeStr(initialData.end.toTimeString().slice(0, 5));
       }
    } else {
       // Reset
       setFormData({ title: '', description: '', type: 'meeting' });
       setStartDateStr('');
       setStartTimeStr('09:00');
       setEndTimeStr('10:00');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Reconstruct dates
    const start = new Date(`${startDateStr}T${startTimeStr}`);
    const end = new Date(`${startDateStr}T${endTimeStr}`);
    
    try {
        await onSave({
            ...formData,
            start,
            end
        });
        onClose();
    } catch (err) {
        console.error(err);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
      if (!onDelete || !initialData?.id) return;
      if (!confirm('Are you sure you want to delete this event?')) return;
      
      setIsSubmitting(true);
      try {
          await onDelete(initialData.id);
          onClose();
      } catch (err) {
          console.error(err);
          setIsSubmitting(false);
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface border border-border shadow-lg rounded-lg w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-lg">
            {mode === 'create' && 'New Event'}
            {mode === 'edit' && 'Edit Event'}
            {mode === 'view' && 'Event Details'}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto space-y-4">
             {mode === 'view' ? (
                 <div className="space-y-4">
                     <div>
                         <h4 className="text-xl font-bold mb-1">{formData.title}</h4>
                         <span className={`
                             inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold
                             ${formData.type === 'meeting' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : ''}
                             ${formData.type === 'task' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : ''}
                             ${formData.type === 'call' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' : ''}
                             ${formData.type === 'reminder' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' : ''}
                         `}>
                             {formData.type?.toUpperCase()}
                         </span>
                     </div>
                     
                     <div className="flex items-start gap-3 text-sm text-muted-foreground">
                         <Clock size={16} className="mt-0.5" />
                         <div>
                             <div>{initialData?.start?.toLocaleDateString()}</div>
                             <div>
                                 {initialData?.start?.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - 
                                 {initialData?.end?.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                             </div>
                         </div>
                     </div>

                     {formData.description && (
                         <div className="flex items-start gap-3 text-sm">
                             <AlignLeft size={16} className="mt-0.5 text-muted-foreground" />
                             <p className="whitespace-pre-wrap">{formData.description}</p>
                         </div>
                     )}
                 </div>
             ) : (
                 <form id="event-form" onSubmit={handleSubmit} className="space-y-4">
                     <div className="space-y-2">
                         <label className="text-sm font-medium">Title</label>
                         <div className="relative">
                             <Type className="absolute left-3 top-2.5 text-muted-foreground h-4 w-4" />
                             <Input 
                                 className="pl-9" 
                                 placeholder="Event title" 
                                 required
                                 value={formData.title}
                                 onChange={e => setFormData({...formData, title: e.target.value})}
                             />
                         </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2 col-span-2">
                             <label className="text-sm font-medium">Date</label>
                             <div className="relative">
                                 <CalendarIcon className="absolute left-3 top-2.5 text-muted-foreground h-4 w-4" />
                                 <Input 
                                    className="pl-9"
                                    type="date"
                                    required
                                    value={startDateStr}
                                    onChange={e => setStartDateStr(e.target.value)}
                                 />
                             </div>
                         </div>
                         
                         <div className="space-y-2">
                             <label className="text-sm font-medium">Start Time</label>
                             <div className="relative">
                                 <Clock className="absolute left-3 top-2.5 text-muted-foreground h-4 w-4" />
                                 <Input 
                                    className="pl-9"
                                    type="time" 
                                    required
                                    value={startTimeStr}
                                    onChange={e => setStartTimeStr(e.target.value)}
                                 />
                             </div>
                         </div>

                         <div className="space-y-2">
                             <label className="text-sm font-medium">End Time</label>
                             <div className="relative">
                                 <Clock className="absolute left-3 top-2.5 text-muted-foreground h-4 w-4" />
                                 <Input 
                                    className="pl-9"
                                    type="time" 
                                    required
                                    value={endTimeStr}
                                    onChange={e => setEndTimeStr(e.target.value)}
                                 />
                             </div>
                         </div>
                     </div>

                     <div className="space-y-2">
                         <label className="text-sm font-medium">Type</label>
                         <select 
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            value={formData.type}
                            onChange={e => setFormData({...formData, type: e.target.value as CalendarEvent['type']})}
                         >
                             <option value="meeting">Meeting</option>
                             <option value="task">Task</option>
                             <option value="call">Call</option>
                             <option value="reminder">Reminder</option>
                         </select>
                     </div>

                     <div className="space-y-2">
                         <label className="text-sm font-medium">Description</label>
                         <Textarea 
                            placeholder="Add details..." 
                            rows={3}
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                         />
                     </div>
                 </form>
             )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/10 flex justify-end gap-2">
            {mode === 'view' ? (
                <>
                    <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
                        Delete
                    </Button>
                    <Button onClick={() => { /* Switch mode via parent if needed, complicated with current setup so just close for now or implement edit switch */ onClose() }} variant="outline">
                        Close
                    </Button>
                    {/* Simplified: no 'Switch to Edit' implemented in this specific block to keep it clean, but could be added */}
                </>
            ) : (
                <>
                    <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
                    <Button type="submit" form="event-form" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Event'}
                    </Button>
                </>
            )}
        </div>
      </div>
    </div>
  );
}
