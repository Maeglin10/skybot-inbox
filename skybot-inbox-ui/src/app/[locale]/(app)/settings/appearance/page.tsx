export default function AppearancePage() {
  return (
    <div className="space-y-6">
       <div>
          <h2 className="text-2xl font-bold mb-1">Appearance</h2>
          <p className="text-sm text-muted-foreground">Customize the look and feel.</p>
       </div>
       
       <div className="ui-card p-6">
          <h3 className="text-sm font-semibold mb-3">Theme</h3>
          <div className="flex gap-4">
             <div className="border border-primary rounded-lg p-4 w-32 text-center cursor-pointer bg-muted/20">
                <div className="h-20 bg-gray-900 rounded mb-2 border border-border/50"></div>
                <span className="text-xs font-medium">Dark</span>
             </div>
             <div className="border border-border/30 rounded-lg p-4 w-32 text-center cursor-pointer hover:bg-muted/10 opacity-60">
                <div className="h-20 bg-white rounded mb-2 border border-border/50"></div>
                <span className="text-xs font-medium">Light</span>
             </div>
          </div>
       </div>
    </div>
  );
}
