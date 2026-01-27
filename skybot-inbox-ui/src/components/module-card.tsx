import React from 'react';
import { Button } from '@/components/ui/button';
import { Lock, Settings, ArrowUpCircle } from 'lucide-react';

interface ModuleCardProps {
  moduleKey: string;
  title: string;
  description?: string;
  enabled: boolean;
  usagePct?: number; // 0 to 100
  locked?: boolean;
  onConfigure?: () => void;
  onUpgrade?: () => void;
}

export function ModuleCard({
  moduleKey,
  title,
  description,
  enabled,
  usagePct,
  locked,
  onConfigure,
  onUpgrade
}: ModuleCardProps) {
  return (
    <div className={`ui-card p-5 flex flex-col justify-between h-full bg-card border rounded-xl ${locked ? 'opacity-80' : ''}`}>
      <div>
        <div className="flex justify-between items-start mb-2">
           <h3 className="font-semibold text-lg">{title}</h3>
           {locked && (
             <div className="bg-muted text-muted-foreground p-1.5 rounded-full">
               <Lock size={14} />
             </div>
           )}
           {!locked && enabled && (
             <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200">
               Enabled
             </span>
           )}
           {!locked && !enabled && (
             <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground border border-border">
               Disabled
             </span>
           )}
        </div>
        
        {description && (
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
        )}
      
        {typeof usagePct === 'number' && !locked && enabled && (
          <div className="mb-4 space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Usage</span>
              <span>{Math.round(usagePct)}%</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
               <div 
                 className={`h-full rounded-full ${usagePct > 90 ? 'bg-red-500' : 'bg-primary'}`} 
                 style={{ width: `${Math.min(usagePct, 100)}%` }}
               />
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-border flex justify-end gap-2">
         {locked ? (
           <Button variant="outline" size="sm" onClick={onUpgrade} className="w-full gap-2">
             <ArrowUpCircle size={14} />
             Upgrade to Unlock
           </Button>
         ) : (
           enabled ? (
             <Button variant="outline" size="sm" onClick={onConfigure} className="w-full gap-2">
               <Settings size={14} />
               Configure
             </Button>
           ) : (
             <Button variant="outline" size="sm" className="w-full" disabled>
               Not Available
             </Button>
           )
         )}
      </div>
    </div>
  );
}
