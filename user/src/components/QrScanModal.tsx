import { useEffect, useState } from "react";
import { X, ScanLine } from "lucide-react";
import { useWallet } from "@/lib/wallet";
import { PRODUCTS } from "@/lib/mockData";

export function QrScanModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addReward } = useWallet();
  const [phase, setPhase] = useState<"scanning" | "found" | "rewarded">("scanning");

  useEffect(() => {
    if (!open) return;
    setPhase("scanning");
    const t1 = setTimeout(() => setPhase("found"), 1800);
    return () => clearTimeout(t1);
  }, [open]);

  if (!open) return null;
  const product = PRODUCTS[0];

  const confirm = () => {
    addReward(product.tokenReward);
    setPhase("rewarded");
    setTimeout(onClose, 1400);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-ui-dark/80 backdrop-blur-sm grid place-items-center px-4 animate-fade-up">
      <div className="w-full max-w-sm bg-background rounded-[16px] overflow-hidden ring-1 ring-black/10 shadow-2xl">
        <div className="flex justify-between items-center px-5 py-3 border-b border-zinc-200">
          <span className="font-mono text-[11px] uppercase tracking-widest text-ui-muted">
            QR Provenance Scan
          </span>
          <button onClick={onClose} className="text-ui-muted hover:text-ui-dark">
            <X className="size-4" />
          </button>
        </div>

        <div className="aspect-square bg-ui-dark relative overflow-hidden">
          <div className="absolute inset-6 border-2 border-brand-accent/60 rounded-2xl">
            <span className="absolute -top-px -left-px size-6 border-t-2 border-l-2 border-brand-accent rounded-tl-2xl" />
            <span className="absolute -top-px -right-px size-6 border-t-2 border-r-2 border-brand-accent rounded-tr-2xl" />
            <span className="absolute -bottom-px -left-px size-6 border-b-2 border-l-2 border-brand-accent rounded-bl-2xl" />
            <span className="absolute -bottom-px -right-px size-6 border-b-2 border-r-2 border-brand-accent rounded-br-2xl" />
            {phase === "scanning" && (
              <div className="absolute inset-x-0 top-0 h-[2px] bg-brand-accent shadow-[0_0_20px_4px_rgba(16,185,129,0.6)] animate-scan" />
            )}
          </div>
          <div className="absolute inset-0 grid place-items-center pointer-events-none">
            {phase === "scanning" ? (
              <div className="flex flex-col items-center gap-2 text-neutral-400">
                <ScanLine className="size-10 text-brand-accent/60" />
                <span className="font-mono text-[10px] uppercase tracking-widest">Locating item…</span>
              </div>
            ) : (
              <div className="text-center px-6">
                <div className="size-12 mx-auto rounded-full bg-brand-accent/20 grid place-items-center ring-2 ring-brand-accent/40">
                  <div className="size-3 bg-brand-accent rounded-full" />
                </div>
                <p className="mt-3 text-neutral-300 font-mono text-[10px] uppercase tracking-widest">
                  Item ID #{product.id}
                </p>
                <p className="text-neutral-50 font-medium mt-1">{product.name}</p>
              </div>
            )}
          </div>
        </div>

        {phase !== "scanning" && (
          <div className="px-5 py-4 space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-ui-muted">Material</span>
              <span className="font-mono">{product.material}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-ui-muted">Weight</span>
              <span className="font-mono">{product.weightKg.toFixed(3)} kg</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-ui-muted">Reward (vendor)</span>
              <span className="font-mono text-brand-secondary font-semibold">
                +{product.tokenReward.toFixed(2)} $ECO
              </span>
            </div>
            <button
              disabled={phase === "rewarded"}
              onClick={confirm}
              className="w-full py-3 rounded-[10px] bg-brand-primary text-neutral-50 text-sm font-medium active:scale-98 transition-transform disabled:bg-emerald-700"
            >
              {phase === "rewarded" ? "Reward minted ✓" : "Confirm drop-off"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
