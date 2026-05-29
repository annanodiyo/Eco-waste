import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Download, Loader2, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ChainBadge } from "@/components/ChainBadge";

import { useWallet, shortAddr } from "@/lib/wallet";
import { TxHash } from "@/components/TxHash";
import { listProducts, registerProduct, type WasteType } from "@/lib/api/ecoApi";

export const Route = createFileRoute("/manufacturer")({
  head: () => ({ meta: [{ title: "Manufacturer · EcoToken" }] }),
  component: Manufacturer,
});

const MATERIAL_OPTIONS: { label: string; value: number }[] = [
  { label: "PET Plastic",       value: 0 },
  { label: "Glass",             value: 1 },
  { label: "Metal / Aluminium", value: 2 },
  { label: "Paper / Cardboard", value: 3 },
  { label: "Organic",           value: 4 },
  { label: "Electronic",        value: 5 },
  { label: "Other",             value: 6 },
];

const WASTE_TYPE_LABELS: Record<number, string> = {
  0: "PET Plastic",
  1: "Glass",
  2: "Metal / Aluminium",
  3: "Paper / Cardboard",
  4: "Organic",
  5: "Electronic",
  6: "Other",
};

const RATES: Record<number, number> = {
  0: 0.10, 1: 0.05, 2: 0.15, 3: 0.08, 4: 0.03, 5: 0.20, 6: 0.02,
};


interface Product {
  productId:    string;
  name:         string;
  material:     number;
  materialName: string;
  weightGrams:  number;
  manufacturer: string;
  walletAddr:   string;
  registeredAt: string;
  txHash:       string;
  qrCode:       string;
}

