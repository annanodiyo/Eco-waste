import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, ScanLine, MapPin, Boxes, Recycle, Factory, Store, Truck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ChainBadge } from "@/components/ChainBadge";
import { RoleGateway } from "@/components/RoleGateway";
import { STAGES, PRODUCTS } from "@/lib/mockData";
import proofImg from "@/assets/proof.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EcoToken — Track Waste. Reward Recycling. Build Transparency." },
      {
        name: "description",
        content:
          "On-chain waste traceability from manufacturer to recycler. Connect MetaMask, scan QR codes, and earn EcoTokens for verified drop-offs.",
      },
    ],
  }),
  component: Landing,
});

const stageIcons = {
  manufacturer: Factory,
  distributor: Truck,
  retailer: Store,
  consumer: ScanLine,
  collection: Boxes,
  recycler: Recycle,
} as const;

const chainCards = [
  { stage: "manufacturer", id: "#00421", title: "Origin: Polymer Co.", note: "Virgin PET Production", status: "verified" as const },
  { stage: "distributor", id: "#00428", title: "Logistics: Global Freight", note: "Regional Hub Transit", status: "signed" as const },
  { stage: "retailer", id: "#00442", title: "Retail: North Market", note: "Inventory Intake", status: "verified" as const },
  { stage: "consumer", id: "#00498", title: "Consumer Scan", note: "QR provenance check", status: "verified" as const },
  { stage: "collection", id: "#00510", title: "Smart Bin #B-04", note: "Drop-off + weigh", status: "verified" as const },
  { stage: "recycler", id: "#00528", title: "Loop Recyclers GmbH", note: "Processing batch", status: "pending" as const },
];

