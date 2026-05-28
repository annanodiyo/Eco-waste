import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Activity, Wallet, BarChart3, Wifi } from "lucide-react";
import { useWallet, shortAddr } from "@/lib/wallet";
import type { ReactNode } from "react";

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/consumer", label: "Wallet", icon: Wallet },
  { to: "/collector", label: "Trace", icon: Activity },
  { to: "/recycler", label: "Impact", icon: BarChart3 },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { address, connect, disconnect } = useWallet();
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-brand-primary/10 pb-20 md:pb-0">
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-zinc-200">
        <div className="px-4 py-3 max-w-screen-xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-6 bg-brand-primary rounded-sm flex items-center justify-center">
              <div className="size-2 bg-neutral-50 rounded-full" />
            </div>
            <span className="font-mono text-sm font-semibold tracking-tighter uppercase">
              EcoToken Ledger
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider">
            <Link to="/consumer" className="px-3 py-1.5 rounded-full hover:bg-zinc-100">Consumer</Link>
            <Link to="/collector" className="px-3 py-1.5 rounded-full hover:bg-zinc-100">Collector</Link>
            <Link to="/recycler" className="px-3 py-1.5 rounded-full hover:bg-zinc-100">Recycler</Link>
            <Link to="/manufacturer" className="px-3 py-1.5 rounded-full hover:bg-zinc-100">Manufacturer</Link>
          </div>

          {address ? (
            <button
              onClick={disconnect}
              className="flex items-center gap-2 bg-zinc-100 text-ui-dark px-3 py-2 rounded-full text-xs font-mono ring-1 ring-black/5 hover:bg-zinc-200"
            >
              <div className="size-1.5 bg-brand-accent rounded-full animate-pulse" />
              {shortAddr(address)}
            </button>
          ) : (
            <button
              onClick={connect}
              className="flex items-center gap-2 bg-ui-dark text-neutral-50 px-4 py-2 rounded-full text-sm font-medium ring-1 ring-black/10 active:scale-95 transition-transform"
            >
              <Wifi className="size-3.5" />
              Connect Wallet
            </button>
          )}
        </div>
      </nav>

      {children}

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-zinc-200 px-4 py-2 z-40">
        <div className="flex justify-between items-center max-w-md mx-auto">
          {tabs.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? path === "/" : path.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center gap-1 py-2 px-3 ${active ? "text-brand-primary" : "text-zinc-400"}`}
              >
                <Icon className="size-5" strokeWidth={active ? 2.2 : 1.6} />
                <span className="text-[10px] font-medium uppercase tracking-tighter">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
