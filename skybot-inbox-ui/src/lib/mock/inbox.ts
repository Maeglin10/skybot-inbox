export type InboxThread = {
  id: string;
  title: string;
  channel: "whatsapp" | "instagram" | "email";
  lastMessage: string;
  updatedAt: string;
  unread: number;
};

export type InboxMessage = {
  id: string;
  threadId: string;
  role: "user" | "agent";
  text: string;
  createdAt: string;
};

export const threads: InboxThread[] = [
  {
    id: "t1",
    title: "Laura P.",
    channel: "whatsapp",
    lastMessage: "Ok pour demain 10h",
    updatedAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    unread: 2,
  },
  {
    id: "t2",
    title: "Nexxa Support",
    channel: "email",
    lastMessage: "Ticket #1842 — escalade",
    updatedAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    unread: 0,
  },
];

export const messages: InboxMessage[] = [
  { id: "m1", threadId: "t1", role: "user", text: "On confirme demain ?", createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString() },
  { id: "m2", threadId: "t1", role: "agent", text: "Oui, 10h. Je t’envoie l’adresse.", createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString() },
  { id: "m3", threadId: "t1", role: "user", text: "Ok pour demain 10h", createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString() },

  { id: "m4", threadId: "t2", role: "user", text: "Le webhook ne répond plus.", createdAt: new Date(Date.now() - 1000 * 60 * 55).toISOString() },
  { id: "m5", threadId: "t2", role: "agent", text: "Reçu. On escalade et on te tient au courant.", createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString() },
];