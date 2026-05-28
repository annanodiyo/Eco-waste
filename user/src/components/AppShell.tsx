import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Home,
  Wallet,
  Wifi,
  ScanLine,
  Truck,
  Recycle,
  Factory,
  LayoutDashboard,
  Gift,
  History,
  ListChecks,
  Boxes,
  MapPin,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  PackageCheck,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { useWallet, shortAddr } from "@/lib/wallet";
import { useRoleSession, pathToRole, isRolePath, type RoleKey } from "@/lib/roleSession";
import { SwitchRoleModal } from "./SwitchRoleModal";
import type { ReactNode } from "react";

type RoleDef = {
  key: RoleKey;
  label: string;
  path: "/consumer" | "/collector" | "/recycler" | "/manufacturer";
  icon: LucideIcon;
  sections: { label: string; hash: string; icon: LucideIcon }[];
};

const ROLES: Record<RoleKey, RoleDef> = {
  consumer: {
    key: "consumer",
    label: "Consumer",
    path: "/consumer",
    icon: ScanLine,
    sections: [
      { label: "Dashboard", hash: "dashboard", icon: LayoutDashboard },
      { label: "Rewards", hash: "rewards", icon: Gift },
      { label: "History", hash: "history", icon: History },
      { label: "Wallet", hash: "wallet", icon: Wallet },
    ],
  },
  collector: {
    key: "collector",
    label: "Collector",
    path: "/collector",
    icon: Truck,
    sections: [
      { label: "Queue", hash: "queue", icon: ListChecks },
      { label: "Inventory", hash: "inventory", icon: Boxes },
      { label: "Pickups", hash: "pickups", icon: MapPin },
      { label: "Wallet", hash: "wallet", icon: Wallet },
    ],
  },
  recycler: {
    key: "recycler",
    label: "Recycler",
    path: "/recycler",
    icon: Recycle,
    sections: [
      { label: "Intake", hash: "intake", icon: PackageCheck },
      { label: "Processing", hash: "processing", icon: Recycle },
      { label: "Impact", hash: "impact", icon: BarChart3 },
      { label: "Confirm", hash: "confirm", icon: CheckCircle2 },
    ],
  },
  manufacturer: {
    key: "manufacturer",
    label: "Manufacturer",
    path: "/manufacturer",
    icon: Factory,
    sections: [
      { label: "Batches", hash: "batches", icon: Boxes },
      { label: "Supply", hash: "supply", icon: Truck },
      { label: "Audit", hash: "audit", icon: ClipboardList },
      { label: "Reports", hash: "reports", icon: BarChart3 },
    ],
  },
};

