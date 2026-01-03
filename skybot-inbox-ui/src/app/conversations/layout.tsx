export default function ConversationsLayout({
  children,
  detail,
}: {
  children: React.ReactNode;
  detail: React.ReactNode;
}) {
  return (
    <main className="p-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[360px_1fr]">
        {children}
        {detail}
      </div>
    </main>
  );
}