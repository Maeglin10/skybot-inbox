import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Star, Zap, Building2 } from 'lucide-react';

export type TenantTier = 'STARTER' | 'PRO' | 'ENTERPRISE';

interface TenantBadgeProps {
  tier: TenantTier;
}

export function TenantBadge({ tier }: TenantBadgeProps) {
  let icon = <Star size={14} />;
  let label = 'Starter';
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'outline';
  let className = '';

  switch (tier) {
    case 'STARTER':
      icon = <Star size={14} className="mr-1" />;
      label = 'Starter';
      variant = 'secondary';
      break;
    case 'PRO':
      icon = <Zap size={14} className="mr-1 fill-yellow-400 text-yellow-600 border-none" />;
      label = 'Pro';
      variant = 'outline';
      className = 'border-yellow-200 bg-yellow-50 text-yellow-800';
      break;
    case 'ENTERPRISE':
      icon = <Building2 size={14} className="mr-1 text-purple-600" />;
      label = 'Enterprise';
      variant = 'outline';
      className = 'border-purple-200 bg-purple-50 text-purple-800';
      break;
  }

  return (
    <Badge variant={variant} className={`font-medium ${className}`}>
      {icon}
      {label}
    </Badge>
  );
}
