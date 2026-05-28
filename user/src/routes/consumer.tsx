import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { QrCode, TrendingUp, Award, Flame } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { QrScanModal } from "@/components/QrScanModal";
import { useWallet, shortAddr } from "@/lib/wallet";
import { RECENT_TX } from "@/lib/mockData";

export const Route = createFileRoute("/consumer")({
  head: () => ({ meta: [{ title: "Consumer Wallet · EcoToken" }] }),
  component: Consumer,
});

function Consumer() {
  const { address, balance, connect } = useWallet();
  const [scanOpen, setScanOpen] = useState(false);

  return (
    <AppShell>
      <main className="px-4 max-w-screen-xl mx-auto py-8 grid md:grid-cols-12 gap-6">
        {/* Wallet card */}
        <section className="md:col-span-4 space-y-4">
          <div className="bg-ui-dark text-neutral-50 p-6 rounded-[16px] ring-1 ring-black/5 relative overflow-hidden">
            <div className="flex justify-between items-start mb-10">
              <div>
                <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
                  Wallet Balance
                </p>
                <h2 className="text-4xl font-semibold mt-1">{balance.toFixed(2)}</h2>
                <p className="text-sm text-brand-accent">$ECOTKN</p>
              </div>
              <div className="size-10 bg-brand-primary/30 rounded-lg grid place-items-center">
                <TrendingUp className="size-4 text-brand-accent" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-xs text-neutral-400">
                <span>Lifetime CO₂ offset</span>
                <span className="font-mono text-neutral-200">42.8 kg</span>
              </div>
              <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-brand-accent w-3/4" />
              </div>
              <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest pt-3 border-t border-neutral-800 mt-3">
                {address ? shortAddr(address) : "Wallet not connected"}
              </p>
            </div>
          </div>

          <button
            onClick={() => (address ? setScanOpen(true) : connect())}
            className="w-full flex items-center justify-between py-4 px-4 bg-brand-primary text-neutral-50 rounded-[12px] font-medium active:scale-98 transition-transform"
          >
            <span className="flex items-center gap-3">
              <QrCode className="size-4" />
              {address ? "Scan waste QR" : "Connect to scan"}
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest opacity-60">
              Camera
            </span>
          </button>

          <div className="grid grid-cols-3 gap-3">
            <ImpactTile icon={Award} value="L4" label="Guardian" />
            <ImpactTile icon={Flame} value="14" label="Streak" />
            <ImpactTile icon={TrendingUp} value="62" label="Items" />
          </div>
        </section>

        {/* Recent ledger */}
        <section className="md:col-span-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Recent chain events</h3>
            <a href="#" className="text-xs font-mono text-ui-muted uppercase tracking-widest hover:text-brand-primary">
              View explorer
            </a>
          </div>

          <div className="bg-card ring-1 ring-black/5 rounded-[12px] overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <Th>Tx Hash</Th>
                  <Th>Action</Th>
                  <Th>Value</Th>
                  <Th className="text-right">Status</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {RECENT_TX.map((t) => (
                  <tr key={t.hash}>
                    <td className="px-4 py-4 font-mono text-xs text-ui-muted">{t.hash}</td>
                    <td className="px-4 py-4 font-medium">{t.action}</td>
                    <td
                      className={`px-4 py-4 font-mono ${
                        t.value.startsWith("+") ? "text-brand-secondary" : t.value.startsWith("-") ? "text-ui-muted" : ""
                      }`}
                    >
                      {t.value}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span
                        className={`inline-block size-1.5 rounded-full mr-2 ${
                          t.status === "Confirmed" ? "bg-emerald-500" : "bg-amber-400"
                        }`}
                      />
                      <span className="text-[11px] font-medium uppercase tracking-tight">
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <QrScanModal open={scanOpen} onClose={() => setScanOpen(false)} />
    </AppShell>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-4 py-3 font-mono text-[10px] text-ui-muted uppercase tracking-wider font-medium ${className}`}
    >
      {children}
    </th>
  );
}

function ImpactTile({ icon: Icon, value, label }: { icon: React.ElementType; value: string; label: string }) {
  return (
    <div className="bg-card ring-1 ring-black/5 rounded-[12px] p-3">
      <Icon className="size-4 text-brand-primary mb-2" strokeWidth={1.8} />
      <p className="text-xl font-semibold leading-none">{value}</p>
      <p className="text-[10px] font-mono uppercase tracking-widest text-ui-muted mt-1">
        {label}
      </p>
    </div>
  );
}
