import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { QrCode, TrendingUp, Award, Flame, Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { QrScanModal } from "@/components/QrScanModal";
import { TxHash } from "@/components/TxHash";
import { useWallet, shortAddr } from "@/lib/wallet";
import { getDepositorHistory, type WasteDeposit } from "@/lib/api/ecoApi";
import { useCallback } from "react";
import { ArrowRight, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/consumer")({
  head: () => ({ meta: [{ title: "Consumer Wallet · EcoToken" }] }),
  component: Consumer,
});

function Consumer() {
  const { address, balance, connect, loading: walletLoading, refreshBalance } = useWallet();
  const [scanOpen, setScanOpen] = useState(false);
  const [deposits, setDeposits] = useState<WasteDeposit[]>([]);
  const [totalTokens, setTotalTokens] = useState(0);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load deposit history from backend
  const refreshData = useCallback(() => {
    if (!address) return;
    setLoadingHistory(true);
    getDepositorHistory(address)
      .then((res) => {
        setDeposits(res.deposits ?? []);
        setTotalTokens(res.totalTokens ?? 0);
      })
      .catch((err) => console.error("History fetch failed", err))
      .finally(() => setLoadingHistory(false));
    refreshBalance();
  }, [address, refreshBalance]);

  useEffect(() => {
    refreshData();
    // Poll for updates every 10 seconds to catch collector awards
    const interval = setInterval(refreshData, 10000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const handleScanComplete = () => {
    setScanOpen(false);
    refreshData();
  };

  return (
    <AppShell>
      <main className="px-4 max-w-screen-xl mx-auto py-8 grid md:grid-cols-12 gap-6">
        {/* Wallet card */}
        <section className="md:col-span-4 space-y-6">
          <div className="bg-zinc-900 text-neutral-50 p-8 rounded-[24px] ring-1 ring-white/10 relative overflow-hidden shadow-2xl">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-12">
                <div>
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">
                    Available Balance
                  </p>
                  <h2 className="text-5xl font-bold mt-2 tracking-tight text-white">
                    {address ? (balance || totalTokens).toLocaleString() : "—"}
                  </h2>
                  <p className="text-sm text-brand-secondary font-mono mt-1">$ECO Tokens</p>
                </div>
                <div className="size-12 bg-white/5 rounded-2xl flex items-center justify-center ring-1 ring-white/10 backdrop-blur-sm">
                  <TrendingUp className="size-6 text-brand-secondary" />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                  <span>Level Progress</span>
                  <span className="text-zinc-300">{deposits.length} / 10 Drops</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-primary shadow-[0_0_12px_rgba(34,197,94,0.4)] transition-all duration-1000"
                    style={{ width: `${Math.min(deposits.length * 10, 100)}%` }}
                  />
                </div>
                <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                  <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                    {address ? shortAddr(address) : "Disconnected"}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Design accents */}
            <div className="absolute -top-24 -right-24 size-48 bg-brand-primary/10 rounded-full blur-[80px]" />
            <div className="absolute -bottom-24 -left-24 size-48 bg-brand-secondary/5 rounded-full blur-[80px]" />
          </div>

          <button
            onClick={() => (address ? setScanOpen(true) : connect())}
            disabled={walletLoading}
            className="w-full flex items-center justify-between py-5 px-6 bg-brand-primary text-white rounded-2xl font-semibold hover:bg-brand-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 shadow-lg shadow-brand-primary/20"
          >
            <span className="flex items-center gap-3">
              {walletLoading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <QrCode className="size-5" />
              )}
              {!address
                ? "Connect Wallet"
                : walletLoading
                  ? "Verifying…"
                  : "Scan for Provenance"}
            </span>
            <ArrowRight className="size-4 opacity-40" />
          </button>

          <div className="grid grid-cols-3 gap-3">
            <ImpactTile icon={Award} value={deposits.length > 20 ? "Master" : deposits.length > 10 ? "Expert" : "Rookie"} label="Eco Status" />
            <ImpactTile icon={Flame} value={String(deposits.length)} label="Total Drops" />
            <ImpactTile icon={TrendingUp} value={String(totalTokens)} label="Lifetime" />
          </div>
        </section>

        {/* Recent ledger */}
        <section className="md:col-span-8 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold tracking-tight">Activity Ledger</h3>
              <p className="text-xs text-ui-muted font-mono uppercase tracking-widest">On-chain recycling events</p>
            </div>
            <button 
              onClick={refreshData}
              disabled={loadingHistory}
              className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-ui-muted disabled:opacity-50"
            >
              <RefreshCw className={`size-4 ${loadingHistory ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="bg-card ring-1 ring-black/5 rounded-[24px] overflow-hidden shadow-sm flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-100">
                <tr>
                  <Th>Reference</Th>
                  <Th>Material</Th>
                  <Th>Weight</Th>
                  <Th>Earned</Th>
                  <Th className="text-right">Chain Status</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {!address ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="size-12 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-300">
                          <TrendingUp className="size-6" />
                        </div>
                        <p className="text-sm text-ui-muted">Connect your wallet to synchronize with the Eco-ledger</p>
                      </div>
                    </td>
                  </tr>
                ) : loadingHistory && deposits.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-ui-muted">
                      <Loader2 className="size-6 animate-spin mx-auto mb-2" />
                      Synchronizing history…
                    </td>
                  </tr>
                ) : deposits.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="size-12 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-300">
                          <QrCode className="size-6" />
                        </div>
                        <p className="text-sm text-ui-muted">No recycling events found for this wallet yet</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  deposits.map((d) => (
                    <tr key={d.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="font-mono text-[10px] text-ui-muted uppercase tracking-tighter">REF#{d.id}</span>
                          <TxHash hash={d.txHash} />
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="font-semibold text-zinc-900">{d.wasteTypeName}</span>
                      </td>
                      <td className="px-6 py-5 font-mono text-zinc-600">{d.weightGrams}g</td>
                      <td className="px-6 py-5 font-bold text-brand-secondary">
                        +{d.tokensEarned} <span className="text-[10px] font-normal">ECO</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            d.status === 1 ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 
                            d.status === 2 ? 'bg-red-50 text-red-700 ring-1 ring-red-200' : 
                            'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                        }`}>
                          <div className={`size-1.5 rounded-full ${
                             d.status === 1 ? 'bg-emerald-500' : d.status === 2 ? 'bg-red-500' : 'bg-amber-500 animate-pulse'
                          }`} />
                          {d.statusName}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <QrScanModal
        open={scanOpen}
        onClose={handleScanComplete}
      />
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