export function AppShell({ children }: { children: ReactNode }) {
  const { address, connect, disconnect } = useWallet();
  const { activeRole } = useRoleSession();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [switchOpen, setSwitchOpen] = useState(false);
  const [denied, setDenied] = useState(false);

  // Route guard: enforce role-based access on role paths.
  useEffect(() => {
    if (!isRolePath(path)) {
      setDenied(false);
      return;
    }
    const routeRole = pathToRole(path);
    if (!activeRole) {
      // No session — kick back to landing for role selection.
      setDenied(true);
      navigate({ to: "/", hash: "choose-role" });
      return;
    }
    if (routeRole && routeRole !== activeRole) {
      setDenied(true);
      navigate({ to: ROLES[activeRole].path });
      return;
    }
    setDenied(false);
  }, [path, activeRole, navigate]);

  const role = activeRole ? ROLES[activeRole] : null;
  const ActiveIcon = role?.icon;

  if (denied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-sm text-center">
          <p className="text-xs font-mono uppercase tracking-widest text-brand-primary">
            Access restricted
          </p>
          <h1 className="mt-3 text-xl font-semibold tracking-tight">
            This workspace is locked to your active role.
          </h1>
          <p className="mt-2 text-sm text-ui-muted">Redirecting…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-brand-primary/10 pb-24 md:pb-0">
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-zinc-200">
        <div className="px-4 max-w-screen-xl mx-auto h-14 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="size-6 bg-brand-primary rounded-sm flex items-center justify-center">
              <div className="size-2 bg-neutral-50 rounded-full" />
            </div>
            <span className="font-mono text-sm font-semibold tracking-tighter uppercase">
              EcoToken
            </span>
            {role && ActiveIcon && (
              <span className="hidden sm:inline-flex items-center gap-1.5 ml-2 pl-2 border-l border-zinc-200 text-[10px] font-mono uppercase tracking-widest text-ui-muted">
                <ActiveIcon className="size-3 text-brand-primary" strokeWidth={2} />
                Role: {role.label}
              </span>
            )}
          </Link>

          {/* Center nav — sections of the active role only. Locked: no role switching here. */}
          <div className="hidden md:flex items-center gap-1 text-xs font-medium">
            {role ? (
              role.sections.map((s) => (
                <a
                  key={s.hash}
                  href={`#${s.hash}`}
                  className="px-3 py-1.5 rounded-full text-ui-dark/80 hover:text-ui-dark hover:bg-zinc-100 transition-colors inline-flex items-center gap-1.5"
                >
                  <s.icon className="size-3.5" strokeWidth={1.8} />
                  {s.label}
                </a>
              ))
            ) : (
              <Link
                to="/"
                hash="choose-role"
                className="px-3 py-1.5 rounded-full text-ui-dark/80 hover:text-ui-dark hover:bg-zinc-100 transition-colors inline-flex items-center gap-1.5"
              >
                Choose your role
              </Link>
            )}
          </div>

          {/* Right utility */}
          <div className="flex items-center gap-2 shrink-0">
            {role && (
              <button
                onClick={() => setSwitchOpen(true)}
                className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-ui-muted hover:text-brand-primary px-2 py-1 rounded-full"
              >
                <LogOut className="size-3" />
                Switch role
              </button>
            )}
            {address ? (
              <button
                onClick={disconnect}
                title="Disconnect wallet"
                className="flex items-center gap-2 bg-zinc-100 text-ui-dark px-3 py-2 rounded-full text-xs font-mono ring-1 ring-black/5 hover:bg-zinc-200 transition-colors"
              >
                <div className="size-1.5 bg-brand-accent rounded-full animate-pulse" />
                {shortAddr(address)}
              </button>
            ) : (
              <button
                onClick={connect}
                className="flex items-center gap-2 bg-ui-dark text-neutral-50 px-4 py-2 rounded-full text-sm font-medium ring-1 ring-black/10 active:scale-95 transition-transform hover:bg-brand-primary"
              >
                <Wifi className="size-3.5" />
                <span className="hidden sm:inline">Connect Wallet</span>
                <span className="sm:hidden">Connect</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile role-aware sub-nav (only when a role is active) */}
        {role && (
          <div className="md:hidden border-t border-zinc-200 overflow-x-auto no-scrollbar">
            <div className="flex gap-1 px-3 py-2 max-w-screen-xl mx-auto">
              {role.sections.map((s) => (
                <a
                  key={s.hash}
                  href={`#${s.hash}`}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-100 text-ui-dark hover:bg-brand-primary/10 hover:text-brand-primary transition-colors"
                >
                  <s.icon className="size-3.5" strokeWidth={1.8} />
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </nav>

      {children}

      {/* Mobile bottom bar — active role workspace controls only. */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-zinc-200 px-3 py-2 z-40">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <Link
            to="/"
            className={`flex flex-col items-center gap-0.5 py-1.5 px-3 ${path === "/" ? "text-brand-primary" : "text-zinc-400"}`}
          >
            <Home className="size-5" strokeWidth={path === "/" ? 2.2 : 1.6} />
            <span className="text-[10px] font-medium uppercase tracking-tighter">Home</span>
          </Link>
          {role && ActiveIcon && (
            <Link
              to={role.path}
              className="flex flex-col items-center gap-0.5 py-1.5 px-3 text-brand-primary"
            >
              <ActiveIcon className="size-5" strokeWidth={2.2} />
              <span className="text-[10px] font-medium uppercase tracking-tighter">
                {role.label}
              </span>
            </Link>
          )}
          {role && (
            <button
              onClick={() => setSwitchOpen(true)}
              className="flex flex-col items-center gap-0.5 py-1.5 px-3 text-zinc-400"
            >
              <LogOut className="size-5" strokeWidth={1.6} />
              <span className="text-[10px] font-medium uppercase tracking-tighter">Switch</span>
            </button>
          )}
        </div>
      </nav>

      <SwitchRoleModal open={switchOpen} onClose={() => setSwitchOpen(false)} />
    </div>
  );
}
