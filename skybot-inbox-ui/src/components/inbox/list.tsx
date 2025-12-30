'use client';

import * as React from 'react';
import type { InboxConversation, InboxConversationStatus } from './inbox-shell';

function previewText(c: InboxConversation) {
  const t = c.preview?.text ?? c.messages?.[c.messages.length - 1]?.text ?? '';
  return (t || '').slice(0, 80);
}

function fmtLite(ts?: string) {
  if (!ts) return '';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleString(undefined, {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function lastTs(c: InboxConversation) {
  return (
    c.preview?.timestamp ??
    c.lastActivityAt ??
    c.messages?.[c.messages.length - 1]?.timestamp
  );
}

function asStatus(s?: string): InboxConversationStatus | undefined {
  if (s === 'OPEN' || s === 'PENDING' || s === 'CLOSED') return s;
  return undefined;
}

function statusMeta(status?: string) {
  if (status === 'OPEN') {
    return {
      label: 'OPEN',
      pill:
        'border-emerald-400/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
      dot: 'bg-emerald-500',
    };
  }
  if (status === 'PENDING') {
    return {
      label: 'PENDING',
      pill:
        'border-amber-400/40 bg-amber-500/10 text-amber-800 dark:text-amber-300',
      dot: 'bg-amber-500',
    };
  }
  if (status === 'CLOSED') {
    return {
      label: 'CLOSED',
      pill:
        'border-zinc-400/40 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300',
      dot: 'bg-zinc-400',
    };
  }
  return {
    label: status ?? '—',
    pill: 'border-zinc-400/40 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300',
    dot: 'bg-zinc-400',
  };
}

type Filter = 'ALL' | InboxConversationStatus;

function nextStatus(s?: InboxConversationStatus): InboxConversationStatus {
  // cycle: OPEN -> PENDING -> CLOSED -> OPEN
  if (s === 'OPEN') return 'PENDING';
  if (s === 'PENDING') return 'CLOSED';
  return 'OPEN';
}

function TabButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'h-8 px-2 rounded-md border text-xs',
        active ? 'bg-muted' : 'bg-background hover:bg-muted/50',
      ].join(' ')}
    >
      <span className="font-medium">{label}</span>
      <span className="ml-2 text-muted-foreground">{count}</span>
    </button>
  );
}

export function InboxList({
  items,
  activeId,
  filter,
  counts,
  onFilterChange,
  onSelect,
  onToggleStatus,
}: {
  items: InboxConversation[];
  activeId: string | null;

  filter: Filter;
  counts: { all: number; open: number; pending: number; closed: number };
  onFilterChange: (f: Filter) => void;

  onSelect: (id: string) => void;
  onToggleStatus?: (id: string, next: InboxConversationStatus) => void;
}) {
  return (
    <div className="h-full">
      <div className="p-4 border-b space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Conversations</div>
            <div className="text-xs text-muted-foreground">
              {counts.all} total
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <TabButton
            active={filter === 'ALL'}
            label="All"
            count={counts.all}
            onClick={() => onFilterChange('ALL')}
          />
          <TabButton
            active={filter === 'OPEN'}
            label="Open"
            count={counts.open}
            onClick={() => onFilterChange('OPEN')}
          />
          <TabButton
            active={filter === 'PENDING'}
            label="Pending"
            count={counts.pending}
            onClick={() => onFilterChange('PENDING')}
          />
          <TabButton
            active={filter === 'CLOSED'}
            label="Closed"
            count={counts.closed}
            onClick={() => onFilterChange('CLOSED')}
          />
        </div>
      </div>

      <div className="h-[calc(100%-120px)] overflow-auto">
        {items.map((c) => {
          const name = c.contact?.name || c.contact?.phone || 'Unknown';
          const phone = c.contact?.phone || '';
          const isActive = c.id === activeId;

          const s = asStatus(c.status);
          const meta = statusMeta(s);
          const next = nextStatus(s);
          const ts = lastTs(c);

          return (
            <div
              key={c.id}
              className={['border-b', isActive ? 'bg-muted' : 'bg-background'].join(
                ' ',
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(c.id)}
                className="w-full text-left px-4 py-3 hover:bg-muted/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {phone}
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <div
                      className={[
                        'inline-flex items-center gap-2 text-[10px] rounded px-2 py-1 border',
                        meta.pill,
                      ].join(' ')}
                      title="Status"
                    >
                      <span
                        className={['h-2 w-2 rounded-full', meta.dot].join(' ')}
                      />
                      <span>{meta.label}</span>
                    </div>

                    <div className="text-[10px] text-muted-foreground">
                      {fmtLite(ts)}
                    </div>
                  </div>
                </div>

                <div className="mt-2 truncate text-xs text-muted-foreground">
                  {previewText(c)}
                </div>
              </button>

              {onToggleStatus ? (
                <div className="px-4 pb-3">
                  <button
                    type="button"
                    className="h-8 rounded-md border px-3 text-xs hover:bg-muted disabled:opacity-50"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onToggleStatus(c.id, next);
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    disabled={!c.id}
                  >
                    Set {next}
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}