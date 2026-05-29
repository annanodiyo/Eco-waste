import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useCollectorDeposits, CollectorKpis, CollectorPendingDepositsTable } from "@/components/collector/CollectorShared";
import { VERIFICATION_QUEUE } from "@/lib/mockData";

export const Route = createFileRoute("/dashboard/queue")({
  component: CollectorQueuePage,
});

function CollectorQueuePage() {
  const { pendingDeposits, loadingDeposits } = useCollectorDeposits();

  return (
    <AppShell>
      <main className="px-4 max-w-screen-xl mx-auto py-8 space-y-8">
        <header className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-brand-primary">Collector Workspace</p>
            <h1 className="text-3xl font-semibold tracking-tight mt-1">Verification Queue</h1>
          </div>
          <CollectorKpis pendingDeposits={pendingDeposits} />
        </header>

        <section className="bg-card ring-1 ring-black/5 rounded-[16px] p-6">
          <h2 className="text-xs font-mono uppercase tracking-widest text-ui-muted mb-4">Queued verification entries</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  {["Queue ID", "Consumer", "Material", "Estimated", "Submitted"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-mono text-[10px] text-ui-muted uppercase tracking-wider font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {VERIFICATION_QUEUE.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 font-mono">{row.id}</td>
                    <td className="px-4 py-3">{row.user}</td>
                    <td className="px-4 py-3">{row.material}</td>
                    <td className="px-4 py-3">{row.est}</td>
                    <td className="px-4 py-3">{row.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <CollectorPendingDepositsTable pendingDeposits={pendingDeposits} loadingDeposits={loadingDeposits} />
      </main>
    </AppShell>
  );
}
