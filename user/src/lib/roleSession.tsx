import { createContext, useContext, useState, type ReactNode } from "react";

export type RoleKey = "consumer" | "collector" | "recycler" | "manufacturer";

export const ROLE_PATHS: Record<RoleKey, string> = {
  consumer: "/consumer",
  collector: "/collector",
  recycler: "/recycler",
  manufacturer: "/manufacturer",
};

const ALL_ROLE_PATHS = Object.values(ROLE_PATHS);

export function pathToRole(path: string): RoleKey | null {
  for (const [key, p] of Object.entries(ROLE_PATHS)) {
    if (path === p || path.startsWith(p + "/")) return key as RoleKey;
  }
  return null;
}

export function isRolePath(path: string): boolean {
  return ALL_ROLE_PATHS.some((p) => path === p || path.startsWith(p + "/"));
}

type RoleSessionState = {
  activeRole: RoleKey | null;
  setActiveRole: (role: RoleKey) => void;
  clearRole: () => void;
};

const Ctx = createContext<RoleSessionState | null>(null);
const STORAGE_KEY = "ecotoken:active-role";

export function RoleSessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [activeRole, setRole] = useState<RoleKey | null>(null);

  const setActiveRole = (role: RoleKey) => {
    setRole(role);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, role);
    }
  };

  const clearRole = () => {
    setRole(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <Ctx.Provider value={{ activeRole, setActiveRole, clearRole }}>
      {children}
    </Ctx.Provider>
  );
}

export function useRoleSession() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error(
      "useRoleSession must be used inside RoleSessionProvider"
    );
  }
  return ctx;
}