import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PICKUPS } from "@/lib/mockData";

export const Route = createFileRoute("/dashboard/pickups")({
  component: CollectorPickupsPage,
});

function CollectorPickupsPage() {
  return (
    <AppShell>
      <main className="px-4 max-w-screen-xl mx-auto py-8 space-y-6">
        <header>
          <p className="text-[10px] font-mono uppercase tracking-widest text-brand-primary">Collector Workspace</p>
          <h1 className="text-3xl font-semibold tracking-tight mt-1">Pickups</h1>
        </header>

        <section className="bg-card ring-1 ring-black/5 rounded-[16px] p-6 overflow-x-auto">
          <h2 className="text-xs font-mono uppercase tracking-widest text-ui-muted mb-4">Scheduled pickups</h2>
          <table className="w-full text-sm">
            <thead className="bg-zinc-50">
              <tr>
                {["Pickup ID", "Partner", "Pickup window", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-mono text-[10px] text-ui-muted uppercase tracking-wider font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {PICKUPS.map((pickup) => (
                <tr key={pickup.id}>
                  <td className="px-4 py-3 font-mono">{pickup.id}</td>
                  <td className="px-4 py-3">{pickup.ngo}</td>
                  <td className="px-4 py-3">{pickup.window}</td>
                  <td className="px-4 py-3">{pickup.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </AppShell>
  );
}
