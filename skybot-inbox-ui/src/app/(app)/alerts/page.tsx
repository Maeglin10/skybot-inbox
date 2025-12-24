export default function AlertsPage() {
  return (
    <div className="p-6">
      <div className="text-lg font-semibold">Alertes</div>
      <div className="mt-2 text-sm text-muted-foreground">
        Aucun signal pour le moment.
      </div>
      <div className="mt-6 rounded-lg border p-4 text-sm">
        À brancher ensuite:
        <ul className="mt-2 list-disc pl-5 space-y-1 text-muted-foreground">
          <li>IA n’a pas répondu</li>
          <li>Erreur workflow</li>
          <li>Hot lead détecté</li>
          <li>Conversation à reprendre</li>
        </ul>
      </div>
    </div>
  );
}
