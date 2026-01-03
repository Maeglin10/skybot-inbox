export default function LoadingConversations() {
  return (
    <main className="p-6 space-y-4">
      <div className="h-6 w-40 rounded bg-white/10" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[360px_1fr]">
        <div className="rounded-xl border border-white/10 bg-black/40">
          <div className="border-b border-white/10 px-3 py-2">
            <div className="h-4 w-24 rounded bg-white/10" />
          </div>
          <div className="p-3 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 rounded bg-white/5" />
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 p-6">
          <div className="h-4 w-56 rounded bg-white/10" />
          <div className="mt-3 h-4 w-80 rounded bg-white/5" />
        </div>
      </div>
    </main>
  );
}