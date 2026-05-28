import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ScanLine, Truck, Factory, Recycle, ArrowUpRight, Wallet } from "lucide-react";
import { WalletConnectModal } from "./WalletConnectModal";
import { useRoleSession, type RoleKey } from "@/lib/roleSession";

type Destination = "/consumer" | "/collector" | "/manufacturer" | "/recycler";

type Role = {
  key: RoleKey;
  label: string;
  cta: string;
  to: Destination;
  desc: string;
  icon: typeof ScanLine;
  requiresWallet: boolean;
};

const ROLES: Role[] = [
  {
    key: "consumer",
    label: "Consumer",
    cta: "Join as Consumer",
    to: "/consumer",
    desc: "Deposit recyclable materials and earn rewards.",
    icon: ScanLine,
    requiresWallet: true,
  },
  {
    key: "collector",
    label: "Distributor / Collector",
    cta: "Join as Distributor / Collector",
    to: "/collector",
    desc: "Verify, weigh, and manage collections.",
    icon: Truck,
    requiresWallet: true,
  },
  {
    key: "manufacturer",
    label: "Manufacturer",
    cta: "Join as Manufacturer",
    to: "/manufacturer",
    desc: "Track recovered materials and supply chains.",
    icon: Factory,
    requiresWallet: false,
  },
  {
    key: "recycler",
    label: "Recycler",
    cta: "Join as Recycler",
    to: "/recycler",
    desc: "Process and confirm recycling outputs.",
    icon: Recycle,
    requiresWallet: false,
  },
];

export function RoleGateway() {
  const navigate = useNavigate();
  const { setActiveRole } = useRoleSession();
  const [pending, setPending] = useState<Role | null>(null);

  const handleSelect = (role: Role) => {
    if (role.requiresWallet) {
      setPending(role);
    } else {
      setActiveRole(role.key);
      navigate({ to: role.to });
    }
  };

  return (
    <section
      id="choose-role"
      className="px-4 max-w-screen-xl mx-auto py-12 border-t border-zinc-200"
    >
      <div className="flex items-end justify-between mb-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-brand-primary">
            Choose your role
          </span>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-pretty max-w-[28ch]">
            Pick how you participate in the loop.
          </h2>
        </div>
        <span className="hidden md:inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-ui-muted">
          <Wallet className="size-3" />
          Wallet required for Consumer & Collector
        </span>
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

      <WalletConnectModal
        open={!!pending}
        onClose={() => setPending(null)}
        destination={
          pending?.to === "/consumer" || pending?.to === "/collector" ? pending.to : null
        }
        roleLabel={pending?.label ?? ""}
      />
    </section>
  );
}
