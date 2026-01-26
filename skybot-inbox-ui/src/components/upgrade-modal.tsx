'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'; // Assuming shadcn dialog exists or standard structure
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleKey?: string;
  currentTier?: string;
}

export function UpgradeModal({ isOpen, onClose, moduleKey, currentTier }: UpgradeModalProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    onClose();
    router.push('/settings/billing'); // Redirect to billing
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-primary" size={20} />
            Upgrade Plan
          </DialogTitle>
          <DialogDescription>
            The module <strong>{moduleKey}</strong> is not available in your current <strong>{currentTier}</strong> plan.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
           <p className="text-sm text-muted-foreground">
             Unlock this feature allowing you to boost productivity and access advanced tools.
             Upgrade now to get immediate access.
           </p>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
           <Button variant="outline" onClick={onClose}>Cancel</Button>
           <Button onClick={handleUpgrade} className="bg-gradient-to-r from-violet-600 to-indigo-600">
             Upgrade Now
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
