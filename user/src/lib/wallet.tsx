import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getDepositorHistory } from "@/lib/api/ecoApi";

// Extend the global Window with MetaMask's injected provider
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

type WalletState = {
  address: string | null;
  balance: number;
  loading: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
};

const WalletCtx = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  // Refresh token balance from the backend
  const refreshBalance = useCallback(async () => {
    if (!address) return;
    try {
      const { totalTokens } = await getDepositorHistory(address);
      setBalance(totalTokens);
    } catch {
      // backend may not be running yet — keep current balance
    }
  }, [address]);

  // On mount, restore from localStorage and listen for account changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = window.localStorage.getItem("ecotoken:wallet");
    if (saved) {
      try {
        const { address: a } = JSON.parse(saved);
        if (a) setAddress(a);
      } catch {
        /* corrupted — ignore */
      }
    }

    const handleAccountsChanged = (accounts: unknown) => {
      const accs = accounts as string[];
      if (accs.length === 0) {
        setAddress(null);
        window.localStorage.removeItem("ecotoken:wallet");
      } else {
        setAddress(accs[0]);
        window.localStorage.setItem("ecotoken:wallet", JSON.stringify({ address: accs[0] }));
      }
    };

    window.ethereum?.on("accountsChanged", handleAccountsChanged);
    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, []);

  // Fetch balance whenever address changes
  useEffect(() => {
    refreshBalance();
  }, [address, refreshBalance]);

  // Persist address
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (address) {
      window.localStorage.setItem("ecotoken:wallet", JSON.stringify({ address }));
    }
  }, [address]);

  const connect = async () => {
    if (!window.ethereum) {
      window.open("https://metamask.io/download/", "_blank");
      return;
    }
    setLoading(true);
    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      if (accounts[0]) {
        setAddress(accounts[0]);
      }
    } catch (err) {
      console.error("MetaMask connect error:", err);
    } finally {
      setLoading(false);
    }
  };

  const disconnect = () => {
    setAddress(null);
    setBalance(0);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("ecotoken:wallet");
    }
  };

  return (
    <WalletCtx.Provider value={{ address, balance, loading, connect, disconnect, refreshBalance }}>
      {children}
    </WalletCtx.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletCtx);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}

export const shortAddr = (a: string | null) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");
