import { createFileRoute } from "@tanstack/react-router";
import { Check, Boxes, Truck, Coins, Loader2, AlertCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ChainBadge } from "@/components/ChainBadge";
import { TxHash } from "@/components/TxHash";
import { useWallet, shortAddr } from "@/lib/wallet";
import { useEffect, useState } from "react";
import {
  getPendingDeposits,
  depositWaste,
  type WasteDeposit,
  type WasteType,
  WASTE_TYPE_LABELS,
} from "@/lib/api/ecoApi";

export const Route = createFileRoute("/collector")({
  head: () => ({ meta: [{ title: "Collection Point · EcoToken" }] }),
  component: Collector,
});

function Collector() {
  const { address, connect } = useWallet();
  const [pendingDeposits, setPendingDeposits] = useState<WasteDeposit[]>([]);
  const [loadingDeposits, setLoadingDeposits] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Manual drop-off form
  const [manualForm, setManualForm] = useState({
    depositorAddr: "",
    wasteType: 0 as WasteType,
    weightGrams: 500,
  });
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualResult, setManualResult] = useState<WasteDeposit | null>(null);
  const [manualError, setManualError] = useState<string | null>(null);

  // Load pending deposits
  const loadPending = () => {
    setLoadingDeposits(true);
    getPendingDeposits()
      .then((res) => setPendingDeposits(res.deposits ?? []))
      .catch(() => { })
      .finally(() => setLoadingDeposits(false));
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleManualDeposit = async () => {
    if (!address) {
      await connect();
      return;
    }
    setManualSubmitting(true);
    setManualError(null);
    setManualResult(null);
    try {
      const result = await depositWaste({
        hasQr: false,
        depositorAddr: manualForm.depositorAddr,
        collectorAddr: address,
        wasteType: manualForm.wasteType,
        weightGrams: manualForm.weightGrams,
      });
      setManualResult(result);
      loadPending(); // refresh
    } catch (err: unknown) {
      setManualError(err instanceof Error ? err.message : "Deposit failed");
    } finally {
      setManualSubmitting(false);
    }
  };

  const totalToday = pendingDeposits.reduce((acc, d) => acc + d.weightGrams, 0);
  const totalTokens = pendingDeposits.reduce((acc, d) => acc + d.tokensEarned, 0);

  return (
    <AppShell>
      <main className="px-4 max-w-screen-xl mx-auto py-8 space-y-8">
        <header className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-brand-primary">
              Collection Point · {address ? shortAddr(address) : "Not Connected"}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight mt-1">Operator Dashboard</h1>
          </div>
          <div className="flex gap-3 text-xs font-mono">
            <Kpi label="Pending" value={String(pendingDeposits.length)} />
            <Kpi label="Weight" value={`${(totalToday / 1000).toFixed(1)} kg`} />
            <Kpi label="Rewards" value={`${totalTokens} ECO`} icon={Coins} />
          </div>
        </header>

        {/* Manual drop-off form */}
        <section className="bg-card ring-1 ring-black/5 rounded-[16px] p-6 space-y-4">
          <h2 className="text-xs font-mono uppercase tracking-widest text-ui-muted">
            Record waste drop-off (manual)
          </h2>
          <div className="grid md:grid-cols-4 gap-3">
            <label className="block md:col-span-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-ui-muted">
                Consumer wallet
              </span>
              <input
                type="text"
                placeholder="0x…"
                value={manualForm.depositorAddr}
                onChange={(e) =>
                  setManualForm({ ...manualForm, depositorAddr: e.target.value })
                }
                className="mt-1 w-full bg-background ring-1 ring-black/10 rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:ring-brand-primary font-mono"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-mono uppercase tracking-widest text-ui-muted">
                Material
              </span>
              <select
                value={manualForm.wasteType}
                onChange={(e) =>
                  setManualForm({ ...manualForm, wasteType: Number(e.target.value) as WasteType })
                }
                className="mt-1 w-full bg-background ring-1 ring-black/10 rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:ring-brand-primary"
              >
                {Object.entries(WASTE_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[10px] font-mono uppercase tracking-widest text-ui-muted">
                Weight (grams)
              </span>
              <input
                type="number"
                value={manualForm.weightGrams}
                onChange={(e) =>
                  setManualForm({ ...manualForm, weightGrams: Number(e.target.value) || 0 })
                }
                className="mt-1 w-full bg-background ring-1 ring-black/10 rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:ring-brand-primary font-mono"
              />
            </label>
            <div className="flex items-end">
              <button
                onClick={handleManualDeposit}
                disabled={manualSubmitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-primary text-neutral-50 rounded-full text-sm font-medium active:scale-95 transition-transform disabled:opacity-60"
              >
                {manualSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                {!address ? "Connect Wallet" : manualSubmitting ? "Recording…" : "Weigh & Sign"}
              </button>
            </div>
          </div>

          {manualError && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              <AlertCircle className="size-4 flex-shrink-0" />
              {manualError}
            </div>
          )}

          {manualResult && (
            <div className="flex items-center gap-3 text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
              <Check className="size-4 flex-shrink-0" />
              Deposit #{manualResult.id} created — {manualResult.tokensEarned} ECO minted to{" "}
              {shortAddr(manualResult.depositorAddr)}
              <TxHash hash={manualResult.txHash} />
            </div>
          )}
        </section>

        {/* Pending deposits table */}
        <section>
          <h2 className="text-xs font-mono uppercase tracking-widest text-ui-muted mb-4">
            All pending deposits
          </h2>
          <div className="bg-card ring-1 ring-black/5 rounded-[12px] overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  {["ID", "Depositor", "Material", "Weight", "Tokens", "TX", "Status"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left font-mono text-[10px] text-ui-muted uppercase tracking-wider font-medium"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loadingDeposits ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-ui-muted text-sm">
                      <Loader2 className="size-4 animate-spin inline mr-2" />
                      Loading…
                    </td>
                  </tr>
                ) : pendingDeposits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-ui-muted text-sm">
                      No pending deposits. Record a drop-off above.
                    </td>
                  </tr>
                ) : (
                  pendingDeposits.map((d) => (
                    <tr key={d.id}>
                      <td className="px-4 py-4 font-mono text-xs">#{d.id}</td>
                      <td className="px-4 py-4 font-mono text-xs">{shortAddr(d.depositorAddr)}</td>
                      <td className="px-4 py-4">{d.wasteTypeName}</td>
                      <td className="px-4 py-4 font-mono">{d.weightGrams}g</td>
                      <td className="px-4 py-4 font-mono text-brand-secondary">+{d.tokensEarned}</td>
                      <td className="px-4 py-4">
                        <TxHash hash={d.txHash} />
                      </td>
                      <td className="px-4 py-4">
                        <ChainBadge status="pending" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
