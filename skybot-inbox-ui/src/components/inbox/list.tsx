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

function statusUi(status?: InboxConversationStatus) {
  if (status === 'OPEN')
    return { label: 'OPEN', pill: 'is-open', dot: 'is-open' };
  if (status === 'PENDING')
    return { label: 'PENDING', pill: 'is-pending', dot: 'is-pending' };
  if (status === 'CLOSED')
    return { label: 'CLOSED', pill: 'is-closed', dot: 'is-closed' };
  return { label: status ?? '—', pill: 'is-unknown', dot: 'is-unknown' };
}

function nextStatusValue(s?: InboxConversationStatus): InboxConversationStatus {
  if (s === 'OPEN') return 'PENDING';
  if (s === 'PENDING') return 'CLOSED';
  return 'OPEN';
}

export function InboxList({
  items,
  activeId,
  onSelect,
  onToggleStatus,
}: {
  items: InboxConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onToggleStatus?: (id: string, next: InboxConversationStatus) => void;
}) {
  return (
    <div className="ui-conv">
      <div className="ui-conv__header">
        <div className="ui-conv__title">Conversations</div>
        <div className="ui-conv__meta">{items.length} total</div>
      </div>

      <div className="ui-conv__list">
        {items.map((c) => {
          const name = c.contact?.name || c.contact?.phone || 'Unknown';
          const phone = c.contact?.phone || '';
          const active = c.id === activeId;

          const status = (c.status as InboxConversationStatus) ?? 'OPEN';
          const st = statusUi(status);
          const nextValue = nextStatusValue(status);
          const ts = lastTs(c);

          return (
            <div
              key={c.id}
              className={`ui-convCard ${active ? 'is-active' : ''}`}
            >
              <button
                type="button"
                onClick={() => onSelect(c.id)}
                className="ui-convBtn"
              >
                <div className="ui-convTop">
                  <div className="min-w-0">
                    <div className="truncate ui-convName">{name}</div>
                    <div className="truncate ui-convPhone">{phone}</div>
                  </div>

                  <div className="ui-convRight">
                    <div className={`ui-pill ${st.pill}`} title="Status">
                      <span className={`ui-dot ${st.dot}`} />
                      <span>{st.label}</span>
                    </div>
                    <div className="ui-ts">{fmtLite(ts)}</div>
                  </div>
                </div>

                <div className="truncate ui-preview">{previewText(c)}</div>
              </button>

              {onToggleStatus ? (
                <div className="ui-convActions">
                  <button
                    type="button"
                    className="ui-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onToggleStatus(c.id, nextValue);
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    disabled={!c.id}
                  >
                    Set {nextValue}
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
