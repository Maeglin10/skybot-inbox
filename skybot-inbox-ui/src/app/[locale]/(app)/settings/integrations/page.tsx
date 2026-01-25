export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
       <div>
          <h2 className="text-2xl font-bold mb-1">Integrations</h2>
          <p className="text-sm text-muted-foreground">Connect third-party tools.</p>
       </div>
       <div className="grid gap-4">
          {['Google Calendar', 'Airtable', 'Slack', 'Zapier'].map(app => (
             <div key={app} className="ui-card p-4 flex items-center justify-between">
                <span className="font-semibold">{app}</span>
                <button className="ui-btn h-8 text-xs">Connect</button>
             </div>
          ))}
       </div>
    </div>
  );
}
