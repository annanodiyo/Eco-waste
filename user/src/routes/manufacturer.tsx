import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Download, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ChainBadge } from "@/components/ChainBadge";
import { TxHash } from "@/components/TxHash";
import { useWallet, shortAddr } from "@/lib/wallet";
import {
  registerProduct,
  listProducts,
  type Product,
  type WasteType,
  WASTE_TYPE_LABELS,
} from "@/lib/api/ecoApi";

export const Route = createFileRoute("/manufacturer")({
  head: () => ({ meta: [{ title: "Manufacturer · EcoToken" }] }),
  component: Manufacturer,
});

const MATERIAL_OPTIONS: { value: WasteType; label: string }[] = [
  { value: 0, label: "Plastic" },
  { value: 1, label: "Glass" },
  { value: 2, label: "Metal" },
  { value: 3, label: "Paper" },
  { value: 4, label: "Organic" },
  { value: 5, label: "Electronic" },
  { value: 6, label: "Other" },
];

function Manufacturer() {
  const { address, connect } = useWallet();
  const [form, setForm] = useState({
    name: "Spring Water 500ml",
    material: 0 as WasteType,
    weight: 24,
    manufacturer: "Polymer Co.",
  });
  const [submitting, setSubmitting] = useState(false);
  const [lastProduct, setLastProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const qrImgRef = useRef<HTMLImageElement>(null);

  // Load existing registered products
  useEffect(() => {
    setLoadingProducts(true);
    listProducts()
      .then((res) => setProducts(res.products ?? []))
      .catch(() => { })
      .finally(() => setLoadingProducts(false));
  }, []);

  const handleRegister = async () => {
    if (!address) {
      await connect();
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const product = await registerProduct({
        name: form.name,
        manufacturer: form.manufacturer,
        material: form.material,
        weightGrams: form.weight,
        walletAddr: address,
      });
      setLastProduct(product);
      // Refresh the product list
      const updated = await listProducts();
      setProducts(updated.products ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const downloadQR = () => {
    if (!lastProduct?.qrCode) return;
    const a = document.createElement("a");
    a.href = `data:image/png;base64,${lastProduct.qrCode}`;
    a.download = `ecotoken-${form.name.replace(/\s+/g, "-")}.png`;
    a.click();
  };

  return (
    <AppShell>
      <main className="px-4 max-w-screen-xl mx-auto py-8 space-y-8">
        <header>
          <p className="text-[10px] font-mono uppercase tracking-widest text-brand-primary">
            {form.manufacturer} · {address ? shortAddr(address) : "Wallet Not Connected"}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight mt-1">Supply Chain Admin</h1>
        </header>

        {/* Register batch */}
        <section className="grid md:grid-cols-2 gap-4">
          <div className="bg-card ring-1 ring-black/5 rounded-[16px] p-6 space-y-4">
            <h2 className="text-xs font-mono uppercase tracking-widest text-ui-muted">
              Register product batch
            </h2>
            <Field
              label="Product name"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
            />
            <Field
              label="Manufacturer"
              value={form.manufacturer}
              onChange={(v) => setForm({ ...form, manufacturer: v })}
            />
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[10px] font-mono uppercase tracking-widest text-ui-muted">
                  Material
                </span>
                <select
                  value={form.material}
                  onChange={(e) =>
                    setForm({ ...form, material: Number(e.target.value) as WasteType })
                  }
                  className="mt-1 w-full bg-background ring-1 ring-black/10 rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:ring-brand-primary"
                >
                  {MATERIAL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <Field
                label="Weight per unit (g)"
                value={String(form.weight)}
                onChange={(v) => setForm({ ...form, weight: Number(v) || 0 })}
                type="number"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                <AlertCircle className="size-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-ui-muted">
                Material:{" "}
                <span className="font-mono font-semibold">
                  {WASTE_TYPE_LABELS[form.material]}
                </span>
              </p>
              <button
                onClick={handleRegister}
                disabled={submitting}
                className="px-5 py-2.5 bg-brand-primary text-neutral-50 rounded-full text-sm font-medium active:scale-95 transition-transform disabled:opacity-60 flex items-center gap-2"
              >
                {submitting && <Loader2 className="size-4 animate-spin" />}
                {!address ? "Connect Wallet" : submitting ? "Registering…" : "Register & Generate QR"}
              </button>
            </div>
          </div>

          <div className="bg-card ring-1 ring-black/5 rounded-[16px] p-6 grid place-items-center text-center">
            {lastProduct?.qrCode ? (
              <div className="space-y-4">
                <img
                  ref={qrImgRef}
                  src={`data:image/png;base64,${lastProduct.qrCode}`}
                  alt="Product QR Code"
                  className="rounded-lg mx-auto"
                  width={200}
                  height={200}
                />
                <div className="space-y-1">
                  <p className="text-xs font-mono text-ui-muted">
                    Product ID: {lastProduct.productId}
                  </p>
                  <TxHash hash={lastProduct.txHash} />
                  <div className="flex items-center justify-center gap-1.5 text-emerald-600 text-xs">
                    <CheckCircle2 className="size-3.5" />
                    Registered on-chain
                  </div>
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

        {/* Registered products table */}
        <section>
          <h2 className="text-xs font-mono uppercase tracking-widest text-ui-muted mb-4">
            Registered products
          </h2>
          <div className="bg-card ring-1 ring-black/5 rounded-[12px] overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  {["ID", "Product", "Material", "Weight", "Tx Hash", "Status"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left font-mono text-[10px] text-ui-muted uppercase tracking-wider font-medium"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loadingProducts ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-ui-muted text-sm">
                      <Loader2 className="size-4 animate-spin inline mr-2" />
                      Loading from backend…
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-ui-muted text-sm">
                      No products registered yet. Register your first batch above.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.productId}>
                      <td className="px-4 py-4 font-mono text-xs">{p.productId.slice(0, 8)}…</td>
                      <td className="px-4 py-4 font-medium">{p.name}</td>
                      <td className="px-4 py-4">{p.materialName}</td>
                      <td className="px-4 py-4 font-mono">{p.weightGrams}g</td>
                      <td className="px-4 py-4">
                        <TxHash hash={p.txHash} />
                      </td>
                      <td className="px-4 py-4">
                        <ChainBadge status={p.txHash.startsWith("mock") ? "signed" : "verified"} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-mono uppercase tracking-widest text-ui-muted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-background ring-1 ring-black/10 rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:ring-brand-primary"
      />
    </label>
  );
}
