import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { INVENTORY } from "@/lib/mockData";

export const Route = createFileRoute("/dashboard/inventory")({
  component: CollectorInventoryPage,
});

function CollectorInventoryPage() {
  return (
    <AppShell>
      <main className="px-4 max-w-screen-xl mx-auto py-8 space-y-6">
        <header>
          <p className="text-[10px] font-mono uppercase tracking-widest text-brand-primary">Collector Workspace</p>
          <h1 className="text-3xl font-semibold tracking-tight mt-1">Inventory</h1>
        </header>

        <section className="bg-card ring-1 ring-black/5 rounded-[16px] p-6">
          <h2 className="text-xs font-mono uppercase tracking-widest text-ui-muted mb-4">Material stock overview</h2>
          <div className="space-y-4">
            {INVENTORY.map((item) => {
              const percent = Math.round((item.kg / item.cap) * 100);
              return (
                <div key={item.material} className="rounded-xl bg-zinc-50 p-4 ring-1 ring-black/5">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">{item.material}</span>
                    <span className="font-mono text-ui-muted">{item.kg} / {item.cap} kg</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-zinc-200 overflow-hidden">
                    <div className="h-full bg-brand-primary" style={{ width: `${Math.min(percent, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
