'use client';

import * as React from 'react';
import { PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
  heightClass?: string;
}

export function EmptyState({
  title = 'No data available',
  description = 'There is no data to display at this time.',
  icon: Icon = PackageOpen,
  action,
  heightClass = 'h-64'
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center rounded-lg border border-dashed border-border/30 bg-muted/10 ${heightClass}`}>
      <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mb-4 text-muted-foreground">
        <Icon size={24} />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
