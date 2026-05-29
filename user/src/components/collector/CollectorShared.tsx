import { useCallback, useEffect, useState } from "react";
import { Coins, Loader2 } from "lucide-react";
import { ChainBadge } from "@/components/ChainBadge";
import { TxHash } from "@/components/TxHash";
import { shortAddr } from "@/lib/wallet";
import { getPendingDeposits, type WasteDeposit } from "@/lib/api/ecoApi";
import { toast } from "sonner";

export function useCollectorDeposits() {
  const [pendingDeposits, setPendingDeposits] = useState<WasteDeposit[]>([]);
  const [loadingDeposits, setLoadingDeposits] = useState(true);

  const loadPending = useCallback(() => {
    setLoadingDeposits(true);
    getPendingDeposits()
      .then((res) => setPendingDeposits(res.deposits ?? []))
      .catch((error) => {
        console.error("Failed to load pending deposits", error);
        toast.error("Failed to load pending deposits");
      })
      .finally(() => setLoadingDeposits(false));
  }, []);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  return { pendingDeposits, loadingDeposits, loadPending };
}

export function CollectorKpis({ pendingDeposits }: { pendingDeposits: WasteDeposit[] }) {
  const totalToday = pendingDeposits.reduce((acc, d) => acc + d.weightGrams, 0);
  const totalTokens = pendingDeposits.reduce((acc, d) => acc + d.tokensEarned, 0);

  return (
    <div className="flex gap-3 text-xs font-mono">
      <Kpi label="Pending" value={String(pendingDeposits.length)} />
      <Kpi label="Weight" value={`${(totalToday / 1000).toFixed(1)} kg`} />
      <Kpi label="Rewards" value={`${totalTokens} ECO`} icon={Coins} />
    </div>
  );
}

export function CollectorPendingDepositsTable({
  pendingDeposits,
  loadingDeposits,
}: {
  pendingDeposits: WasteDeposit[];
  loadingDeposits: boolean;
}) {
  return (
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
