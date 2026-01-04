export type Status = "OPEN" | "PENDING" | "CLOSED";

export type Message = {
  id: string;
  conversationId: string;
  direction: "IN" | "OUT";
  from: string;
  to: string;
  text: string;
  timestamp: string;
  createdAt: string;
  externalId?: string | null;
};

export type Conversation = {
  id: string;
  status: Status;
  updatedAt: string;
  lastActivityAt?: string | null;
  messages: Message[];
  contact?: { name?: string | null; phone?: string | null } | null;
};