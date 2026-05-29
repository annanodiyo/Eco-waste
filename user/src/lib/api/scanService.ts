import { PRODUCTS, type Product } from "@/lib/mockData";

export type ParsedQrText =
  | { ok: true; rawText: string; productId?: string }
  | { ok: false; rawText: string; reason: string };

export type ScanResolution =
  | { status: "success"; product: Product; source: "backend"; rawText: string }
  | {
      status: "backend-fallback";
      product: Product;
      source: "mock";
      rawText: string;
    }
  | { status: "invalid-code"; reason: string; rawText: string };

type BackendScanResponse = unknown;

const DEFAULT_TIMEOUT_MS = 8000;

class BackendUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BackendUnavailableError";
  }
}

export function parseQrText(raw: string): ParsedQrText {
  const rawText = raw.trim();
  if (!rawText) return { ok: false, rawText, reason: "Empty QR code" };

  // JSON payloads: {"productId":"XC-992-B"} / {"itemId":"..."} / {"id":"..."}
  try {
    const json = JSON.parse(rawText) as Record<string, unknown>;
    const fromJson = firstString(json, ["productId", "itemId", "id"]);
    if (fromJson) return { ok: true, rawText, productId: fromJson };
  } catch {
    // ignore
  }

  // URLs: .../journey/<id> or ?itemId=<id> / ?productId=<id>
  try {
    const url = new URL(rawText);
    const qp = url.searchParams;
    const fromQuery =
      qp.get("productId") ?? qp.get("itemId") ?? qp.get("id") ?? undefined;
    if (fromQuery) return { ok: true, rawText, productId: fromQuery };
    const journeyMatch = url.pathname.match(/\/journey\/([^/]+)\/?$/);
    if (journeyMatch?.[1])
      return { ok: true, rawText, productId: journeyMatch[1] };
  } catch {
    // ignore
  }

  // Fallback: treat as an ID-like token and let resolution decide if it exists.
  const idLike = rawText.replace(/^ID[:\s]+/i, "").trim();
  if (!idLike) return { ok: false, rawText, reason: "Unrecognized QR format" };
  return { ok: true, rawText, productId: idLike };
}

export async function resolveScan(
  rawText: string,
  opts?: { timeoutMs?: number; signal?: AbortSignal },
): Promise<ScanResolution> {
  const parsed = parseQrText(rawText);
  if (!parsed.ok)
    return {
      status: "invalid-code",
      reason: parsed.reason,
      rawText: parsed.rawText,
    };

  try {
    const data = await submitScanToBackend(
      { rawText: parsed.rawText, productId: parsed.productId },
      { timeoutMs: opts?.timeoutMs, signal: opts?.signal },
    );
    const product = normalizeBackendResponse(data, parsed.productId);
    if (!product) {
      return {
        status: "invalid-code",
        reason: "Backend did not return a resolvable item",
        rawText: parsed.rawText,
      };
    }
    return {
      status: "success",
      product,
      source: "backend",
      rawText: parsed.rawText,
    };
  } catch (err) {
    if (!shouldFallbackToMock(err)) {
      let reason = "Invalid or unknown QR code";
      if (err instanceof Error) {
        // Try to parse the error message if it looks like JSON from our Gin backend
        try {
          const parsed = JSON.parse(err.message);
          if (parsed.error) reason = parsed.error;
        } catch {
          reason = err.message;
        }
      }

      return {
        status: "invalid-code",
        reason,
        rawText: parsed.rawText,
      };
    }


    const product = parsed.productId
      ? (PRODUCTS.find((p) => p.id === parsed.productId) ?? null)
      : null;

    if (!product) {
      return {
        status: "invalid-code",
        reason: "QR code not recognized",
        rawText: parsed.rawText,
      };
    }

    return {
      status: "backend-fallback",
      product,
      source: "mock",
      rawText: parsed.rawText,
    };
  }
}

async function submitScanToBackend(
  payload: { rawText: string; productId?: string },
  opts?: { timeoutMs?: number; signal?: AbortSignal },
): Promise<BackendScanResponse> {
  const url = (import.meta.env.VITE_SCAN_API_URL as string | undefined) ?? "";
  if (!url)
    throw new BackendUnavailableError("VITE_SCAN_API_URL is not configured");

  const controller = new AbortController();
  const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  opts?.signal?.addEventListener("abort", onAbort, { once: true });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) {
      const message = await safeReadText(res);
      const httpError = new Error(message || `HTTP ${res.status}`);
      (httpError as { status?: number }).status = res.status;
      throw httpError;
    }

    try {
      return (await res.json()) as BackendScanResponse;
    } catch (parseErr) {
      const badJson = new Error("Backend returned invalid JSON");
      (badJson as { status?: number; cause?: unknown }).status = 500;
      (badJson as { status?: number; cause?: unknown }).cause = parseErr;
      throw badJson;
    }
  } finally {
    clearTimeout(timer);
    opts?.signal?.removeEventListener("abort", onAbort);
  }
}

