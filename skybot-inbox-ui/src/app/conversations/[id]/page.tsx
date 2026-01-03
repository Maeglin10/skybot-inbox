import Link from "next/link";
import { apiGetServer } from "@/lib/api.server";
import ConversationClient from "./ConversationClient";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const initial = await apiGetServer(`/conversations/${id}`);

  return (
    <main className="p-0">
      <div className="p-3">
        <Link href="/conversations" className="text-sm underline">
          Back
        </Link>
      </div>

      <ConversationClient initial={initial} />
    </main>
  );
}