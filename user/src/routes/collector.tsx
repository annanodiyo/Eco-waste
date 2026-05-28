import { createFileRoute } from "@tanstack/react-router";
import { Check, Boxes, Truck, Coins } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ChainBadge } from "@/components/ChainBadge";
import { VERIFICATION_QUEUE, INVENTORY, PICKUPS } from "@/lib/mockData";
import { useState } from "react";

export const Route = createFileRoute("/collector")({
  head: () => ({ meta: [{ title: "Collection Point · EcoToken" }] }),
  component: Collector,
});

function Collector() {
  const [verified, setVerified] = useState<string[]>([]);

  return (
    <AppShell>
      <main className="px-4 max-w-screen-xl mx-auto py-8 space-y-8">
        <header className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-brand-primary">
              Collection Point · Görlitzer Park
            </p>
            <h1 className="text-3xl font-semibold tracking-tight mt-1">Operator Dashboard</h1>
          </div>
          <div className="flex gap-3 text-xs font-mono">
            <Kpi label="In Queue" value={VERIFICATION_QUEUE.length.toString()} />
            <Kpi label="Today" value="38.4 kg" />
            <Kpi label="Rewards" value="124 ECO" icon={Coins} />
          </div>
        </header>

        {/* Verification queue */}
        <section>
          <h2 className="text-xs font-mono uppercase tracking-widest text-ui-muted mb-4">
            Verification queue
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {VERIFICATION_QUEUE.map((q) => {
              const done = verified.includes(q.id);
              return (
                <div
                  key={q.id}
                  className={`bg-card ring-1 ring-black/5 rounded-[12px] p-4 flex justify-between items-center gap-4 transition-opacity ${done ? "opacity-50" : ""}`}
                >
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-ui-muted">
                      {q.id} · {q.time}
                    </p>
                    <p className="font-medium mt-1">
                      {q.material} <span className="text-ui-muted font-normal">· est. {q.est}</span>
                    </p>
                    <p className="font-mono text-xs text-ui-muted mt-1">{q.user}</p>
                  </div>
                  <button
                    onClick={() => setVerified((v) => [...v, q.id])}
                    disabled={done}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-brand-primary text-neutral-50 text-xs font-medium disabled:bg-emerald-700"
                  >
                    <Check className="size-3.5" />
                    {done ? "Signed" : "Weigh & sign"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Inventory */}
        <section>
          <h2 className="text-xs font-mono uppercase tracking-widest text-ui-muted mb-4 flex items-center gap-2">
            <Boxes className="size-3.5" /> Inventory by material
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {INVENTORY.map((m) => {
              const pct = Math.round((m.kg / m.cap) * 100);
              return (
                <div key={m.material} className="bg-card ring-1 ring-black/5 rounded-[12px] p-4">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-ui-muted">
                    {m.material}
                  </p>
                  <p className="text-2xl font-semibold mt-1">{m.kg}<span className="text-sm text-ui-muted font-normal"> kg</span></p>
                  <div className="mt-3 h-1 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-primary"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[10px] font-mono text-ui-muted mt-1.5">{pct}% of {m.cap}kg cap</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Pickups */}
        <section>
          <h2 className="text-xs font-mono uppercase tracking-widest text-ui-muted mb-4 flex items-center gap-2">
            <Truck className="size-3.5" /> Pickup schedule
          </h2>
          <div className="bg-card ring-1 ring-black/5 rounded-[12px] divide-y divide-zinc-100">
            {PICKUPS.map((p) => (
              <div key={p.id} className="px-4 py-4 flex justify-between items-center gap-4">
                <div>
                  <p className="font-medium text-sm">{p.ngo}</p>
                  <p className="text-xs text-ui-muted">{p.window} · {p.id}</p>
                </div>
                <ChainBadge
                  status={
                    p.status === "Confirmed" ? "verified" : p.status === "Pending" ? "pending" : "signed"
                  }
                />
              </div>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function Kpi({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ElementType }) {
  return (
    <div className="bg-card ring-1 ring-black/5 rounded-[10px] px-3 py-2 flex items-center gap-2">
      {Icon && <Icon className="size-3.5 text-brand-primary" />}
      <div>
        <p className="text-[9px] font-mono uppercase tracking-widest text-ui-muted leading-none">
          {label}
        </p>
        <p className="text-sm font-semibold mt-0.5 leading-none">{value}</p>
      </div>
    </div>
  );
}
