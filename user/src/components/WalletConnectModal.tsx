import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Wallet, Loader2, CheckCircle2, X } from "lucide-react";
import { useWallet, shortAddr } from "@/lib/wallet";
import { useRoleSession } from "@/lib/roleSession";

type Props = {
  open: boolean;
  onClose: () => void;
  destination: "/consumer" | "/collector" | null;
  roleLabel: string;
};

// Frontend-only gate: any non-empty value (including demo placeholders) is accepted.

export function WalletConnectModal({ open, onClose, destination, roleLabel }: Props) {
  const navigate = useNavigate();
  const { address, connect } = useWallet();
  const { setActiveRole } = useRoleSession();
  const [manual, setManual] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) {
      setManual("");
      setTouched(false);
      setConnecting(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !destination) return null;

  const manualValid = manual.trim().length > 0;
  const canContinue = !!address || manualValid;

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await connect();
    } finally {
      setConnecting(false);
    }
  };

  const handleContinue = () => {
    if (!canContinue) {
      setTouched(true);
      return;
    }
    setActiveRole(destination === "/consumer" ? "consumer" : "collector");
    navigate({ to: destination });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-card rounded-[16px] ring-1 ring-black/5 shadow-2xl p-6 sm:p-7 animate-in zoom-in-95 fade-in duration-200"
      >
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
              <Wallet className="size-5 text-brand-primary" strokeWidth={1.8} />
            </div>
            <div>
              <h2 id="wallet-modal-title" className="text-lg font-semibold tracking-tight">
                Connect Wallet
              </h2>
              <p className="text-[11px] font-mono uppercase tracking-widest text-ui-muted mt-0.5">
                {roleLabel}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="size-8 rounded-full hover:bg-zinc-100 flex items-center justify-center text-ui-muted transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="text-sm text-ui-muted mb-5 text-pretty">
          A wallet ID is required to access rewards, verification records, and EcoToken
          transactions.
        </p>

        {/* Option A: Connect */}
        <div className="rounded-[12px] ring-1 ring-black/5 p-4 mb-3 bg-background">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">Connect Wallet</p>
              <p className="text-xs text-ui-muted mt-0.5 truncate">
                {address ? `Connected · ${shortAddr(address)}` : "Use the in-app demo wallet"}
              </p>
            </div>
            {address ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-brand-primary">
                <CheckCircle2 className="size-4" /> Linked
              </span>
            ) : (
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="inline-flex items-center gap-2 bg-ui-dark text-neutral-50 px-4 py-2 rounded-full text-xs font-medium hover:bg-brand-primary transition-colors disabled:opacity-60"
              >
                {connecting && <Loader2 className="size-3.5 animate-spin" />}
                {connecting ? "Connecting" : "Connect"}
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 my-4">
          <div className="h-px bg-zinc-200 flex-1" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-ui-muted">or</span>
          <div className="h-px bg-zinc-200 flex-1" />
        </div>

        {/* Option B: Manual */}
        <label className="block">
          <span className="text-xs font-mono uppercase tracking-widest text-ui-muted">
            Enter Wallet ID
          </span>
          <input
            type="text"
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            placeholder="0xECO-DEMO-1234"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            onBlur={() => setTouched(true)}
            className={`mt-2 w-full font-mono text-sm px-4 py-3 rounded-[12px] bg-background ring-1 transition-colors focus:outline-none focus:ring-2 ${
              manualValid
                ? "ring-brand-primary/40 focus:ring-brand-primary"
                : "ring-black/10 focus:ring-brand-primary"
            }`}
          />
          <span className="block mt-2 text-[11px] text-ui-muted">
            Demo mode: any value works (e.g. <span className="font-mono">0xECO-DEMO-1234</span>).
          </span>
        </label>

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-full text-sm font-medium bg-background ring-1 ring-black/10 hover:bg-zinc-100 transition-colors active:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            onClick={handleContinue}
            disabled={!canContinue}
            className="px-5 py-3 rounded-full text-sm font-medium bg-ui-dark text-neutral-50 hover:bg-brand-primary transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
