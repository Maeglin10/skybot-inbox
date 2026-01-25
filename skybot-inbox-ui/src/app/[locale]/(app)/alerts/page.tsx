import { AlertsShell } from "@/components/alerts/alerts-shell";

export const dynamic = "force-dynamic";

export default function AlertsPage() {
  return (
    <div className="ui-page">
      <AlertsShell />
    </div>
  );
}