'use client';

import * as React from 'react';
<<<<<<< Updated upstream
import { Camera } from 'lucide-react';
=======
import { useTranslations } from '@/lib/translations';
import { Camera, Mail, User, Shield, Activity, UserCircle } from 'lucide-react';
import { apiGetClient, apiPatchClient } from '@/lib/api.client';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  avatarUrl?: string; // Optional if we support it later
}
>>>>>>> Stashed changes

export default function ProfilePage() {
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

<<<<<<< Updated upstream
=======
  const [formData, setFormData] = React.useState<UserProfile | null>(null);

  // Load initial data
  React.useEffect(() => {
    let mounted = true;
    setLoading(true);
    
    apiGetClient('users/me')
      .then((data: any) => {
         if(mounted) {
            setFormData({
               id: data.id || '',
               username: data.username || '',
               email: data.email || 'user@example.com', // fallback if backend doesn't send email
               role: data.role || 'User',
               status: data.active ? 'Active' : 'Inactive'
            });
         }
      })
      .catch((err) => {
         if(mounted) setError('Failed to load profile');
         console.error(err);
      })
      .finally(() => {
         if(mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, []);

>>>>>>> Stashed changes
  const handleSave = async () => {
    if(!formData) return;
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
       // Only sending updatable fields. Assuming username is updatable for now.
       // Adjust payload based on actual backend DTO if needed.
       await apiPatchClient('users/me', {
          username: formData.username,
          // email: formData.email - usually email change requires verification flow
       });
       setSaved(true);
       setTimeout(() => setSaved(false), 3000);
    } catch (err) {
       console.error(err);
       setError('Failed to save changes');
    } finally {
       setSaving(false);
    }
  };

  if(loading) {
     return <div className="p-8 text-muted-foreground">{t('loading')}</div>;
  }

  if(!formData) {
     return <div className="p-8 text-red-500">{error || t('error')}</div>;
  }

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
<<<<<<< Updated upstream
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
=======
             
             <div className="ui-card__body flex flex-col sm:flex-row gap-8 items-start">
                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-3">
                   <div className="relative group cursor-pointer">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-3xl font-bold text-primary border-4 border-background shadow-sm">
                        {formData.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <Camera className="text-white" size={20} />
                      </div>
                   </div>
                   <button className="text-xs text-primary hover:underline font-medium">{t('changeAvatar')}</button>
                </div>

                {/* Form Section */}
                <div className="flex-1 grid gap-4 max-w-lg w-full">
                   
                   {error && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-md text-sm">
                         {error}
                      </div>
                   )}

                   <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                         <User size={12} /> {t('fullName')}
                      </label>
                      <input 
                        className="ui-input w-full" 
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})} 
                      />
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                         <Mail size={12} /> {t('email')}
                      </label>
                      <input 
                        className="ui-input w-full bg-muted/30" 
                        value={formData.email}
                        disabled // Email usually locked
                        title="Email cannot be changed directly"
                      />
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                         <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                            <Shield size={12} /> {t('role')}
                         </label>
                         <div className="flex items-center px-3 h-[2.25rem] bg-muted/30 border border-border rounded-lg text-sm text-muted-foreground cursor-not-allowed">
                            {formData.role}
                         </div>
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                            <Activity size={12} /> {t('status')}
                         </label>
                         <div className="flex items-center px-3 h-[2.25rem] bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-600 font-medium">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2" />
                            {formData.status}
                         </div>
                      </div>
                   </div>

                </div>
             </div>

             <div className="p-4 border-t border-border flex justify-end items-center gap-4 bg-muted/30">
                {saved && <span className="text-xs font-medium text-green-600 animate-in fade-in">{t('saved')}</span>}
                <button 
                   onClick={handleSave} 
                   disabled={saving}
                   className="ui-btn ui-btn--primary min-w-[100px]"
                >
                   {saving ? t('saving') : t('saveChanges')}
                </button>
>>>>>>> Stashed changes
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
