import { useEffect, useState } from "react";
import { X, ScanLine, Loader2, CheckCircle2 } from "lucide-react";
import { useWallet } from "@/lib/wallet";
import { TxHash } from "@/components/TxHash";
import { depositWaste, decodeQR, type WasteDeposit } from "@/lib/api/ecoApi";

export function QrScanModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { address, refreshBalance } = useWallet();
  const [phase, setPhase] = useState<"scanning" | "found" | "confirming" | "rewarded" | "error">(
    "scanning",
  );
  const [scannedData, setScannedData] = useState<{
    productId: string;
    name: string;
    material: number;
    weightGrams: number;
    manufacturer: string;
  } | null>(null);
  const [deposit, setDeposit] = useState<WasteDeposit | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!open) return;
    setPhase("scanning");
    setScannedData(null);
    setDeposit(null);
    setErrorMsg("");

    // Simulate a QR scan (in a real app, use camera/QR scanner library).
    // For now, simulate finding a product after a brief delay.
    const t1 = setTimeout(() => {
      // Use a demo payload — in production this comes from the device camera
      setScannedData({
        productId: "",
        name: "Manual Drop-off",
        material: 0,
        weightGrams: 250,
        manufacturer: "Unknown",
      });
      setPhase("found");
    }, 1800);
    return () => clearTimeout(t1);
  }, [open]);

  if (!open) return null;

  const confirm = async () => {
    if (!address) return;
    setPhase("confirming");
    try {
      const result = await depositWaste({
        productId: scannedData?.productId ?? "",
        hasQr: !!scannedData?.productId,
        depositorAddr: address,
        collectorAddr: address, // In a real app, this would be the collector's address
        wasteType: (scannedData?.material ?? 0) as 0 | 1 | 2 | 3 | 4 | 5 | 6,
        weightGrams: scannedData?.weightGrams ?? 250,
      });
      setDeposit(result);
      setPhase("rewarded");
      refreshBalance();
      setTimeout(onClose, 2000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Drop-off failed");
      setPhase("error");
    }
  };

  const materialLabels = ["Plastic", "Glass", "Metal", "Paper", "Organic", "Electronic", "Other"];

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
                <span className="font-mono text-[10px] uppercase tracking-widest">
                  Locating item…
                </span>
              </div>
            ) : phase === "confirming" ? (
              <div className="flex flex-col items-center gap-2 text-neutral-400">
                <Loader2 className="size-10 text-brand-accent/60 animate-spin" />
                <span className="font-mono text-[10px] uppercase tracking-widest">
                  Sending to blockchain…
                </span>
              </div>
            ) : phase === "rewarded" ? (
              <div className="text-center px-6">
                <div className="size-12 mx-auto rounded-full bg-brand-accent/20 grid place-items-center ring-2 ring-brand-accent/40">
                  <CheckCircle2 className="size-6 text-brand-accent" />
                </div>
                <p className="mt-3 text-neutral-50 font-medium">
                  +{deposit?.tokensEarned} $ECO minted!
                </p>
                {deposit && (
                  <div className="mt-2">
                    <TxHash hash={deposit.txHash} />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center px-6">
                <div className="size-12 mx-auto rounded-full bg-brand-accent/20 grid place-items-center ring-2 ring-brand-accent/40">
                  <div className="size-3 bg-brand-accent rounded-full" />
                </div>
                <p className="mt-3 text-neutral-300 font-mono text-[10px] uppercase tracking-widest">
                  {scannedData?.productId
                    ? `Product #${scannedData.productId.slice(0, 8)}…`
                    : "Manual entry"}
                </p>
                <p className="text-neutral-50 font-medium mt-1">
                  {scannedData?.name ?? "Unknown item"}
                </p>
              </div>
            )}
          </div>
        </div>

        {(phase === "found" || phase === "error") && scannedData && (
          <div className="px-5 py-4 space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-ui-muted">Material</span>
              <span className="font-mono">
                {materialLabels[scannedData.material] ?? "Unknown"}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-ui-muted">Weight</span>
              <span className="font-mono">
                {(scannedData.weightGrams / 1000).toFixed(3)} kg
              </span>
            </div>

            {phase === "error" && (
              <div className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
                {errorMsg}
              </div>
            )}

            <button
              onClick={confirm}
              disabled={phase !== "found" && phase !== "error"}
              className="w-full py-3 rounded-[10px] bg-brand-primary text-neutral-50 text-sm font-medium active:scale-98 transition-transform disabled:bg-emerald-700"
            >
              {phase === "error" ? "Retry drop-off" : "Confirm drop-off"}
            </button>
          </div>
        )}

        {phase === "rewarded" && deposit && (
          <div className="px-5 py-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-ui-muted">Tokens earned</span>
              <span className="font-mono text-brand-secondary font-semibold">
                +{deposit.tokensEarned} $ECO
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-ui-muted">Deposit ID</span>
              <span className="font-mono">#{deposit.id}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
