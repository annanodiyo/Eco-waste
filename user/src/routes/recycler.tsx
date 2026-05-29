import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ChainBadge } from "@/components/ChainBadge";
import { TxHash } from "@/components/TxHash";
import { useWallet, shortAddr } from "@/lib/wallet";
import {
  getAllDeposits,
  confirmRecycling,
  type WasteDeposit,
} from "@/lib/api/ecoApi";

export const Route = createFileRoute("/recycler")({
  component: LegacyRecyclerRoute,
});

function LegacyRecyclerRoute() {
  return <Navigate to="/dashboard" />;
}

export function RecyclerDashboard() {
  const { address, connect } = useWallet();
  const [deposits, setDeposits] = useState<WasteDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadDeposits = () => {
    setLoading(true);
    getAllDeposits()
      .then((res) => setDeposits(res.deposits ?? []))
      .catch(() => { })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDeposits();
  }, []);

  const handleConfirm = async (depositId: number) => {
    if (!address) {
      await connect();
      return;
    }
    setConfirmingId(depositId);
    setError(null);
    setSuccessMsg(null);
    try {
      const result = await confirmRecycling(depositId, address);
      setSuccessMsg(
        `Deposit #${result.id} confirmed as recycled! Tx: ${result.txHash}`,
      );
      loadDeposits(); // refresh
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Confirmation failed");
    } finally {
      setConfirmingId(null);
    }
  };

  const pendingDeposits = deposits.filter((d) => d.status === 0);
  const recycledDeposits = deposits.filter((d) => d.status === 1);
  const totalWeightKg = (deposits.reduce((sum, d) => sum + d.weightGrams, 0) / 1000).toFixed(1);
  const totalTokens = deposits.reduce((sum, d) => sum + d.tokensEarned, 0);

  return (
    <AppShell>
      <main className="px-4 max-w-screen-xl mx-auto py-8 space-y-8">
        <header>
          <p className="text-[10px] font-mono uppercase tracking-widest text-brand-primary">
            Recycler · {address ? shortAddr(address) : "Not Connected"}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight mt-1">Recycler Dashboard</h1>
        </header>

        {/* Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { v: String(pendingDeposits.length), l: "Pending" },
            { v: String(recycledDeposits.length), l: "Recycled" },
            { v: `${totalWeightKg} kg`, l: "Total weight" },
            { v: String(totalTokens), l: "Tokens minted" },
          ].map((s) => (
            <div key={s.l} className="bg-card ring-1 ring-black/5 rounded-[12px] p-4">
              <p className="text-3xl font-semibold tracking-tight">{s.v}</p>
              <p className="text-[10px] font-mono uppercase tracking-widest text-ui-muted mt-1">
                {s.l}
              </p>
            </div>
          ))}
        </section>

        {/* Feedback messages */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            <AlertCircle className="size-4 flex-shrink-0" />
            {error}
          </div>
        )}
        {successMsg && (
          <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
            <Check className="size-4 flex-shrink-0" />
            {successMsg}
          </div>
        )}

        {/* All deposits table */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs font-mono uppercase tracking-widest text-ui-muted">
              All deposits
            </h2>
            <span className="text-[10px] font-mono text-ui-muted">
              {deposits.length} total
            </span>
          </div>
          <div className="bg-card ring-1 ring-black/5 rounded-[12px] overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  {["ID", "Depositor", "Material", "Weight", "Tokens", "Tx Hash", "Status", "Action"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left font-mono text-[10px] text-ui-muted uppercase tracking-wider font-medium"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-ui-muted text-sm">
                      <Loader2 className="size-4 animate-spin inline mr-2" />
                      Loading deposits…
                    </td>
                  </tr>
                ) : deposits.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-ui-muted text-sm">
                      No deposits in the system yet.
                    </td>
                  </tr>
                ) : (
                  deposits.map((d) => (
                    <tr key={d.id}>
                      <td className="px-4 py-4 font-mono text-xs">#{d.id}</td>
                      <td className="px-4 py-4 font-mono text-xs">
                        {shortAddr(d.depositorAddr) || "—"}
                      </td>
                      <td className="px-4 py-4">{d.wasteTypeName}</td>
                      <td className="px-4 py-4 font-mono">{d.weightGrams}g</td>
                      <td className="px-4 py-4 font-mono text-brand-secondary">
                        +{d.tokensEarned}
                      </td>
                      <td className="px-4 py-4">
                        <TxHash hash={d.txHash} />
                      </td>
                      <td className="px-4 py-4">
                        <ChainBadge
                          status={
                            d.status === 1
                              ? "verified"
                              : d.status === 2
                                ? "archived"
                                : "pending"
                          }
                        />
                      </td>
                      <td className="px-4 py-4">
                        {d.status === 0 ? (
                          <button
                            onClick={() => handleConfirm(d.id)}
                            disabled={confirmingId === d.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-accent text-ui-dark text-xs font-medium disabled:opacity-60 active:scale-95 transition-transform"
                          >
                            {confirmingId === d.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Check className="size-3.5" />
                            )}
                            {confirmingId === d.id ? "Confirming…" : "Confirm Recycling"}
                          </button>
                        ) : (
                          <span className="text-xs text-ui-muted font-mono">Done</span>
                        )}
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
