export default function LanguagePage() {
  return (
    <div className="space-y-6">
       <div>
          <h2 className="text-2xl font-bold mb-1">Language</h2>
          <p className="text-sm text-muted-foreground">Select your interface language.</p>
       </div>
       <div className="ui-card p-6 max-w-lg flex items-center gap-4">
          <label className="text-sm font-medium">System Language</label>
          <select className="ui-input h-9 w-full bg-transparent border-input text-foreground text-sm">
             <option>English</option>
             <option>Français</option>
             <option>Español</option>
          </select>
       </div>
    </div>
  );
}
