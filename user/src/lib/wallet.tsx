import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type WalletState = {
  address: string | null;
  balance: number;
  connect: () => Promise<void>;
  disconnect: () => void;
  addReward: (amount: number) => void;
};

const WalletCtx = createContext<WalletState | null>(null);

const MOCK_ADDRESS = "0xA1b2C3d4E5f6789012345678901234567890F09e";

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState(1240.5);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("ecotoken:wallet");
    if (saved) {
      const { address: a, balance: b } = JSON.parse(saved);
      setAddress(a);
      setBalance(b ?? 1240.5);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (address) {
      window.localStorage.setItem(
        "ecotoken:wallet",
        JSON.stringify({ address, balance }),
      );
    }
  }, [address, balance]);

  const connect = async () => {
    await new Promise((r) => setTimeout(r, 600));
    setAddress(MOCK_ADDRESS);
  };
  const disconnect = () => {
    setAddress(null);
    if (typeof window !== "undefined") window.localStorage.removeItem("ecotoken:wallet");
  };
  const addReward = (amount: number) => setBalance((b) => +(b + amount).toFixed(2));

  return (
    <WalletCtx.Provider value={{ address, balance, connect, disconnect, addReward }}>
      {children}
    </WalletCtx.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletCtx);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}

export const shortAddr = (a: string | null) =>
  a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";
