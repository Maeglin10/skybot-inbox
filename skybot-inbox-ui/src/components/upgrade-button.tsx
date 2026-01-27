import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface UpgradeButtonProps {
  module?: string;
  currentTier: string;
  onClick?: () => void;
  className?: string;
}

export function UpgradeButton({ module, currentTier, onClick, className }: UpgradeButtonProps) {
  // Placeholder for modal logic or simple callback
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      console.log(`Open upgrade modal for ${module}, current tier: ${currentTier}`);
      // In a real implementation this would trigger a global modal store or router push
    }
  };

  return (
    <Button 
      variant="default" // Using default (primary) for upgrade actions to stand out
      size="sm"
      className={`gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0 shadow-md ${className || ''}`}
      onClick={handleClick}
    >
      <Sparkles size={14} />
      Upgrade Plan
    </Button>
  );
}
