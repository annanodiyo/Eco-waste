import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ChainBadge } from "@/components/ChainBadge";
import { BATCHES, WEEKLY_THROUGHPUT, MATERIAL_BREAKDOWN } from "@/lib/mockData";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/recycler")({
  head: () => ({ meta: [{ title: "Recycler / NGO · EcoToken" }] }),
  component: Recycler,
});

const tooltipStyle = {
  background: "#18181b",
  color: "#fafafa",
  border: "none",
  borderRadius: 8,
  fontSize: 11,
  fontFamily: "var(--font-mono)",
};

function Recycler() {
  return (
    <AppShell>
      <main className="px-4 max-w-screen-xl mx-auto py-8 space-y-8">
        <header>
          <p className="text-[10px] font-mono uppercase tracking-widest text-brand-primary">
            Loop Recyclers GmbH · Leipzig
          </p>
          <h1 className="text-3xl font-semibold tracking-tight mt-1">Recycler Dashboard</h1>
        </header>

        {/* Batches */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs font-mono uppercase tracking-widest text-ui-muted">
              Incoming batches
            </h2>
            <span className="text-[10px] font-mono text-ui-muted">{BATCHES.length} active</span>
          </div>
          <div className="bg-card ring-1 ring-black/5 rounded-[12px] overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  {["Batch", "Material", "Weight", "Source", "Reward", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-mono text-[10px] text-ui-muted uppercase tracking-wider font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {BATCHES.map((b) => (
                  <tr key={b.id}>
                    <td className="px-4 py-4 font-mono text-xs">{b.id}</td>
                    <td className="px-4 py-4">{b.material}</td>
                    <td className="px-4 py-4 font-mono">{b.kg} kg</td>
                    <td className="px-4 py-4 text-ui-muted">{b.source}</td>
                    <td className="px-4 py-4 font-mono text-brand-secondary">
                      {b.reward ? `+${b.reward} ECO` : "—"}
                    </td>
                    <td className="px-4 py-4">
                      <ChainBadge
                        status={
                          b.status === "Closed"
                            ? "archived"
                            : b.status === "Confirmed"
                            ? "verified"
                            : b.status === "Awaiting Pickup"
                            ? "pending"
                            : "signed"
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Charts */}
        <section className="grid md:grid-cols-2 gap-4">
          <div className="bg-card ring-1 ring-black/5 rounded-[12px] p-5">
            <h3 className="text-xs font-mono uppercase tracking-widest text-ui-muted mb-1">
              Weekly throughput
            </h3>
            <p className="text-2xl font-semibold mb-4">2,430 kg</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={WEEKLY_THROUGHPUT}>
                  <CartesianGrid stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "#065f46", strokeOpacity: 0.2 }} />
                  <Line type="monotone" dataKey="kg" stroke="#065f46" strokeWidth={2} dot={{ fill: "#065f46", r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card ring-1 ring-black/5 rounded-[12px] p-5">
            <h3 className="text-xs font-mono uppercase tracking-widest text-ui-muted mb-1">
              Material breakdown
            </h3>
            <p className="text-2xl font-semibold mb-4">5 streams</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MATERIAL_BREAKDOWN}>
                  <CartesianGrid stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis dataKey="material" tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(6,95,70,0.05)" }} />
                  <Bar dataKey="kg" fill="#047857" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Lifecycle close */}
        <section className="bg-ui-dark text-neutral-50 rounded-[16px] p-6 flex flex-wrap justify-between items-center gap-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
              Close lifecycle
            </p>
            <h3 className="text-xl font-semibold mt-1">Batch B-2044 · Glass · 540 kg</h3>
            <p className="text-xs text-neutral-400 mt-1">
              Sign the final on-chain event to release vendor's $ECO to consumer wallets.
            </p>
          </div>
          <button className="px-5 py-3 bg-brand-accent text-ui-dark rounded-full font-medium text-sm active:scale-95 transition-transform">
            Stamp & close
          </button>
        </section>
      </main>
    </AppShell>
  );
}
