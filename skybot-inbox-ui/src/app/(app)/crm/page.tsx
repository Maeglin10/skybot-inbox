export const dynamic = "force-dynamic";

export default function CrmPage() {
  return (
    <div className="p-6">
      <div className="rounded-xl border border-white/10 bg-black/40 p-6">
        <h1 className="text-lg font-semibold">CRM / Leads</h1>
        <p className="mt-2 text-sm text-white/60">
          Module en cours de construction.
        </p>

        <div className="mt-6 rounded-lg border border-dashed border-white/20 p-6 text-center text-sm text-white/50">
          À venir :
          <ul className="mt-2 space-y-1">
            <li>• Liste des leads</li>
            <li>• Historique conversations</li>
            <li>• Statuts & tags</li>
            <li>• Connexion Inbox</li>
          </ul>
        </div>
      </div>
    </div>
  );
}