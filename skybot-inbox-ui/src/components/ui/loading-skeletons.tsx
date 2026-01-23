import * as React from 'react';

export function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-muted/20 ${className}`} />;
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full space-y-4">
      {/* Header mock */}
      <div className="h-10 w-full bg-muted/10 rounded border border-border/10 mb-4" />
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border-b border-border/10">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="ui-card p-6 space-y-3">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 'h-64' }: { height?: string }) {
  return (
    <div className={`ui-card p-6 flex flex-col justify-end gap-2 ${height}`}>
      <div className="flex justify-between items-end h-full gap-2 px-4">
         {[40, 70, 50, 90, 60, 80, 50, 70, 60].map((h, i) => (
            <Skeleton key={i} className={`w-full h-[${h}%] bg-muted/10`} />
         ))}
      </div>
    </div>
  );
}

export function DrawerSkeleton() {
  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      <div className="flex items-center gap-4 border-b border-border/10 pb-6">
         <Skeleton className="w-16 h-16 rounded-full" />
         <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
         </div>
      </div>
      <div className="space-y-4">
         <Skeleton className="h-4 w-full" />
         <Skeleton className="h-4 w-3/4" />
         <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}
