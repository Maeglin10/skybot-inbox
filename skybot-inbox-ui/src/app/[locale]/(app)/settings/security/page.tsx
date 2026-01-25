export default function SecurityPage() {
  return (
    <div className="space-y-6">
       <div>
          <h2 className="text-2xl font-bold mb-1">Security</h2>
          <p className="text-sm text-muted-foreground">Update password and security settings.</p>
       </div>

       <div className="ui-card p-6 space-y-4 max-w-lg">
          <div>
             <label className="text-xs font-medium mb-1.5 block">Current Password</label>
             <input type="password" className="ui-input bg-transparent border-input text-foreground text-sm" />
          </div>
          <div>
             <label className="text-xs font-medium mb-1.5 block">New Password</label>
             <input type="password" className="ui-input bg-transparent border-input text-foreground text-sm" />
          </div>
          <div>
             <label className="text-xs font-medium mb-1.5 block">Confirm Password</label>
             <input type="password" className="ui-input bg-transparent border-input text-foreground text-sm" />
          </div>
       </div>
       
       <div className="flex justify-end max-w-lg">
          <button className="ui-btn ui-btn--primary">Update Password</button>
       </div>
    </div>
  );
}
