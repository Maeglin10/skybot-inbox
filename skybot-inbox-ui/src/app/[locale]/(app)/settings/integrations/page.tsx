'use client';

import { useTranslations } from '@/lib/translations';
import { Check, Plus, MessageCircle, Database, CreditCard } from 'lucide-react';

const INTEGRATIONS = [
  { 
    id: 'whatsapp', 
    name: 'WhatsApp Business', 
    icon: <MessageCircle size={20} />, 
    description: 'Conecta tu cuenta de WhatsApp Business para enviar y recibir mensajes.',
    connected: true 
  },
  { 
    id: 'airtable', 
    name: 'Airtable', 
    icon: <Database size={20} />, 
    description: 'Sincroniza contactos y leads directamente con tu base de datos.',
    connected: false 
  },
  { 
    id: 'stripe', 
    name: 'Stripe Payments', 
    icon: <CreditCard size={20} />, 
    description: 'Gestiona pagos y suscripciones directamente desde el chat.',
    connected: false 
  },
];

export default function IntegrationsPage() {
  const t = useTranslations('settings');

  return (
    <div className="space-y-6">
       <div>
          <h2 className="ui-pageTitle">{t('integrationsTitle')}</h2>
          <p className="ui-pageSubtitle">{t('integrationsDescription')}</p>
       </div>
       
       <div className="grid gap-4">
          {INTEGRATIONS.map(app => (
             <div key={app.id} className="ui-card p-5 flex items-center justify-between transition-all hover:border-primary/50">
                <div className="flex items-center gap-4">
                   <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm border ${app.connected ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-surface border-border text-muted-foreground'}`}>
                      {app.icon}
                   </div>
                   <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{app.name}</h3>
                        {app.connected && (
                          <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium border border-green-200">
                            Connected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{app.description}</p>
                   </div>
                </div>
                
                <button 
                  className={`ui-btn h-8 text-xs gap-2 ${app.connected ? 'ui-btn--secondary opacity-50' : 'ui-btn--secondary'}`}
                  disabled={true} // Disabled as requested for "UI Only" phase
                >
                   {app.connected ? (
                     <>
                       <Check size={14} />
                       {t('connected')}
                     </>
                   ) : (
                     <>
                       <Plus size={14} />
                       {t('connect')}
                     </>
                   )}
                </button>
             </div>
          ))}
       </div>
    </div>
  );
}