function shouldFallbackToMock(err: unknown) {
  if (err instanceof BackendUnavailableError) return true;
  if (!err || typeof err !== "object") return false;

  // AbortError / TypeError("Failed to fetch") => connectivity/timeout
  const name = (err as { name?: string }).name;
  if (name === "AbortError") return true;

  // Network errors in browsers often surface as TypeError.
  if (err instanceof TypeError) return true;

  // HTTP status >= 500 => server failure/unavailable
  const status = (err as { status?: number }).status;
  if (typeof status === "number" && status >= 500) return true;

  return false;
}

function normalizeBackendResponse(
  data: BackendScanResponse,
  parsedId?: string,
): Product | null {
  const maybeProduct = pickFirstObject(data, ["product", "item"]) ?? data;
  const productId =
    firstString(maybeProduct as Record<string, unknown>, [
      "id",
      "productId",
      "itemId",
    ]) ?? parsedId;
  if (!productId) return null;

  const fromMock = PRODUCTS.find((p) => p.id === productId);
  
  const weightGrams = firstNumber(maybeProduct as Record<string, unknown>, ["weightGrams"]);
  const weightKg =
    firstNumber(maybeProduct as Record<string, unknown>, [
      "weightKg",
      "weight",
    ]) ??
    (weightGrams ? weightGrams / 1000 : undefined) ??
    fromMock?.weightKg ??
    0;

  const rawMaterial =
    firstString(maybeProduct as Record<string, unknown>, ["material", "materialName"]) ??
    firstNumber(maybeProduct as Record<string, unknown>, ["material"]) ??
    fromMock?.material ??
    "Unknown";

  // Map backend material to frontend standard
  let material = "Unknown";
  if (typeof rawMaterial === "number") {
    const mapping: Record<number, string> = {
      0: "PET",
      1: "Glass",
      2: "Aluminum",
      3: "Paper",
      4: "Organic",
      5: "Electronic",
      6: "Other"
    };
    material = mapping[rawMaterial] ?? "Unknown";
  } else {
    material = rawMaterial;
  }

  // Calculate token reward if missing from backend
  const weightGramsVal = weightGrams ?? weightKg * 1000;
  const RATES_BY_MATERIAL: Record<string, number> = {
    PET: 0.10,
    HDPE: 0.10,
    Aluminum: 0.15,
    Glass: 0.05,
    Paper: 0.08,
    Cardboard: 0.08,
    Organic: 0.03,
    Electronic: 0.20,
    Other: 0.02,
  };
  const rate = RATES_BY_MATERIAL[material] ?? 0.02;
  const tokenReward =
    firstNumber(maybeProduct as Record<string, unknown>, [
      "tokenReward",
      "reward",
    ]) ??
    fromMock?.tokenReward ??
    Number((weightGramsVal * rate).toFixed(1));

  const mapped: Partial<Product> = {
    id: productId,
    name:
      firstString(maybeProduct as Record<string, unknown>, ["name"]) ??
      fromMock?.name ??
      "Unknown item",
    material,
    weightKg,
    tokenReward,
    manufacturer:
      firstString(maybeProduct as Record<string, unknown>, ["manufacturer"]) ??
      fromMock?.manufacturer ??
      "Unknown",
    batchId:
      firstString(maybeProduct as Record<string, unknown>, ["batchId"]) ??
      fromMock?.batchId ??
      "—",
    events:
      (isRecord(maybeProduct) && Array.isArray(maybeProduct.events)
        ? (maybeProduct.events as Product["events"])
        : fromMock?.events) ?? [],
  };

  return mapped as Product;
}

function firstString(obj: Record<string, unknown>, keys: string[]) {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function firstNumber(obj: Record<string, unknown>, keys: string[]) {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim()) {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return undefined;
}

function pickFirstObject(data: unknown, keys: string[]) {
  if (!isRecord(data)) return null;
  for (const k of keys) {
    const v = data[k];
    if (isRecord(v)) return v;
  }
  return null;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

async function safeReadText(res: Response) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}
