'use client';

import { useTranslations } from 'next-intl';
import { Check, Circle } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

interface Step {
  id: number;
  label: string;
  path: string;
}

const STEPS: Step[] = [
  { id: 1, label: 'tenant', path: 'step1-tenant' },
  { id: 2, label: 'users', path: 'step2-users' },
  { id: 3, label: 'integrations', path: 'step3-integrations' },
  { id: 4, label: 'data', path: 'step4-data' },
  { id: 5, label: 'health', path: 'step5-health' },
];

export function OnboardingStepper({ currentStep }: { currentStep: number }) {
  // Assuming translations are properly setup, otherwise basic string fallback
  // const t = useTranslations('onboarding'); 
  const t = (key: string) => key.charAt(0).toUpperCase() + key.slice(1);

  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted -z-10" />
        
        {STEPS.map((step) => {
          const isCompleted = step.id < currentStep;
          const isActive = step.id === currentStep;
          
          return (
            <div key={step.id} className="flex flex-col items-center gap-2 bg-background px-2">
              <div 
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors
                  ${isCompleted ? 'bg-primary border-primary text-primary-foreground' : ''}
                  ${isActive ? 'bg-background border-primary text-primary' : ''}
                  ${!isCompleted && !isActive ? 'bg-background border-muted text-muted-foreground' : ''}
                `}
              >
                {isCompleted ? <Check size={14} /> : <span className="text-xs font-bold">{step.id}</span>}
              </div>
              <span className={`text-xs font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                {t(step.label)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
