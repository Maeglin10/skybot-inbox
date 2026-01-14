export default function AlertsPage() {
  const items = [
    { title: "IA n’a pas répondu", detail: "0 (stub)" },
    { title: "Erreur workflow", detail: "0 (stub)" },
    { title: "Hot lead détecté", detail: "0 (stub)" },
    { title: "Conversation à reprendre", detail: "0 (stub)" },
    { title: "Ticket en retard / prioritaire", detail: "0 (stub)" },
  ];

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-lg font-semibold">Alertes</h1>
      <div className="grid gap-3">
        {items.map((a) => (
          <div key={a.title} className="rounded-lg border p-4">
            <div className="text-sm font-medium">{a.title}</div>
            <div className="text-xs text-muted-foreground">{a.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}