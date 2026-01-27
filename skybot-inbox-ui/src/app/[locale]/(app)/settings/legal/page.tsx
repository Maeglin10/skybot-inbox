'use client';

import { useTranslations } from '@/lib/translations';
import { FileText, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function LegalPage() {
  const t = useTranslations('settings');
  const privacyUrl = '/legal/privacy';
  const termsUrl = '/legal/terms';

  return (
    <div className="space-y-6">
       <div>
          <h2 className="ui-pageTitle">{t('legal')}</h2>
          <p className="ui-pageSubtitle">{t('reviewLegal')}</p>
       </div>
       
       <div className="ui-card">
          <div className="ui-card__body space-y-4">
            
            <Link
              href={privacyUrl}
              className="group flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
               <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-full text-primary">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{t('privacyPolicy')}</h3>
                    <p className="text-xs text-muted-foreground">{t('howWeHandleData')}</p>
                  </div>
               </div>
               <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>

            <Link
              href={termsUrl}
              className="group flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
               <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-full text-primary">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{t('termsConditions')}</h3>
                    <p className="text-xs text-muted-foreground">{t('rulesRegulations')}</p>
                  </div>
               </div>
               <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>

          </div>
       </div>
    </div>
  );
}
