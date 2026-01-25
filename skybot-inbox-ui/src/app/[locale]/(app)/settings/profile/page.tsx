'use client';

import * as React from 'react';
import { Camera } from 'lucide-react';

export default function ProfilePage() {
  const [loading, setLoading] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const handleSave = async () => {
    setLoading(true);
    // mock save delay
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-8">
       <div className="flex items-end justify-between border-b border-border/20 pb-4">
          <div>
             <h2 className="text-2xl font-bold mb-1">Profile</h2>
             <p className="text-sm text-muted-foreground">Manage your personal information and avatar.</p>
          </div>
       </div>

       <div className="grid gap-8">
          <section className="ui-card p-6 flex flex-col sm:flex-row gap-6 items-start">
             <div className="relative group cursor-pointer">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-3xl font-bold text-primary border-4 border-background shadow-lg">
                  JD
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <Camera className="text-white" size={24} />
                </div>
             </div>
             <div className="flex-1 space-y-4 max-w-md w-full">
                <div className="grid gap-1.5">
                   <label className="text-xs font-semibold uppercase text-muted-foreground">Display Name</label>
                   <input className="ui-input bg-background/50" defaultValue="John Doe" />
                </div>
                <div className="grid gap-1.5">
                   <label className="text-xs font-semibold uppercase text-muted-foreground">Email Address</label>
                   <input className="ui-input bg-background/50" defaultValue="john.doe@example.com" />
                </div>
                <div className="grid gap-1.5">
                   <label className="text-xs font-semibold uppercase text-muted-foreground">Role</label>
                   <input className="ui-input bg-muted/50 text-muted-foreground cursor-not-allowed" disabled defaultValue="Administrator" />
                </div>
             </div>
          </section>
       </div>

       <div className="flex items-center justify-end gap-3 pt-4">
          {saved && <span className="text-xs font-medium text-green-500 animate-in fade-in">Changes saved successfully!</span>}
          <button 
             onClick={handleSave} 
             disabled={loading}
             className="ui-btn ui-btn--primary min-w-[100px]"
          >
             {loading ? 'Saving...' : 'Save Changes'}
          </button>
       </div>
    </div>
  );
}
