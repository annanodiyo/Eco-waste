import { PRODUCTS as JOURNEY_PRODUCTS, BATCHES } from "@/lib/mockData";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8080/api/v1";
const MOCK_STORAGE_KEY = "ecotoken:mock-state:v1";
const MOCK_MODE_KEY = "ecotoken:mock-mode";
const ECO_TO_KSH_RATE = 0.5;
const MOCK_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";

export type WasteType = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export const WASTE_TYPE_LABELS: Record<WasteType, string> = {
  0: "Plastic",
  1: "Glass",
  2: "Metal",
  3: "Paper",
  4: "Organic",
  5: "Electronic",
  6: "Other",
};

export const WASTE_REWARD_RATES: Record<WasteType, number> = {
  0: 0.1,
  1: 0.05,
  2: 0.15,
  3: 0.08,
  4: 0.03,
  5: 0.2,
  6: 0.02,
};

export interface Product {
  productId: string;
  name: string;
  material: WasteType;
  materialName: string;
  weightGrams: number;
  manufacturer: string;
  walletAddr: string;
  registeredAt: string;
  txHash: string;
  qrCode: string;
}

export interface WasteDeposit {
  id: number;
  productId: string;
  hasQr: boolean;
  depositorAddr: string;
  collectorAddr: string;
  wasteType: WasteType;
  wasteTypeName: string;
  weightGrams: number;
  tokensEarned: number;
  status: number;
  statusName: string;
  txHash: string;
  timestamp: string;
  recycledAt?: string;
}

export interface RegisterProductPayload {
  name: string;
  manufacturer: string;
  material: WasteType;
  weightGrams: number;
  walletAddr?: string;
}

export interface DepositWastePayload {
  productId?: string;
  hasQr: boolean;
  depositorAddr: string;
  collectorAddr: string;
  wasteType: WasteType;
  weightGrams: number;
}

type MockState = {
  products: Product[];
  deposits: WasteDeposit[];
  nextDepositId: number;
};

function toIso() {
  return new Date().toISOString();
}

