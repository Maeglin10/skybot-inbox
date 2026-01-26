<<<<<<< Updated upstream
export default function SecurityPage() {
=======
'use client';

import React, { useState } from 'react';
import { useTranslations } from '@/lib/translations';
import { Shield, Key, AlertCircle, CheckCircle } from 'lucide-react';
import { apiPostClient } from '@/lib/api.client';

export default function SecurityPage() {
  const t = useTranslations('settings');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
     currentPassword: '',
     newPassword: '',
     confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if(formData.newPassword !== formData.confirmPassword) {
       setError('Passwords do not match'); // Translation could be added
       setLoading(false);
       return;
    }

    if(formData.newPassword.length < 6) {
       setError('Password must be at least 6 characters');
       setLoading(false);
       return;
    }

    try {
      await apiPostClient('users/me/change-password', {
         currentPassword: formData.currentPassword,
         newPassword: formData.newPassword
      });
      setSuccess(true);
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      console.error(err);
      // Try to parse error message from backend if possible
      setError('Failed to update password. Please check your current password.');
    } finally {
      setLoading(false);
    }
  };

>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
          <div>
             <label className="text-xs font-medium mb-1.5 block">New Password</label>
             <input type="password" className="ui-input bg-transparent border-input text-foreground text-sm" />
=======
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
                   <input 
                      required 
                      type="password" 
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      className="ui-input pl-9 w-full" 
                      placeholder="••••••••" 
                   />
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-xs font-medium mb-1.5 block text-muted-foreground">{t('newPassword')}</label>
                  <input 
                     required 
                     type="password" 
                     name="newPassword"
                     value={formData.newPassword}
                     onChange={handleChange}
                     className="ui-input w-full" 
                     placeholder="••••••••" 
                  />
               </div>
               <div>
                  <label className="text-xs font-medium mb-1.5 block text-muted-foreground">{t('confirmPassword')}</label>
                  <input 
                     required 
                     type="password" 
                     name="confirmPassword"
                     value={formData.confirmPassword}
                     onChange={handleChange}
                     className="ui-input w-full" 
                     placeholder="••••••••" 
                  />
               </div>
             </div>
>>>>>>> Stashed changes
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
