import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { QrCode, TrendingUp, Award, Flame, Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { QrScanModal } from "@/components/QrScanModal";
import { TxHash } from "@/components/TxHash";
import { useWallet, shortAddr } from "@/lib/wallet";
import { getDepositorHistory, type WasteDeposit } from "@/lib/api/ecoApi";

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
  useEffect(() => {
    if (!address) {
      setDeposits([]);
      setTotalTokens(0);
      return;
    }
    setLoadingHistory(true);
    getDepositorHistory(address)
      .then((res) => {
        setDeposits(res.deposits ?? []);
        setTotalTokens(res.totalTokens ?? 0);
      })
      .catch(() => { })
      .finally(() => setLoadingHistory(false));
  }, [address]);

  const handleScanComplete = () => {
    setScanOpen(false);
    // Refresh the deposit history after a scan/drop-off
    if (address) {
      refreshBalance();
      getDepositorHistory(address)
        .then((res) => {
          setDeposits(res.deposits ?? []);
          setTotalTokens(res.totalTokens ?? 0);
        })
        .catch(() => { });
    }
  };

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
                <h2 className="text-4xl font-semibold mt-1">
                  {address ? (balance ?? totalTokens) : "—"}
                </h2>
                <p className="text-sm text-brand-accent">$ECOTKN</p>
              </div>
              <div className="size-10 bg-brand-primary/30 rounded-lg grid place-items-center">
                <TrendingUp className="size-4 text-brand-accent" />
              </div>
            </div>
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
          </div>

          <button
            onClick={() => (address ? setScanOpen(true) : connect())}
            disabled={walletLoading}
            className="w-full flex items-center justify-between py-4 px-4 bg-brand-primary text-neutral-50 rounded-[12px] font-medium active:scale-98 transition-transform disabled:opacity-60"
          >
            <span className="flex items-center gap-3">
              {walletLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <QrCode className="size-4" />
              )}
              {!address
                ? "Connect MetaMask"
                : walletLoading
                  ? "Connecting…"
                  : "Scan waste QR"}
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest opacity-60">
              {address ? "Camera" : "MetaMask"}
            </span>
          </button>

          <div className="grid grid-cols-3 gap-3">
            <ImpactTile icon={Award} value={deposits.length > 10 ? "L4" : `L${Math.floor(deposits.length / 3) + 1}`} label="Guardian" />
            <ImpactTile icon={Flame} value={String(deposits.length)} label="Drops" />
            <ImpactTile icon={TrendingUp} value={String(totalTokens)} label="Tokens" />
          </div>
        </section>

        {/* Recent ledger */}
        <section className="md:col-span-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Your deposit history</h3>
            <span className="text-xs font-mono text-ui-muted uppercase tracking-widest">
              {deposits.length} transaction{deposits.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="bg-card ring-1 ring-black/5 rounded-[12px] overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <Th>Tx Hash</Th>
                  <Th>Material</Th>
                  <Th>Weight</Th>
                  <Th>Tokens</Th>
                  <Th className="text-right">Status</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {!address ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-ui-muted text-sm">
                      Connect your wallet to see your deposit history
                    </td>
                  </tr>
                ) : loadingHistory ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-ui-muted text-sm">
                      <Loader2 className="size-4 animate-spin inline mr-2" />
                      Loading from backend…
                    </td>
                  </tr>
                ) : deposits.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-ui-muted text-sm">
                      No deposits yet. Scan a QR code and drop off waste to earn $ECO!
                    </td>
                  </tr>
                ) : (
                  deposits.map((d) => (
                    <tr key={d.id}>
                      <td className="px-4 py-4">
                        <TxHash hash={d.txHash} />
                      </td>
                      <td className="px-4 py-4 font-medium">{d.wasteTypeName}</td>
                      <td className="px-4 py-4 font-mono">{d.weightGrams}g</td>
                      <td className="px-4 py-4 font-mono text-brand-secondary">
                        +{d.tokensEarned} ECO
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span
                          className={`inline-block size-1.5 rounded-full mr-2 ${d.status === 1
                              ? "bg-emerald-500"
                              : d.status === 2
                                ? "bg-red-500"
                                : "bg-amber-400"
                            }`}
                        />
                        <span className="text-[11px] font-medium uppercase tracking-tight">
                          {d.statusName}
                        </span>
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
