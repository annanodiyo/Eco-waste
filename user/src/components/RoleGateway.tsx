import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ScanLine, Truck, Factory, Recycle, ArrowUpRight, Wallet, X } from "lucide-react";
import { WalletConnectModal } from "./WalletConnectModal";
import { useRoleSession, type RoleKey } from "@/lib/roleSession";

type Role = {
  key: RoleKey;
  label: string;
  cta: string;
  desc: string;
  icon: typeof ScanLine;
  requiresWallet: boolean;
};

const ROLES: Role[] = [
  {
    key: "consumer",
    label: "Consumer",
    cta: "Join as Consumer",
    desc: "Deposit recyclable materials and earn rewards.",
    icon: ScanLine,
    requiresWallet: true,
  },
  {
    key: "collector",
    label: "Distributor / Collector",
    cta: "Join as Distributor / Collector",
    desc: "Verify, weigh, and manage collections.",
    icon: Truck,
    requiresWallet: true,
  },
  {
    key: "manufacturer",
    label: "Manufacturer",
    cta: "Join as Manufacturer",
    desc: "Track recovered materials and supply chains.",
    icon: Factory,
    requiresWallet: false,
  },
  {
    key: "recycler",
    label: "Recycler",
    cta: "Join as Recycler",
    desc: "Process and confirm recycling outputs.",
    icon: Recycle,
    requiresWallet: false,
  },
];

export function RoleGateway({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { setActiveRole } = useRoleSession();
  const [pending, setPending] = useState<Role | null>(null);

  useEffect(() => {
    if (!open) {
      setPending(null);
      return;
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleSelect = (role: Role) => {
    if (role.requiresWallet) {
      setPending(role);
      return;
    }

    setActiveRole(role.key);
    onClose();
    navigate({ to: "/dashboard" });
  };

  if (!open) return null;

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="role-picker-title"
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-5xl bg-card rounded-[16px] ring-1 ring-black/5 shadow-2xl p-6 sm:p-7 animate-in zoom-in-95 fade-in duration-200"
        >
          <div className="flex items-end justify-between mb-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-brand-primary">
                Choose your role
              </span>
              <h2 id="role-picker-title" className="mt-2 text-3xl font-semibold tracking-tight text-pretty max-w-[28ch]">
                Pick how you participate in the loop.
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden md:inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-ui-muted">
                <Wallet className="size-3" />
                Wallet required for Consumer & Collector
              </span>
              <button
                onClick={onClose}
                aria-label="Close"
                title="Close"
                className="size-8 rounded-full hover:bg-zinc-100 flex items-center justify-center text-ui-muted transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ROLES.map((r) => {
              const Icon = r.icon;
              return (
                <button
                  key={r.key}
                  onClick={() => handleSelect(r)}
                  className="group text-left bg-card ring-1 ring-black/5 rounded-[14px] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:ring-brand-primary/40 hover:shadow-lg active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="size-10 rounded-xl bg-brand-primary/10 flex items-center justify-center group-hover:bg-brand-primary/15 transition-colors">
                      <Icon className="size-5 text-brand-primary" strokeWidth={1.6} />
                    </div>
                    {r.requiresWallet && (
                      <span
                        title="Wallet required"
                        className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-ui-muted"
                      >
                        <Wallet className="size-3" />
                        Wallet
                      </span>
                    )}
                  </div>
                  <h3 className="font-medium leading-tight">{r.label}</h3>
                  <p className="mt-1.5 text-sm text-ui-muted text-pretty min-h-[2.5rem]">
                    {r.desc}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-ui-dark group-hover:text-brand-primary transition-colors">
                    {r.cta}
                    <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <WalletConnectModal
        open={!!pending}
        onClose={() => setPending(null)}
        role={pending?.key ?? null}
        roleLabel={pending?.label ?? ""}
      />
    </>
  );
}
