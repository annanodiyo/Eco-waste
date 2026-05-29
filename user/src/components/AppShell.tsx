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
  ListChecks,
  Boxes,
  MapPin,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { useWallet, shortAddr } from "@/lib/wallet";
import { useRoleSession, type RoleKey } from "@/lib/roleSession";
import { consumeQueuedRolePickerOpen, onRolePickerOpen, openRolePicker } from "@/lib/rolePicker";
import { RoleGateway } from "./RoleGateway";
import type { ReactNode } from "react";

type RoleDef = {
  key: RoleKey;
  path: "/dashboard";
  icon: LucideIcon;
  sections: { label: string; to: string; icon: LucideIcon }[];
};

const ROLES: Record<RoleKey, RoleDef> = {
  consumer: {
    key: "consumer",
    path: "/dashboard",
    icon: ScanLine,
    sections: [{ label: "Dashboard", to: "/dashboard", icon: LayoutDashboard }],
  },
  collector: {
    key: "collector",
    path: "/dashboard",
    icon: Truck,
    sections: [
      { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
      { label: "Queue", to: "/dashboard/queue", icon: ListChecks },
      { label: "Inventory", to: "/dashboard/inventory", icon: Boxes },
      { label: "Pickups", to: "/dashboard/pickups", icon: MapPin },
      { label: "Wallet", to: "/dashboard", icon: Wallet },
    ],
  },
  recycler: {
    key: "recycler",
    path: "/dashboard",
    icon: Recycle,
    sections: [{ label: "Dashboard", to: "/dashboard", icon: LayoutDashboard }],
  },
  manufacturer: {
    key: "manufacturer",
    path: "/dashboard",
    icon: Factory,
    sections: [{ label: "Dashboard", to: "/dashboard", icon: LayoutDashboard }],
  },
};
const MULTI_PAGE_ROLES = new Set<RoleKey>(["collector"]);
const COLLECTOR_ALLOWED_PATHS = new Set([
  "/dashboard",
  "/dashboard/queue",
  "/dashboard/inventory",
  "/dashboard/pickups",
]);

function isWorkspacePath(path: string) {
  return path === "/dashboard" || path.startsWith("/dashboard/");
}

export function AppShell({ children }: { children: ReactNode }) {
  const { address, connect, disconnect } = useWallet();
  const { activeRole, clearRole } = useRoleSession();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [denied, setDenied] = useState(false);
  const [rolePickerOpen, setRolePickerOpen] = useState(false);

  useEffect(() => onRolePickerOpen(() => setRolePickerOpen(true)), []);

  useEffect(() => {
    if (path === "/" && consumeQueuedRolePickerOpen()) {
      setRolePickerOpen(true);
    }
  }, [path]);

  useEffect(() => {
    if (!isWorkspacePath(path)) {
      setDenied(false);
      return;
    }

    if (!activeRole) {
      setDenied(true);
      navigate({ to: "/" });
      return;
    }

    if (!MULTI_PAGE_ROLES.has(activeRole) && path !== "/dashboard") {
      setDenied(true);
      navigate({ to: "/dashboard" });
      return;
    }
    if (activeRole === "collector" && !COLLECTOR_ALLOWED_PATHS.has(path)) {
      setDenied(true);
      navigate({ to: "/dashboard" });
      return;
    }

    setDenied(false);
  }, [path, activeRole, navigate]);

  const role = activeRole ? ROLES[activeRole] : null;
  const ActiveIcon = role?.icon;
  const inDashboard = path === "/dashboard" || path.startsWith("/dashboard/");

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
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="font-mono text-sm font-semibold tracking-tighter uppercase">
              EcoToken
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1 text-xs font-medium">
            {role ? (
              role.sections.map((s) => (
                <Link
                  key={s.to + s.label}
                  to={s.to}
                  className="px-3 py-1.5 rounded-full text-ui-dark/80 hover:text-ui-dark hover:bg-zinc-100 transition-colors inline-flex items-center gap-1.5"
                >
                  <s.icon className="size-3.5" strokeWidth={1.8} />
                  {s.label}
                </Link>
              ))
            ) : (
              <button
                onClick={() => setRolePickerOpen(true)}
                className="px-3 py-1.5 rounded-full text-ui-dark/80 hover:text-ui-dark hover:bg-zinc-100 transition-colors inline-flex items-center gap-1.5"
              >
                Choose your role
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {role && (
              <button
                onClick={() => {
                  clearRole();
                  navigate({ to: "/" });
                }}
                className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-ui-muted hover:text-red-500 px-3 py-1 rounded-full transition-colors"
              >
                <LogOut className="size-3" />
                Exit Workspace
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

        {role && (
          <div className="md:hidden border-t border-zinc-200 overflow-x-auto no-scrollbar">
            <div className="flex gap-1 px-3 py-2 max-w-screen-xl mx-auto">
              {role.sections.map((s) => (
                <Link
                  key={s.to + s.label}
                  to={s.to}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-100 text-ui-dark hover:bg-brand-primary/10 hover:text-brand-primary transition-colors"
                >
                  <s.icon className="size-3.5" strokeWidth={1.8} />
                  {s.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {children}

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
              to="/dashboard"
              className={`flex flex-col items-center gap-0.5 py-1.5 px-3 ${inDashboard ? "text-brand-primary" : "text-zinc-400"}`}
            >
              <ActiveIcon className="size-5" strokeWidth={inDashboard ? 2.2 : 1.6} />
              <span className="text-[10px] font-medium uppercase tracking-tighter">Dashboard</span>
            </Link>
          )}
          {!role && (
            <button
              onClick={openRolePicker}
              aria-label="Choose your role"
              className="flex flex-col items-center gap-0.5 py-1.5 px-3 text-zinc-400 hover:text-brand-primary transition-colors"
            >
              <LayoutDashboard className="size-5" strokeWidth={1.6} />
              <span className="text-[10px] font-medium uppercase tracking-tighter">Role</span>
            </button>
          )}
          {role && (
            <button
              onClick={() => {
                clearRole();
                navigate({ to: "/" });
              }}
              className="flex flex-col items-center gap-0.5 py-1.5 px-3 text-zinc-400 hover:text-red-500 transition-colors"
            >
              <LogOut className="size-5" strokeWidth={1.6} />
              <span className="text-[10px] font-medium uppercase tracking-tighter">Exit</span>
            </button>
          )}
        </div>
      </nav>

      <RoleGateway open={rolePickerOpen} onClose={() => setRolePickerOpen(false)} />
    </div>
  );
}
