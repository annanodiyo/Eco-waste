import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ChainBadge } from "@/components/ChainBadge";
import { MANUFACTURER_BATCHES, MATERIAL_FACTORS } from "@/lib/mockData";

export const Route = createFileRoute("/manufacturer")({
  head: () => ({ meta: [{ title: "Manufacturer · EcoToken" }] }),
  component: Manufacturer,
});

function Manufacturer() {
  const [form, setForm] = useState({
    name: "Spring Water 500ml",
    material: "PET",
    weight: 24,
    notes: "Bottled at Rotterdam plant. 30% rPET.",
  });
  const [qrData, setQrData] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generate = () => {
    const id = `MFG-${Math.floor(Math.random() * 9000 + 1000)}`;
    const payload = JSON.stringify({
      id,
      product: form.name,
      material: form.material,
      weightG: form.weight,
      mfg: "Polymer Co.",
      ts: Date.now(),
    });
    setQrData(payload);
  };

  useEffect(() => {
    if (qrData && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, qrData, {
        width: 200,
        margin: 1,
        color: { dark: "#18181b", light: "#fafafa" },
      });
    }
  }, [qrData]);

  const downloadQR = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `ecotoken-${form.name.replace(/\s+/g, "-")}.png`;
    a.click();
  };

  const factor = MATERIAL_FACTORS[form.material] ?? 5;
  const reward = +((form.weight / 1000) * factor * 43.4).toFixed(2);

  return (
    <AppShell>
      <main className="px-4 max-w-screen-xl mx-auto py-8 space-y-8">
        <header>
          <p className="text-[10px] font-mono uppercase tracking-widest text-brand-primary">
            Polymer Co. · Rotterdam Plant
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
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Material"
                value={form.material}
                onChange={(v) => setForm({ ...form, material: v })}
                options={Object.keys(MATERIAL_FACTORS)}
              />
              <Field
                label="Weight per unit (g)"
                value={String(form.weight)}
                onChange={(v) => setForm({ ...form, weight: Number(v) || 0 })}
                type="number"
              />
            </div>
            <Field
              label="Packaging notes"
              value={form.notes}
              onChange={(v) => setForm({ ...form, notes: v })}
              textarea
            />
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-ui-muted">
                Est. consumer reward:{" "}
                <span className="font-mono text-brand-secondary font-semibold">
                  +{reward} $ECO
                </span>
              </p>
              <button
                onClick={generate}
                className="px-5 py-2.5 bg-brand-primary text-neutral-50 rounded-full text-sm font-medium active:scale-95 transition-transform"
              >
                Generate QR
              </button>
            </div>
          </div>

          <div className="bg-card ring-1 ring-black/5 rounded-[16px] p-6 grid place-items-center text-center">
            {qrData ? (
              <div className="space-y-4">
                <canvas ref={canvasRef} className="rounded-lg" />
                <p className="text-xs font-mono text-ui-muted">
                  Linked to product ID · ready for packaging
                </p>
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
                <p className="text-xs">Generate to preview QR</p>
              </div>
            )}
          </div>
        </section>

        {/* Batch table */}
        <section>
          <h2 className="text-xs font-mono uppercase tracking-widest text-ui-muted mb-4">
            Registered batches
          </h2>
          <div className="bg-card ring-1 ring-black/5 rounded-[12px] overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  {["Batch", "Product", "Units", "Material", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-mono text-[10px] text-ui-muted uppercase tracking-wider font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {MANUFACTURER_BATCHES.map((b) => (
                  <tr key={b.id}>
                    <td className="px-4 py-4 font-mono text-xs">{b.id}</td>
                    <td className="px-4 py-4 font-medium">{b.product}</td>
                    <td className="px-4 py-4 font-mono">{b.units.toLocaleString()}</td>
                    <td className="px-4 py-4">{b.material}</td>
                    <td className="px-4 py-4">
                      <ChainBadge status="verified" />
                      <span className="ml-2 text-xs text-ui-muted">{b.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Compliance */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { v: "34%", l: "Recycled content" },
            { v: "100%", l: "Traceability coverage" },
            { v: "8.2k", l: "Tokens issued (mo)" },
            { v: "A+", l: "Sustainability rating" },
          ].map((s) => (
            <div key={s.l} className="bg-card ring-1 ring-black/5 rounded-[12px] p-4">
              <p className="text-3xl font-semibold tracking-tight">{s.v}</p>
              <p className="text-[10px] font-mono uppercase tracking-widest text-ui-muted mt-1">
                {s.l}
              </p>
            </div>
          ))}
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
  textarea = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  textarea?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-mono uppercase tracking-widest text-ui-muted">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className="mt-1 w-full bg-background ring-1 ring-black/10 rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:ring-brand-primary"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full bg-background ring-1 ring-black/10 rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:ring-brand-primary"
        />
      )}
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-mono uppercase tracking-widest text-ui-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-background ring-1 ring-black/10 rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:ring-brand-primary"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
