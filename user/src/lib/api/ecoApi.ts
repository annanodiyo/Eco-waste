// ─── API client for the Go backend at :8080 ────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8080/api/v1";

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

// ── Types (mirroring server/internal/models) ────────────────────────────

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
    qrCode: string; // base64 PNG
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
    status: number; // 0=pending, 1=recycled, 2=rejected
    statusName: string;
    txHash: string;
    timestamp: string;
    recycledAt?: string;
}

// ── Products ────────────────────────────────────────────────────────────

export interface RegisterProductPayload {
    name: string;
    manufacturer: string;
    material: WasteType;
    weightGrams: number;
    walletAddr?: string;
}

export async function registerProduct(data: RegisterProductPayload): Promise<Product> {
    return request<Product>("/products/register", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function listProducts(): Promise<{ products: Product[]; total: number }> {
    return request("/products");
}

export async function getProduct(id: string): Promise<Product> {
    return request(`/products/${encodeURIComponent(id)}`);
}

export async function decodeQR(
    qrData: string,
): Promise<{ payload: Record<string, unknown>; product?: Product; found: boolean }> {
    return request("/products/decode-qr", {
        method: "POST",
        body: JSON.stringify({ qrData }),
    });
}

// ── Waste deposits ──────────────────────────────────────────────────────

export interface DepositWastePayload {
    productId?: string;
    hasQr: boolean;
    depositorAddr: string;
    collectorAddr: string;
    wasteType: WasteType;
    weightGrams: number;
}

export async function depositWaste(data: DepositWastePayload): Promise<WasteDeposit> {
    return request<WasteDeposit>("/waste/deposit", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function confirmRecycling(
    depositId: number,
    collectorAddr?: string,
): Promise<WasteDeposit> {
    return request<WasteDeposit>("/waste/confirm-recycling", {
        method: "POST",
        body: JSON.stringify({ depositId, collectorAddr }),
    });
}

export async function getDepositorHistory(
    address: string,
): Promise<{ deposits: WasteDeposit[]; total: number; totalTokens: number }> {
    return request(`/waste/depositor/${encodeURIComponent(address)}`);
}

export async function getPendingDeposits(): Promise<{ deposits: WasteDeposit[]; total: number }> {
    return request("/waste/pending");
}

export async function getAllDeposits(): Promise<{ deposits: WasteDeposit[]; total: number }> {
    return request("/waste/all");
}

export async function getDeposit(id: number): Promise<WasteDeposit> {
    return request(`/waste/${id}`);
}