function Landing() {
  return (
    <AppShell>
      <main>
        {/* Hero */}
        <section className="px-4 max-w-screen-xl mx-auto pt-10 md:pt-16 pb-8">
          <span className="text-xs font-mono font-medium text-brand-primary uppercase tracking-widest mb-3 block">
            <span className="inline-block size-1.5 bg-brand-accent rounded-full mr-2 animate-pulse" />
            System Status: Live · Block 843,001
          </span>
          <h1 className="text-4xl sm:text-6xl font-semibold leading-[1.05] tracking-tight text-balance max-w-[18ch]">
            Material provenance recorded on-chain.
          </h1>
          <p className="mt-6 text-ui-muted max-w-[52ch] text-pretty">
            EcoToken tracks every waste handoff — manufacturer to recycler — as a signed
            ledger event. Scan, drop off, and earn $ECO. No greenwashing. No double-counting.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#choose-role"
              className="inline-flex items-center gap-2 bg-ui-dark text-neutral-50 px-5 py-3 rounded-full text-sm font-medium hover:bg-brand-primary transition-colors"
            >
              Choose your role
              <ArrowUpRight className="size-4" />
            </a>
            <Link
              to="/journey/$itemId"
              params={{ itemId: PRODUCTS[0].id }}
              className="inline-flex items-center gap-2 bg-background text-ui-dark px-5 py-3 rounded-full text-sm font-medium ring-1 ring-black/10 hover:bg-zinc-100"
            >
              View a live waste journey
            </Link>
          </div>
        </section>

        {/* Role gateway */}
        <RoleGateway />

        {/* Chain scroller */}
        <section className="pt-4 pb-12">
          <div className="px-4 max-w-screen-xl mx-auto mb-4 flex items-end justify-between">
            <h2 className="text-xs font-mono uppercase tracking-widest text-ui-muted">
              Chain of custody
            </h2>
            <span className="text-[10px] font-mono uppercase tracking-widest text-ui-muted">
              Scroll →
            </span>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-4 snap-x no-scrollbar px-4 max-w-screen-xl mx-auto">
            {chainCards.map((c, i) => {
              const Icon = stageIcons[c.stage as keyof typeof stageIcons];
              const stageLabel = STAGES.find((s) => s.key === c.stage)?.label;
              return (
                <div key={c.id} className="flex items-center gap-4 flex-none">
                  <div className="w-[260px] snap-start bg-card ring-1 ring-black/5 rounded-[12px] p-5 relative">
                    <div className="absolute top-3 right-3 text-[10px] font-mono text-ui-muted">
                      {c.id}
                    </div>
                    <div className="size-10 bg-zinc-100 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="size-4 text-ui-dark" strokeWidth={1.6} />
                    </div>
                    <p className="text-[10px] font-mono uppercase text-brand-primary tracking-widest mb-1">
                      Stage {i + 1} · {stageLabel}
                    </p>
                    <h3 className="font-medium mb-1">{c.title}</h3>
                    <p className="text-sm text-ui-muted mb-4">{c.note}</p>
                    <ChainBadge status={c.status} />
                  </div>
                  {i < chainCards.length - 1 && (
                    <div className="w-8 h-px bg-zinc-300 flex-none" />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* How it works */}
        <section className="px-4 max-w-screen-xl mx-auto py-12 border-t border-zinc-200">
          <h2 className="text-xs font-mono uppercase tracking-widest text-ui-muted mb-8">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { n: "01", t: "Scan", d: "Tap a product's QR code to inspect its full lifecycle and reward value." },
              { n: "02", t: "Drop off", d: "Hand waste to a Collection Point. The operator weighs and signs the handoff." },
              { n: "03", t: "Earn", d: "Vendor mints your $ECO; the recycler closes the loop with a final on-chain stamp." },
            ].map((s) => (
              <div key={s.n} className="bg-card ring-1 ring-black/5 rounded-[12px] p-6">
                <span className="font-mono text-xs text-brand-primary">{s.n}</span>
                <h3 className="mt-3 text-lg font-semibold">{s.t}</h3>
                <p className="mt-1 text-sm text-ui-muted text-pretty">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="px-4 max-w-screen-xl mx-auto py-12 border-t border-zinc-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { v: "98.4%", l: "Recycle yield" },
              { v: "1.2M", l: "Tokens minted" },
              { v: "42.8t", l: "CO₂e offset" },
              { v: "18,204", l: "Batches tracked" },
            ].map((s) => (
              <div key={s.l}>
                <p className="text-3xl md:text-4xl font-semibold tracking-tight">{s.v}</p>
                <p className="text-[10px] uppercase font-mono text-ui-muted mt-1 tracking-widest">
                  {s.l}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Proof */}
        <section className="px-4 max-w-screen-xl mx-auto py-12 border-t border-zinc-200">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="w-full md:w-1/2">
              <img
                src={proofImg}
                alt="Recycled plastic flakes on a clean laboratory surface"
                loading="lazy"
                width={1024}
                height={768}
                className="w-full aspect-[4/3] object-cover rounded-[12px] ring-1 ring-black/5"
              />
            </div>
            <div className="w-full md:w-1/2 space-y-4">
              <span className="text-xs font-mono font-medium text-brand-primary uppercase tracking-widest">
                On-chain verification
              </span>
              <h2 className="text-3xl font-semibold text-pretty">
                Every gram accounted for, from source to cycle.
              </h2>
              <p className="text-ui-muted max-w-[48ch] text-pretty">
                Manufacturers register the source. Distributors and retailers sign each
                handoff. Consumers earn $ECO at drop-off, and recyclers close the loop with
                a final cryptographic stamp — paid in tokens by the vendor.
              </p>
              <div className="flex gap-6 pt-4">
                <RoleLink label="Consumer" />
                <RoleLink label="Collector" />
                <RoleLink label="Recycler" />
                <RoleLink label="Manufacturer" />
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-zinc-200 py-10">
          <div className="px-4 max-w-screen-xl mx-auto flex flex-col md:flex-row justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="size-5 bg-brand-primary rounded-sm" />
              <span className="font-mono text-xs font-semibold uppercase tracking-tighter">
                EcoToken System v1.0.4
              </span>
            </div>
            <div className="flex gap-6 text-[11px] font-mono text-ui-muted uppercase">
              <a href="#" className="hover:text-brand-primary inline-flex items-center gap-1">
                <MapPin className="size-3" /> Network Explorer
              </a>
              <a href="#" className="hover:text-brand-primary">Security Audit</a>
              <a href="#" className="hover:text-brand-primary">Governance</a>
            </div>
          </div>
        </footer>
      </main>
    </AppShell>
  );
}

function RoleLink({ label }: { label: string }) {
  return (
    <a
      href="#choose-role"
      className="text-xs font-mono uppercase tracking-widest text-ui-dark border-b border-ui-dark/20 hover:text-brand-primary hover:border-brand-primary pb-0.5"
    >
      {label} →
    </a>
  );
}
