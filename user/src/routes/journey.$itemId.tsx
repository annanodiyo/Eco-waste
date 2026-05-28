import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronLeft, MapPin } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ChainBadge } from "@/components/ChainBadge";
import { TxHash } from "@/components/TxHash";
import { PRODUCTS, STAGES, MATERIAL_FACTORS, type Product } from "@/lib/mockData";

export const Route = createFileRoute("/journey/$itemId")({
  component: Journey,
  loader: ({ params }) => {
    const product = PRODUCTS.find((p) => p.id === params.itemId);
    if (!product) throw notFound();
    return product;
  },
});

function Journey() {
  const product = Route.useLoaderData() as Product;
  const factor = MATERIAL_FACTORS[product.material] ?? 5;
  const reward = +(product.weightKg * factor * 43.4).toFixed(2); // weight × factor × constant

  return (
    <AppShell>
      <main className="px-4 max-w-screen-xl mx-auto py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-xs font-mono text-ui-muted uppercase tracking-widest hover:text-brand-primary mb-6"
        >
          <ChevronLeft className="size-3" /> Back
        </Link>

        {/* Item header */}
        <section className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-card ring-1 ring-black/5 rounded-[16px] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-ui-muted">
                  Item ID #{product.id} · Batch {product.batchId}
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">{product.name}</h1>
                <p className="mt-1 text-sm text-ui-muted">
                  {product.material} · {(product.weightKg * 1000).toFixed(0)} g · {product.manufacturer}
                </p>
              </div>
              <ChainBadge status="verified" />
            </div>
          </div>
          <div className="bg-ui-dark text-neutral-50 rounded-[16px] p-6">
            <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
              Vendor reward
            </p>
            <p className="mt-2 text-3xl font-semibold">+{product.tokenReward.toFixed(2)}</p>
            <p className="text-sm text-brand-accent">$ECOTKN</p>
            <p className="mt-4 text-[10px] font-mono text-neutral-400 leading-relaxed">
              weight × material factor ({factor}) × oracle price → minted by vendor on
              recycler confirmation.
            </p>
            <p className="mt-2 text-[10px] font-mono text-neutral-500">
              est. fair: {reward} $ECO
            </p>
          </div>
        </section>

        {/* Map placeholder */}
        <section className="mt-6">
          <div className="bg-card ring-1 ring-black/5 rounded-[16px] overflow-hidden">
            <div className="relative aspect-[3/1] bg-[radial-gradient(circle_at_30%_50%,rgba(6,95,70,0.08),transparent_60%),radial-gradient(circle_at_70%_60%,rgba(16,185,129,0.08),transparent_60%)] bg-zinc-50">
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 600 200">
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                <path
                  d="M 40 150 C 140 60, 240 180, 340 90 S 540 60, 560 130"
                  fill="none"
                  stroke="#065f46"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                {[40, 160, 280, 380, 480, 560].map((x, i) => (
                  <g key={i}>
                    <circle cx={x} cy={[150, 80, 130, 100, 110, 130][i]} r="6" fill="#065f46" />
                    <circle cx={x} cy={[150, 80, 130, 100, 110, 130][i]} r="12" fill="#065f46" fillOpacity="0.15" />
                  </g>
                ))}
              </svg>
              <div className="absolute bottom-3 left-3 text-[10px] font-mono uppercase tracking-widest text-ui-muted bg-background/80 px-2 py-1 rounded">
                <MapPin className="size-3 inline mr-1" /> Route map · interactive layer coming
              </div>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="mt-10">
          <h2 className="text-xs font-mono uppercase tracking-widest text-ui-muted mb-6">
            Verified journey ledger
          </h2>
          <div className="space-y-0 relative">
            {product.events.map((e, i) => {
              const stage = STAGES.find((s) => s.key === e.stage)?.label;
              const isLast = i === product.events.length - 1;
              return (
                <div key={e.id} className="relative pl-10 pb-6">
                  {!isLast && (
                    <div className="absolute left-[15px] top-5 bottom-0 w-px bg-zinc-200" />
                  )}
                  <div
                    className={`absolute left-2 top-3 size-3 rounded-full ring-4 ring-background ${
                      e.status === "pending" ? "bg-amber-400" : "bg-brand-primary"
                    }`}
                  />
                  <div className="bg-card ring-1 ring-black/5 rounded-[12px] p-4 md:p-5">
                    <div className="flex flex-wrap justify-between gap-3 items-start">
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-brand-primary">
                          Stage {i + 1} · {stage}
                        </p>
                        <h3 className="mt-1 font-semibold">{e.actor}</h3>
                        <p className="text-xs text-ui-muted">{e.location}</p>
                      </div>
                      <ChainBadge status={e.status} />
                    </div>
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <Field label="Block" value={e.blockNumber ? `#${e.blockNumber.toLocaleString()}` : "—"} />
                      <Field
                        label="Timestamp"
                        value={e.timestamp ? new Date(e.timestamp).toLocaleString() : "Awaiting"}
                      />
                      <Field
                        label="Weight"
                        value={e.weightKg ? `${(e.weightKg * 1000).toFixed(0)} g` : "—"}
                      />
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-ui-muted mb-1">
                          Tx Hash
                        </p>
                        <TxHash hash={e.txHash} />
                      </div>
                    </div>
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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-widest text-ui-muted mb-1">{label}</p>
      <p className="font-mono">{value}</p>
    </div>
  );
}
