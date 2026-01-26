'use client';

import * as React from 'react';
import { useTranslations } from '@/lib/translations';
import { Camera, Mail, User, Shield, Activity, UserCircle } from 'lucide-react';

export default function ProfilePage() {
  const t = useTranslations('settings');
  const [loading, setLoading] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  // Mock initial data
  const [formData, setFormData] = React.useState({
    name: "Valentin Milliand",
    email: "valentin.milliand@nexa.com",
    role: "Administrator",
    status: "Active"
  });

  const handleSave = async () => {
    setLoading(true);
    // mock save delay
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
       <div>
          <h2 className="ui-pageTitle">{t('profile')}</h2>
          <p className="ui-pageSubtitle">{t('manageProfile')}</p>
       </div>

       <div className="grid gap-6">
          <section className="ui-card">
             <div className="ui-card__header">
                <div className="flex items-center gap-2">
                   <UserCircle size={18} />
                   <span className="font-semibold">{t('publicProfile')}</span>
                </div>
             </div>
             
             <div className="ui-card__body flex flex-col sm:flex-row gap-8 items-start">
                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-3">
                   <div className="relative group cursor-pointer">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-3xl font-bold text-primary border-4 border-background shadow-sm">
                        {formData.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <Camera className="text-white" size={20} />
                      </div>
                   </div>
                   <button className="text-xs text-primary hover:underline font-medium">{t('changeAvatar')}</button>
                </div>

                {/* Form Section */}
                <div className="flex-1 grid gap-4 max-w-lg w-full">
                   
                   <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                         <User size={12} /> {t('fullName')}
                      </label>
                      <input 
                        className="ui-input w-full" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})} 
                      />
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                         <Mail size={12} /> {t('email')}
                      </label>
                      <input 
                        className="ui-input w-full bg-muted/30" 
                        value={formData.email}
                        disabled // Email usually locked or requires specific flow
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
                   disabled={loading}
                   className="ui-btn ui-btn--primary min-w-[100px]"
                >
                   {loading ? t('saving') : t('saveChanges')}
                </button>
             </div>
          </section>
       </div>
    </div>
  );
}
