import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { ShieldAlert, CreditCard } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function UpgradePage() {
  const t = useTranslations('common'); // Assuming common exists or fallback

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
        <Link href="/settings/billing">
           <Button className="gap-2">
             <CreditCard size={16} />
             Go to Billing
           </Button>
        </Link>
        <Link href="/dashboard">
           <Button variant="outline">
             Back to Dashboard
           </Button>
        </Link>
      </div>
    </div>
  );
}