function Manufacturer() {
  const { address, connect } = useWallet();

  const [form, setForm] = useState({
    name:         "Spring Water 500ml",
    material:     0,
    weightGrams:  24,
    manufacturer: "Polymer Co.",
    walletAddr:   "",
    notes:        "Bottled at Rotterdam plant. 30% rPET.",
  });

  const [registeredProduct, setRegisteredProduct] = useState<Product | null>(null);
  const [batches, setBatches]               = useState<Product[]>([]);
  const [status, setStatus]                 = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg]             = useState("");
  const [batchesLoading, setBatchesLoading] = useState(false);

  const fetchBatches = useCallback(async () => {
    setBatchesLoading(true);
    try {
      const data = await listProducts();
      setBatches(data.products ?? []);
    } catch (e) {
      console.error("Failed to fetch products:", e);
    } finally {
      setBatchesLoading(false);
    }
  }, []);

  useEffect(() => { fetchBatches(); }, [fetchBatches]);

  const generate = async () => {
    setStatus("loading");
    setErrorMsg("");
    setRegisteredProduct(null);
    try {
      const product = await registerProduct({
        name:         form.name,
        manufacturer: form.manufacturer,
        material:     form.material as WasteType,
        weightGrams:  form.weightGrams,
        walletAddr:   form.walletAddr || undefined,
      });
      setRegisteredProduct(product);
      setStatus("success");
      fetchBatches();
    } catch (e: any) {
      setErrorMsg(e.message ?? "Unknown error");
      setStatus("error");
    }
  };

  const downloadQR = () => {
    if (!registeredProduct) return;
    const a    = document.createElement("a");
    const prefix = registeredProduct.qrCode.startsWith("data:") ? "" : "data:image/png;base64,";
    a.href     = `${prefix}${registeredProduct.qrCode}`;
    a.download = `ecotoken-${form.name.replace(/\s+/g, "-")}.png`;
    a.click();
  };

  const reward = (form.weightGrams * (RATES[form.material] ?? 0.02)).toFixed(1);

  return (
    <AppShell>
      <main className="px-4 max-w-screen-xl mx-auto py-8 space-y-8">
        <header className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-brand-primary">
              {form.manufacturer} · {address ? shortAddr(address) : "Wallet not connected"}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight mt-1">Supply Chain Admin</h1>
          </div>
          {!address && (
            <button
              onClick={connect}
              className="px-4 py-2 ring-1 ring-black/10 rounded-full text-xs font-mono hover:bg-zinc-50"
            >
              Connect wallet
            </button>
          )}
        </header>

        <section className="grid md:grid-cols-2 gap-4">
          <div className="bg-card ring-1 ring-black/5 rounded-[16px] p-6 space-y-4">
            <h2 className="text-xs font-mono uppercase tracking-widest text-ui-muted">
              Register product batch
            </h2>

            <Field label="Product name" value={form.name}
              onChange={(v) => setForm({ ...form, name: v })} />

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[10px] font-mono uppercase tracking-widest text-ui-muted">
                  Material
                </span>
                <select
                  value={form.material}
                  onChange={(e) => setForm({ ...form, material: Number(e.target.value) })}
                  className="mt-1 w-full bg-background ring-1 ring-black/10 rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:ring-brand-primary"
                >
                  {MATERIAL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </label>

              <Field label="Weight per unit (g)" value={String(form.weightGrams)} type="number"
                onChange={(v) => setForm({ ...form, weightGrams: Number(v) || 0 })} />
            </div>

            <Field label="Manufacturer" value={form.manufacturer}
              onChange={(v) => setForm({ ...form, manufacturer: v })} />

            <Field label="Wallet address (optional)" value={form.walletAddr}
              onChange={(v) => setForm({ ...form, walletAddr: v })} />

            <Field label="Packaging notes" value={form.notes} textarea
              onChange={(v) => setForm({ ...form, notes: v })} />

            {status === "error" && (
              <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 ring-1 ring-red-200 rounded-[8px] px-3 py-2">
                <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-ui-muted">
                Material:{" "}
                <span className="font-mono font-semibold">{WASTE_TYPE_LABELS[form.material]}</span>
                {" · "}
                <span className="font-mono text-brand-secondary font-semibold">+{reward} $ECO</span>
              </p>
              <button
                onClick={generate}
                disabled={status === "loading"}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-neutral-50 rounded-full text-sm font-medium active:scale-95 transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === "loading" && <Loader2 className="size-3.5 animate-spin" />}
                {status === "loading" ? "Registering…" : "Generate QR"}
              </button>
            </div>
          </div>

          <div className="bg-card ring-1 ring-black/5 rounded-[16px] p-6 grid place-items-center text-center">
            {registeredProduct ? (
              <div className="space-y-4">
                <img
                  src={registeredProduct.qrCode.startsWith("data:") ? registeredProduct.qrCode : `data:image/png;base64,${registeredProduct.qrCode}`}
                  alt="Product QR code"
                  className="w-48 h-48 rounded-lg mx-auto"
                />
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 ring-1 ring-emerald-200 rounded-full px-2.5 py-1">
                    <CheckCircle2 className="size-3" /> Registered on-chain
                  </div>
                  <p className="text-[10px] font-mono text-ui-muted mt-1">
                    ID: {registeredProduct.productId}
                  </p>
                  <p className="text-[10px] font-mono text-ui-muted">
                    tx: {registeredProduct.txHash}
                  </p>
                </div>
                <button
                  onClick={downloadQR}
                  className="inline-flex items-center gap-2 px-4 py-2 ring-1 ring-black/10 rounded-full text-xs hover:bg-zinc-50"
                >
                  <Download className="size-3.5" /> Download PNG
                </button>
              </div>
            ) : (
              <div className="text-ui-muted">
                <div className="size-32 mx-auto border-2 border-dashed border-zinc-300 rounded-lg grid place-items-center mb-3">
                  <span className="text-[10px] font-mono uppercase tracking-widest">QR</span>
                </div>
                <p className="text-xs">Register a product to generate QR</p>
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-mono uppercase tracking-widest text-ui-muted">
              Registered batches
            </h2>
            <button
              onClick={fetchBatches}
              disabled={batchesLoading}
              className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-ui-muted hover:text-zinc-700 disabled:opacity-50"
            >
              <RefreshCw className={`size-3 ${batchesLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
          <div className="bg-card ring-1 ring-black/5 rounded-[12px] overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  {["Product ID", "Name", "Material", "Weight (g)", "Manufacturer", "Tx", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-mono text-[10px] text-ui-muted uppercase tracking-wider font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {batchesLoading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-xs text-ui-muted">
                      <Loader2 className="size-4 animate-spin mx-auto" />
                    </td>
                  </tr>
                )}
                {!batchesLoading && batches.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-xs text-ui-muted">
                      No products registered yet — generate your first QR above.
                    </td>
                  </tr>
                )}
                {!batchesLoading && batches.map((b) => (
                  <tr key={b.productId} className="hover:bg-zinc-50/50">
                    <td className="px-4 py-4 font-mono text-xs text-ui-muted">{b.productId.slice(0, 8)}…</td>
                    <td className="px-4 py-4 font-medium">{b.name}</td>
                    <td className="px-4 py-4 capitalize">{b.materialName}</td>
                    <td className="px-4 py-4 font-mono">{b.weightGrams}g</td>
                    <td className="px-4 py-4 text-xs">{b.manufacturer}</td>
                    <td className="px-4 py-4"><TxHash hash={b.txHash} /></td>
                    <td className="px-4 py-4">
                      <ChainBadge status={b.txHash.startsWith("mock") ? "signed" : "verified"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { v: `${batches.length}`,  l: "Products registered" },
            { v: "100%",               l: "Traceability coverage" },
            { v: `${batches.reduce((acc, b) => acc + Math.round((b.weightGrams / 1000) * (RATES[b.material] ?? 0.02) * 43.4), 0)}`, l: "$ECO tokens issued" },
            { v: "A+",                 l: "Sustainability rating" },
          ].map((s) => (
            <div key={s.l} className="bg-card ring-1 ring-black/5 rounded-[12px] p-4">
              <p className="text-3xl font-semibold tracking-tight">{s.v}</p>
              <p className="text-[10px] font-mono uppercase tracking-widest text-ui-muted mt-1">{s.l}</p>
            </div>
          ))}
        </section>
      </main>
    </AppShell>
  );
}

function Field({
  label, value, onChange, type = "text", textarea = false,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; textarea?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-mono uppercase tracking-widest text-ui-muted">{label}</span>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2}
          className="mt-1 w-full bg-background ring-1 ring-black/10 rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:ring-brand-primary" />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full bg-background ring-1 ring-black/10 rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:ring-brand-primary" />
      )}
    </label>
  );
}