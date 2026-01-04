import { apiGetServer } from "@/lib/api.server";
import {
  InboxShell,
  type InboxConversation,
  type InboxConversationStatus,
} from "@/components/inbox/inbox-shell";

export const dynamic = "force-dynamic";

type RawContact = {
  name?: unknown;
  phone?: unknown;
};

type RawPreview = {
  text?: unknown;
  timestamp?: unknown;
  direction?: unknown;
};

type RawConversationLite = {
  id?: unknown;
  status?: unknown;
  contact?: RawContact;
  lastActivityAt?: unknown;
  preview?: RawPreview;
};

type RawListResponse = {
  items?: unknown;
  nextCursor?: unknown;
};

function asString(v: unknown): string {
  if (typeof v === "string") return v;
  if (v == null) return "";
  return String(v);
}

function asNullableString(v: unknown): string | null {
  if (typeof v === "string") return v;
  return null;
}

function normalizeStatus(v: unknown): InboxConversationStatus | undefined {
  if (v === "OPEN" || v === "PENDING" || v === "CLOSED") return v;
  return undefined;
}

function normalizeDir(v: unknown): "IN" | "OUT" | undefined {
  if (v === "IN" || v === "OUT") return v;
  return undefined;
}

export default async function InboxPage() {
  const data = (await apiGetServer(
    "/conversations?limit=50&lite=1"
  )) as RawListResponse;

  const rawItems: RawConversationLite[] = Array.isArray(data.items)
    ? (data.items as RawConversationLite[])
    : [];

  const items: InboxConversation[] = rawItems.map((c) => {
    const contact =
      c.contact && typeof c.contact === "object"
        ? {
            name:
              typeof c.contact.name === "string"
                ? c.contact.name
                : c.contact.name == null
                  ? null
                  : String(c.contact.name),
            phone:
              typeof c.contact.phone === "string"
                ? c.contact.phone
                : c.contact.phone == null
                  ? null
                  : String(c.contact.phone),
          }
        : undefined;

    const preview =
      c.preview && typeof c.preview === "object"
        ? {
            text:
              typeof c.preview.text === "string"
                ? c.preview.text
                : c.preview.text == null
                  ? null
                  : String(c.preview.text),
            timestamp:
              typeof c.preview.timestamp === "string"
                ? c.preview.timestamp
                : undefined,
            direction: normalizeDir(c.preview.direction) ?? "IN",
          }
        : undefined;

    return {
      id: asString(c.id),
      status: normalizeStatus(c.status),
      contact,
      lastActivityAt:
        typeof c.lastActivityAt === "string" ? c.lastActivityAt : undefined,
      preview,
    };
  });

  const initialCursor = asNullableString(data.nextCursor);

  return <InboxShell initialItems={items} initialCursor={initialCursor} />;
}