function randomHash() {
  return `0x${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
}

function rewardFor(weightGrams: number, wasteType: WasteType): number {
  return Number((weightGrams * WASTE_REWARD_RATES[wasteType]).toFixed(2));
}

function materialToWasteType(material: string): WasteType {
  switch (material.toLowerCase()) {
    case "glass":
      return 1;
    case "aluminum":
    case "alu":
    case "metal":
      return 2;
    case "paper":
    case "cardboard":
      return 3;
    case "organic":
      return 4;
    case "electronic":
      return 5;
    default:
      return 0;
  }
}

function seedMockState(): MockState {
  const products: Product[] = JOURNEY_PRODUCTS.map((p, idx) => ({
    productId: p.id,
    name: p.name,
    material: materialToWasteType(p.material),
    materialName: p.material,
    weightGrams: Math.round(p.weightKg * 1000),
    manufacturer: p.manufacturer,
    walletAddr: `0xMOCK${idx}`,
    registeredAt: p.events[0]?.timestamp || toIso(),
    txHash: p.events[0]?.txHash || randomHash(),
    qrCode: `data:image/png;base64,${MOCK_PNG}`,
  }));

  const deposits: WasteDeposit[] = BATCHES.map((batch, idx) => {
    const wasteType = materialToWasteType(batch.material);
    const weightGrams = batch.kg * 1000;
    const recycled = batch.status.toLowerCase() === "closed";
    return {
      id: idx + 1,
      productId: batch.id,
      hasQr: true,
      depositorAddr: `0xDEPOSITOR${idx}`,
      collectorAddr: "0xCOLLECTOR",
      wasteType,
      wasteTypeName: WASTE_TYPE_LABELS[wasteType],
      weightGrams,
      tokensEarned: rewardFor(weightGrams, wasteType),
      status: recycled ? 1 : 0,
      statusName: recycled ? "recycled" : "pending",
      txHash: randomHash(),
      timestamp: toIso(),
      recycledAt: recycled ? toIso() : undefined,
    };
  });

  return {
    products,
    deposits,
    nextDepositId: deposits.length + 1,
  };
}

function loadMockState(): MockState {
  if (typeof window === "undefined") return seedMockState();
  try {
    const raw = window.localStorage.getItem(MOCK_STORAGE_KEY);
    if (!raw) {
      const seeded = seedMockState();
      window.localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as MockState;
    if (!parsed.products || !parsed.deposits || !parsed.nextDepositId) {
      const seeded = seedMockState();
      window.localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return parsed;
  } catch {
    const seeded = seedMockState();
    if (typeof window !== "undefined") {
      window.localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(seeded));
    }
    return seeded;
  }
}

function saveMockState(state: MockState) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(state));
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as Record<string, string>).error ?? `API ${res.status}`);
  }
  return res.json() as Promise<T>;
}

function isBackendUnreachable(err: unknown) {
  const message = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    message.includes("failed to fetch") ||
    message.includes("fetch failed") ||
    message.includes("networkerror") ||
    message.includes("network request failed") ||
    message.includes("econnrefused") ||
    message.includes("load failed")
  );
}

async function requestWithFallback<T>(
  path: string,
  init: RequestInit | undefined,
  fallback: () => T | Promise<T>,
): Promise<T> {
  if (typeof window !== "undefined" && window.localStorage.getItem(MOCK_MODE_KEY) === "1") {
    return fallback();
  }
  try {
    return await request<T>(path, init);
  } catch (err) {
    if (isBackendUnreachable(err)) {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(MOCK_MODE_KEY, "1");
      }
      return fallback();
    }
    throw err;
  }
}

export async function registerProduct(data: RegisterProductPayload): Promise<Product> {
  return requestWithFallback("/products/register", {
    method: "POST",
    body: JSON.stringify(data),
  }, () => {
    const state = loadMockState();
    const product: Product = {
      productId: `MOCK-${Date.now()}`,
      name: data.name,
      material: data.material,
      materialName: WASTE_TYPE_LABELS[data.material],
      weightGrams: data.weightGrams,
      manufacturer: data.manufacturer,
      walletAddr: data.walletAddr ?? "0xMOCK-MANUFACTURER",
      registeredAt: toIso(),
      txHash: randomHash(),
      qrCode: `data:image/png;base64,${MOCK_PNG}`,
    };
    state.products = [product, ...state.products];
    saveMockState(state);
    return product;
  });
}

export async function listProducts(): Promise<{ products: Product[]; total: number }> {
  return requestWithFallback("/products", undefined, () => {
    const state = loadMockState();
    return { products: state.products, total: state.products.length };
  });
}

export async function getProduct(id: string): Promise<Product> {
  return requestWithFallback(`/products/${encodeURIComponent(id)}`, undefined, () => {
    const state = loadMockState();
    const product = state.products.find((p) => p.productId === id);
    if (!product) throw new Error("Product not found");
    return product;
  });
}

export async function decodeQR(
  qrData: string,
): Promise<{ payload: Record<string, unknown>; product?: Product; found: boolean }> {
  return requestWithFallback(
    "/products/decode-qr",
    {
      method: "POST",
      body: JSON.stringify({ qrData }),
    },
    () => {
      const state = loadMockState();
      const direct = state.products.find(
        (p) => p.productId === qrData || p.qrCode === qrData || qrData.includes(p.productId),
      );

      if (direct) {
        return {
          payload: {
            productId: direct.productId,
            name: direct.name,
            material: direct.material,
            weightGrams: direct.weightGrams,
          },
          product: direct,
          found: true,
        };
      }

      try {
        const parsed = JSON.parse(qrData) as Record<string, unknown>;
        const byPayload = state.products.find((p) => p.productId === parsed.productId);
        return { payload: parsed, product: byPayload, found: !!byPayload };
      } catch {
        return { payload: { raw: qrData }, found: false };
      }
    },
  );
}

export async function depositWaste(data: DepositWastePayload): Promise<WasteDeposit> {
  return requestWithFallback(
    "/waste/deposit",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    () => {
      const state = loadMockState();
      const deposit: WasteDeposit = {
        id: state.nextDepositId,
        productId: data.productId ?? `manual-${state.nextDepositId}`,
        hasQr: data.hasQr,
        depositorAddr: data.depositorAddr,
        collectorAddr: data.collectorAddr,
        wasteType: data.wasteType,
        wasteTypeName: WASTE_TYPE_LABELS[data.wasteType],
        weightGrams: data.weightGrams,
        tokensEarned: rewardFor(data.weightGrams, data.wasteType),
        status: 0,
        statusName: "pending",
        txHash: randomHash(),
        timestamp: toIso(),
      };
      state.nextDepositId += 1;
      state.deposits = [deposit, ...state.deposits];
      saveMockState(state);
      return deposit;
    },
  );
}

export async function confirmRecycling(depositId: number, collectorAddr?: string): Promise<WasteDeposit> {
  return requestWithFallback(
    "/waste/confirm-recycling",
    {
      method: "POST",
      body: JSON.stringify({ depositId, collectorAddr }),
    },
    () => {
      const state = loadMockState();
      const index = state.deposits.findIndex((d) => d.id === depositId);
      if (index < 0) throw new Error("Deposit not found");
      const updated: WasteDeposit = {
        ...state.deposits[index],
        status: 1,
        statusName: "recycled",
        recycledAt: toIso(),
        txHash: randomHash(),
      };
      state.deposits[index] = updated;
      saveMockState(state);
      return updated;
    },
  );
}

export async function getDepositorHistory(
  address: string,
): Promise<{ deposits: WasteDeposit[]; total: number; totalTokens: number }> {
  return requestWithFallback(`/waste/depositor/${encodeURIComponent(address)}`, undefined, () => {
    const state = loadMockState();
    const normalized = address.toLowerCase();
    const deposits = state.deposits.filter((d) => d.depositorAddr.toLowerCase() === normalized);
    const totalTokens = deposits.reduce((sum, d) => sum + d.tokensEarned, 0);
    return { deposits, total: deposits.length, totalTokens };
  });
}

export async function getPendingDeposits(): Promise<{ deposits: WasteDeposit[]; total: number }> {
  return requestWithFallback("/waste/pending", undefined, () => {
    const state = loadMockState();
    const deposits = state.deposits.filter((d) => d.status === 0);
    return { deposits, total: deposits.length };
  });
}

export async function getAllDeposits(): Promise<{ deposits: WasteDeposit[]; total: number }> {
  return requestWithFallback("/waste/all", undefined, () => {
    const state = loadMockState();
    return { deposits: state.deposits, total: state.deposits.length };
  });
}

export async function getDeposit(id: number): Promise<WasteDeposit> {
  return requestWithFallback(`/waste/${id}`, undefined, () => {
    const state = loadMockState();
    const deposit = state.deposits.find((d) => d.id === id);
    if (!deposit) throw new Error("Deposit not found");
    return deposit;
  });
}

export async function getKshAmount(address: string): Promise<number> {
  return requestWithFallback<{ kshValue: number }>(
    `/amount/${encodeURIComponent(address)}/kshs`,
    undefined,
    () => {
    const state = loadMockState();
    const normalized = address.toLowerCase();
    const tokens = state.deposits
      .filter((d) => d.depositorAddr.toLowerCase() === normalized)
      .reduce((sum, d) => sum + d.tokensEarned, 0);
    return { kshValue: Number((tokens * ECO_TO_KSH_RATE).toFixed(2)) };
    },
  ).then((data) => data.kshValue ?? 0);
}
