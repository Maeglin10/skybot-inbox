'use client';

import React, { useState } from 'react';
import { useTranslations } from '@/lib/translations';
import { Shield, Key, AlertCircle, CheckCircle } from 'lucide-react';

export default function SecurityPage() {
  const t = useTranslations('settings');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Mock API call
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      // In real scenario: catch error -> setError("Incorrect password") etc.
    }, 1500);
  };

  return (
    <div className="space-y-6">
       <div>
          <h2 className="ui-pageTitle">{t('security')}</h2>
          <p className="ui-pageSubtitle">{t('manageSecurity')}</p>
       </div>

       <form onSubmit={handleSubmit} className="ui-card max-w-lg">
          <div className="ui-card__header">
             <div className="flex items-center gap-2">
                <Shield size={18} />
                <span className="font-semibold">{t('changePassword')}</span>
             </div>
          </div>
          <div className="ui-card__body space-y-4">
             {success && (
               <div className="flex items-center gap-2 p-3 text-sm text-green-600 bg-green-500/10 border border-green-500/20 rounded-md">
                  <CheckCircle size={16} />
                  <span>{t('passwordUpdated')}</span>
               </div>
             )}
             {error && (
               <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-md">
                  <AlertCircle size={16} />
                  <span>{error}</span>
               </div>
             )}

             <div>
                <label className="text-xs font-medium mb-1.5 block text-muted-foreground">{t('currentPassword')}</label>
                <div className="relative">
                   <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                   <input required type="password" className="ui-input pl-9 w-full" placeholder="••••••••" />
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-xs font-medium mb-1.5 block text-muted-foreground">{t('newPassword')}</label>
                  <input required type="password" className="ui-input w-full" placeholder="••••••••" />
               </div>
               <div>
                  <label className="text-xs font-medium mb-1.5 block text-muted-foreground">{t('confirmPassword')}</label>
                  <input required type="password" className="ui-input w-full" placeholder="••••••••" />
               </div>
             </div>
          </div>
          <div className="p-4 border-t border-border flex justify-end bg-muted/30">
             <button disabled={loading} className="ui-btn ui-btn--primary min-w-[100px]">
               {loading ? t('saving') : t('updatePassword')}
             </button>
          </div>
       </form>
    </div>
  );
}
