import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Clock, Ban } from 'lucide-react';

export type TenantStatus = 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'PENDING' | 'FAILED';

interface StatusBadgeProps {
  status: TenantStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  let icon = <CheckCircle2 size={14} className="mr-1" />;
  let label = 'Active';
  let className = '';
  // Badge variant is loose in shadcn, usually default/secondary/outline/destructive. 
  // We'll use specific tailwind classes for colors.
  
  switch (status) {
    case 'ACTIVE':
      icon = <CheckCircle2 size={14} className="mr-1" />;
      label = 'Active';
      className = 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200';
      break;
    case 'TRIAL':
      icon = <Clock size={14} className="mr-1" />;
      label = 'Trial';
      className = 'bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200';
      break;
    case 'PENDING':
      icon = <Clock size={14} className="mr-1" />;
      label = 'Pending';
      className = 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200';
      break;
    case 'SUSPENDED':
      icon = <Ban size={14} className="mr-1" />;
      label = 'Suspended';
      className = 'bg-red-100 text-red-700 hover:bg-red-100 border-red-200';
      break;
    case 'FAILED':
      icon = <AlertCircle size={14} className="mr-1" />;
      label = 'Failed';
      className = 'bg-red-100 text-red-700 hover:bg-red-100 border-red-200';
      break;
  }

  return (
    <Badge variant="outline" className={`border ${className}`}>
      {icon}
      {label}
    </Badge>
  );
}
