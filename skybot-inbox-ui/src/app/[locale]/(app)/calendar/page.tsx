import CalendarShell from '@/components/calendar/CalendarShell';

export const dynamic = "force-dynamic";

export default function CalendarPage() {
  return (
    <div className="ui-page p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="ui-pageTitle">Calendar</h1>
          <p className="ui-pageSubtitle">Manage your schedule and events.</p>
        </div>
      </div>
      
      <div className="flex-1 min-h-0 bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
        <CalendarShell />
      </div>
    </div>
  );
}
