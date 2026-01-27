'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldAlert, CreditCard } from 'lucide-react';

export default function UpgradePage() {

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
         <ShieldAlert size={32} className="text-muted-foreground" />
      </div>
      
      <h1 className="text-2xl font-bold mb-2">Feature Locked</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        This feature is not included in your current plan. Please upgrade your subscription to access this module.
      </p>

      <div className="flex gap-4">
        <Link href="/es/settings/billing">
          <Button className="gap-2">
            <CreditCard size={16} />
            Go to Billing
          </Button>
        </Link>
        <Link href="/es">
          <Button variant="outline">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
