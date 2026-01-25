'use client';

import { FileText, ExternalLink } from 'lucide-react';

export default function LegalPage() {
  const privacyUrl = process.env.NEXT_PUBLIC_PRIVACY_URL || '#';
  const termsUrl = process.env.NEXT_PUBLIC_TERMS_URL || '#';

  return (
    <div className="space-y-6">
       <div>
          <h2 className="ui-pageTitle">Legal</h2>
          <p className="ui-pageSubtitle">Review our legal documents and policies.</p>
       </div>
       
       <div className="ui-card">
          <div className="ui-card__body space-y-4">
            
            <a 
              href={privacyUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
               <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-full text-primary">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Privacy Policy</h3>
                    <p className="text-xs text-muted-foreground">How we handle your data.</p>
                  </div>
               </div>
               <ExternalLink size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </a>

            <a 
              href={termsUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
               <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-full text-primary">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Terms & Conditions</h3>
                    <p className="text-xs text-muted-foreground">Rules and regulations.</p>
                  </div>
               </div>
               <ExternalLink size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </a>

          </div>
       </div>
    </div>
  );
}
