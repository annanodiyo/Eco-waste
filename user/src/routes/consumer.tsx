import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { QrCode, TrendingUp, Award, Flame, Loader2, Coins } from "lucide-react";
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

const API = "http://localhost:8080/api/v1";

async function getKshAmount(address: string): Promise<number> {
  const res = await fetch(`${API}/amount/${address}/kshs`);
  if (!res.ok) return 0;
  const data = await res.json();
  return data.kshValue ?? 0;
}

function Consumer() {
  const { address, balance, connect, loading: walletLoading, refreshBalance } = useWallet();
  const [scanOpen, setScanOpen]         = useState(false);
  const [deposits, setDeposits]         = useState<WasteDeposit[]>([]);
  const [totalTokens, setTotalTokens]   = useState(0);
  const [kshAmount, setKshAmount]       = useState<number | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

<<<<<<< Updated upstream
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
=======
  const loadAll = async (addr: string) => {
    setLoadingHistory(true);
    try {
      const [histRes, ksh] = await Promise.all([
        getDepositorHistory(addr),
        getKshAmount(addr),
      ]);
      setDeposits(histRes.deposits ?? []);
      setTotalTokens(histRes.totalTokens ?? 0);
      setKshAmount(ksh);
    } catch {
      // silent — empty state already shown
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (!address) {
      setDeposits([]);
      setTotalTokens(0);
      setKshAmount(null);
      return;
    }
    loadAll(address);
  }, [address]);

  const handleScanComplete = () => {
    setScanOpen(false);
    if (address) {
      refreshBalance();
      loadAll(address);
    }
>>>>>>> Stashed changes
  };

  return (
    <AppShell>
      <main className="px-4 max-w-screen-xl mx-auto py-8 grid md:grid-cols-12 gap-6">

        {/* Wallet card */}
<<<<<<< Updated upstream
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
=======
        <section className="md:col-span-4 space-y-4">
          <div className="bg-ui-dark text-neutral-50 p-6 rounded-[16px] ring-1 ring-black/5 relative overflow-hidden">
            <div className="flex justify-between items-start mb-10">
              <div>
                <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
                  Wallet Balance
                </p>
                <h2 className="text-4xl font-semibold mt-1">
                  {address ? (balance ?? totalTokens) : "—"}
                </h2>
                <p className="text-sm text-brand-accent">$ECOTKN</p>

                {/* KSH amount */}
                {address && (
                  <div className="mt-3 inline-flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
                    <Coins className="size-3 text-brand-accent" />
                    {kshAmount === null ? (
                      <Loader2 className="size-3 animate-spin text-neutral-400" />
                    ) : (
                      <span className="text-sm font-mono font-semibold text-brand-accent">
                        KES {kshAmount.toFixed(2)}
                      </span>
                    )}
                  </div>
                )}
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
            
            {/* Design accents */}
            <div className="absolute -top-24 -right-24 size-48 bg-brand-primary/10 rounded-full blur-[80px]" />
            <div className="absolute -bottom-24 -left-24 size-48 bg-brand-secondary/5 rounded-full blur-[80px]" />
=======

            <div className="space-y-3">
              <div className="flex justify-between text-xs text-neutral-400">
                <span>Total drops</span>
                <span className="font-mono text-neutral-200">{deposits.length}</span>
              </div>
              <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-accent transition-all"
                  style={{ width: `${Math.min(deposits.length * 10, 100)}%` }}
                />
              </div>
              <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest pt-3 border-t border-neutral-800 mt-3">
                {address ? shortAddr(address) : "Wallet not connected"}
              </p>
            </div>
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
              {!address
                ? "Connect Wallet"
                : walletLoading
                  ? "Verifying…"
                  : "Scan for Provenance"}
=======
              {!address ? "Connect MetaMask" : walletLoading ? "Connecting…" : "Scan waste QR"}
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest opacity-60">
              {address ? "Camera" : "MetaMask"}
>>>>>>> Stashed changes
            </span>
            <ArrowRight className="size-4 opacity-40" />
          </button>

<<<<<<< Updated upstream
          <div className="grid grid-cols-3 gap-3">
            <ImpactTile icon={Award} value={deposits.length > 20 ? "Master" : deposits.length > 10 ? "Expert" : "Rookie"} label="Eco Status" />
            <ImpactTile icon={Flame} value={String(deposits.length)} label="Total Drops" />
            <ImpactTile icon={TrendingUp} value={String(totalTokens)} label="Lifetime" />
=======
          {/* Impact tiles — 4 now, includes KSH */}
          <div className="grid grid-cols-2 gap-3">
            <ImpactTile
              icon={Award}
              value={deposits.length > 10 ? "L4" : `L${Math.floor(deposits.length / 3) + 1}`}
              label="Guardian"
            />
            <ImpactTile icon={Flame} value={String(deposits.length)} label="Drops" />
            <ImpactTile icon={TrendingUp} value={String(totalTokens)} label="Tokens" />
            <ImpactTile
              icon={Coins}
              value={kshAmount !== null ? `KES ${kshAmount.toFixed(2)}` : "—"}
              label="KSH Value"
              highlight
            />
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
                  <Th>Earned</Th>
                  <Th className="text-right">Chain Status</Th>
=======
                  <Th>Tokens</Th>
                  <Th>KSH Value</Th>
                  <Th className="text-right">Status</Th>
>>>>>>> Stashed changes
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {!address ? (
                  <tr>
<<<<<<< Updated upstream
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="size-12 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-300">
                          <TrendingUp className="size-6" />
                        </div>
                        <p className="text-sm text-ui-muted">Connect your wallet to synchronize with the Eco-ledger</p>
                      </div>
=======
                    <td colSpan={6} className="px-4 py-8 text-center text-ui-muted text-sm">
                      Connect your wallet to see your deposit history
>>>>>>> Stashed changes
                    </td>
                  </tr>
                ) : loadingHistory && deposits.length === 0 ? (
                  <tr>
<<<<<<< Updated upstream
                    <td colSpan={5} className="px-6 py-12 text-center text-ui-muted">
                      <Loader2 className="size-6 animate-spin mx-auto mb-2" />
                      Synchronizing history…
=======
                    <td colSpan={6} className="px-4 py-8 text-center text-ui-muted text-sm">
                      <Loader2 className="size-4 animate-spin inline mr-2" />
                      Loading from backend…
>>>>>>> Stashed changes
                    </td>
                  </tr>
                ) : deposits.length === 0 ? (
                  <tr>
<<<<<<< Updated upstream
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="size-12 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-300">
                          <QrCode className="size-6" />
                        </div>
                        <p className="text-sm text-ui-muted">No recycling events found for this wallet yet</p>
                      </div>
=======
                    <td colSpan={6} className="px-4 py-8 text-center text-ui-muted text-sm">
                      No deposits yet. Scan a QR code and drop off waste to earn $ECO!
>>>>>>> Stashed changes
                    </td>
                  </tr>
                ) : (
                  deposits.map((d) => (
<<<<<<< Updated upstream
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
=======
                    <tr key={d.id}>
                      <td className="px-4 py-4"><TxHash hash={d.txHash} /></td>
                      <td className="px-4 py-4 font-medium">{d.wasteTypeName}</td>
                      <td className="px-4 py-4 font-mono">{d.weightGrams}g</td>
                      <td className="px-4 py-4 font-mono text-brand-secondary">
                        +{d.tokensEarned} ECO
                      </td>
                      {/* KSH per deposit = tokensEarned * 0.5 */}
                      <td className="px-4 py-4 font-mono text-emerald-600">
                        KES {(d.tokensEarned * 0.5).toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span
                          className={`inline-block size-1.5 rounded-full mr-2 ${
                            d.status === 1
                              ? "bg-emerald-500"
                              : d.status === 2
                              ? "bg-red-500"
                              : "bg-amber-400"
                          }`}
                        />
                        <span className="text-[11px] font-medium uppercase tracking-tight">
>>>>>>> Stashed changes
                          {d.statusName}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* KSH total summary row */}
          {deposits.length > 0 && kshAmount !== null && (
            <div className="mt-3 flex justify-end">
              <div className="inline-flex items-center gap-2 bg-emerald-50 ring-1 ring-emerald-200 rounded-full px-4 py-2 text-sm">
                <Coins className="size-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-mono font-semibold">
                  Total: KES {kshAmount.toFixed(2)}
                </span>
                <span className="text-emerald-500 text-xs">from {totalTokens} tokens</span>
              </div>
            </div>
          )}
        </section>
      </main>

      <QrScanModal open={scanOpen} onClose={handleScanComplete} />
    </AppShell>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-3 font-mono text-[10px] text-ui-muted uppercase tracking-wider font-medium ${className}`}>
      {children}
    </th>
  );
}

function ImpactTile({
  icon: Icon, value, label, highlight = false,
}: {
  icon: React.ElementType; value: string; label: string; highlight?: boolean;
}) {
  return (
    <div className={`ring-1 rounded-[12px] p-3 ${highlight ? "bg-emerald-50 ring-emerald-200" : "bg-card ring-black/5"}`}>
      <Icon
        className={`size-4 mb-2 ${highlight ? "text-emerald-600" : "text-brand-primary"}`}
        strokeWidth={1.8}
      />
      <p className={`text-xl font-semibold leading-none ${highlight ? "text-emerald-700" : ""}`}>
        {value}
      </p>
      <p className="text-[10px] font-mono uppercase tracking-widest text-ui-muted mt-1">{label}</p>
    </div>
  );
}