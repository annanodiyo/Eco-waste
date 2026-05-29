import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Coins, Loader2, AlertCircle, QrCode, Scan, History, Trash2, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useWallet, shortAddr } from "@/lib/wallet";
import { useState } from "react";
import {
  depositWaste,
  decodeQR,
  type WasteType,
  type Product,
  WASTE_TYPE_LABELS,
  WASTE_REWARD_RATES,
} from "@/lib/api/ecoApi";
import { QRScanner } from "@/components/QRScanner";
import { toast } from "sonner";
import {
  CollectorKpis,
  CollectorPendingDepositsTable,
  useCollectorDeposits,
} from "@/components/collector/CollectorShared";

export const Route = createFileRoute("/collector")({
  component: LegacyCollectorRoute,
});

function LegacyCollectorRoute() {
  return <Navigate to="/dashboard" />;
}

export function CollectorDashboard() {
  const { address, connect } = useWallet();
  const { pendingDeposits, loadingDeposits, loadPending } = useCollectorDeposits();

  const [manualForm, setManualForm] = useState({
    depositorAddr: "",
    wasteType: 0 as WasteType,
    weightGrams: 500,
  });
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);

  const handleManualDeposit = async () => {
    if (!address) {
      await connect();
      return;
    }
    setManualSubmitting(true);
    setManualError(null);
    try {
      const result = await depositWaste({
        hasQr: !!scannedProduct,
        productId: scannedProduct?.productId,
        depositorAddr: manualForm.depositorAddr,
        collectorAddr: address,
        wasteType: manualForm.wasteType,
        weightGrams: manualForm.weightGrams,
      });
      toast.success(`Deposit recorded! ${result.tokensEarned} ECO awarded.`);
      loadPending();
      setScannedProduct(null);
    } catch (err: unknown) {
      setManualError(err instanceof Error ? err.message : "Deposit failed");
      toast.error(err instanceof Error ? err.message : "Deposit failed");
    } finally {
      setManualSubmitting(false);
    }
  };

  const handleScan = async (qrData: string) => {
    try {
      const result = await decodeQR(qrData);
      if (result.found && result.product) {
        setScannedProduct(result.product);
        setManualForm((current) => ({
          ...current,
          wasteType: result.product.material as WasteType,
          weightGrams: result.product.weightGrams,
        }));
        toast.success(`Product identified: ${result.product.name}`);
      } else if (result.payload) {
        const p = result.payload as {
          productId?: string;
          name?: string;
          material?: number;
          weightGrams?: number;
        };
        setScannedProduct({
          productId: p.productId || "unknown",
          name: p.name || "Unknown Product",
          material: p.material ?? 0,
          weightGrams: p.weightGrams ?? 0,
          materialName: WASTE_TYPE_LABELS[(p.material ?? 0) as WasteType],
        } as Product);
        setManualForm((current) => ({
          ...current,
          wasteType: (p.material ?? 0) as WasteType,
          weightGrams: p.weightGrams ?? 0,
        }));
        toast.info("Scanned offline-registered product");
      }
    } catch (error) {
      console.error("QR Decode error", error);
      toast.error("Invalid QR code format");
    }
  };

  const totalToday = pendingDeposits.reduce((acc, d) => acc + d.weightGrams, 0);
  const totalTokens = pendingDeposits.reduce((acc, d) => acc + d.tokensEarned, 0);

  const estimatedReward = (
    manualForm.weightGrams * (WASTE_REWARD_RATES[manualForm.wasteType] ?? 0.02)
  ).toFixed(1);

  return (
    <AppShell>
      <main className="px-4 max-w-screen-xl mx-auto py-8 space-y-8">
        <header className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-brand-primary">
              Collection Point · {address ? shortAddr(address) : "Not Connected"}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight mt-1">Operator Dashboard</h1>
          </div>
          <CollectorKpis pendingDeposits={pendingDeposits} />
        </header>

        <div className="grid lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 bg-card ring-1 ring-black/5 rounded-[24px] p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Record Deposit</h2>
                <p className="text-xs text-ui-muted font-mono uppercase tracking-wider">Scan QR or enter manually</p>
              </div>
              <button
                onClick={() => setIsScannerOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-full text-sm font-medium hover:bg-brand-primary/90 transition-colors shadow-lg shadow-brand-primary/20"
              >
                <Scan className="size-4" />
                Scan Product QR
              </button>
            </div>

            {scannedProduct && (
              <div className="bg-brand-primary/5 ring-1 ring-brand-primary/20 rounded-2xl p-4 flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
                <div className="size-12 bg-white rounded-xl flex items-center justify-center ring-1 ring-black/5 shrink-0">
                  <QrCode className="size-6 text-brand-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-mono text-brand-primary uppercase tracking-widest font-bold">Product Identified</p>
                    <button
                      onClick={() => setScannedProduct(null)}
                      className="text-ui-muted hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                  <h3 className="font-semibold text-zinc-900 truncate">{scannedProduct.name}</h3>
                  <p className="text-xs text-ui-muted">ID: {scannedProduct.productId.slice(0, 16)}...</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono text-ui-muted uppercase">Fixed Weight</p>
                  <p className="font-semibold text-brand-secondary">{scannedProduct.weightGrams}g</p>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="block">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-ui-muted ml-1">
                    Consumer wallet address
                  </span>
                  <input
                    type="text"
                    placeholder="0x…"
                    value={manualForm.depositorAddr}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, depositorAddr: e.target.value.toLowerCase() })
                    }
                    className="mt-1.5 w-full bg-zinc-50/50 ring-1 ring-black/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:bg-white transition-all font-mono"
                  />
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-ui-muted ml-1">
                      Material
                    </span>
                    <select
                      disabled={!!scannedProduct}
                      value={manualForm.wasteType}
                      onChange={(e) =>
                        setManualForm({ ...manualForm, wasteType: Number(e.target.value) as WasteType })
                      }
                      className="mt-1.5 w-full bg-zinc-50/50 ring-1 ring-black/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:bg-white transition-all disabled:opacity-50"
                    >
                      {Object.entries(WASTE_TYPE_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-ui-muted ml-1">
                      Weight (grams)
                    </span>
                    <input
                      disabled={!!scannedProduct}
                      type="number"
                      value={manualForm.weightGrams}
                      onChange={(e) =>
                        setManualForm({ ...manualForm, weightGrams: Number(e.target.value) || 0 })
                      }
                      className="mt-1.5 w-full bg-zinc-50/50 ring-1 ring-black/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:bg-white transition-all font-mono disabled:opacity-50"
                    />
                  </label>
                </div>
              </div>

              <div className="flex flex-col justify-end space-y-4">
                <div className="bg-zinc-50 rounded-2xl p-4 flex items-center justify-between ring-1 ring-black/5">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-ui-muted">Estimated Reward</p>
                    <p className="text-xl font-bold text-brand-secondary">
                      {estimatedReward} ECO
                    </p>
                  </div>
                  <div className="size-10 bg-white rounded-full flex items-center justify-center ring-1 ring-black/5 shadow-sm">
                    <Coins className="size-5 text-brand-primary" />
                  </div>
                </div>

                <button
                  onClick={handleManualDeposit}
                  disabled={manualSubmitting || !manualForm.depositorAddr}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-zinc-900 text-white rounded-2xl text-sm font-semibold hover:bg-black active:scale-[0.98] transition-all disabled:opacity-40 shadow-xl shadow-black/10"
                >
                  {manualSubmitting ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <ArrowRight className="size-5" />
                  )}
                  {!address ? "Connect Wallet" : manualSubmitting ? "Processing..." : "Confirm & Award Tokens"}
                </button>
              </div>
            </div>

            {manualError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 ring-1 ring-red-100">
                <AlertCircle className="size-4 flex-shrink-0" />
                {manualError}
              </div>
            )}
          </section>

          <section className="bg-zinc-900 rounded-[24px] p-8 text-white flex flex-col justify-between overflow-hidden relative">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <History className="size-4 text-brand-primary" />
                <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400">Shift Statistics</h2>
              </div>
              <div className="space-y-6 mt-6">
                <div>
                  <p className="text-3xl font-bold tracking-tight">{pendingDeposits.length}</p>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mt-1">Pending Deposits</p>
                </div>
                <div>
                  <p className="text-3xl font-bold tracking-tight">{(totalToday / 1000).toFixed(1)} kg</p>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mt-1">Weight Processed</p>
                </div>
                <div>
                  <p className="text-3xl font-bold tracking-tight text-brand-secondary">{totalTokens.toFixed(1)} ECO</p>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mt-1">Tokens Issued</p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-12 -right-12 size-48 bg-brand-primary/10 rounded-full blur-3xl" />
            <div className="absolute top-24 -left-12 size-32 bg-brand-secondary/5 rounded-full blur-3xl" />
          </section>
        </div>

        <CollectorPendingDepositsTable pendingDeposits={pendingDeposits} loadingDeposits={loadingDeposits} />
      </main>

      <QRScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScan}
      />
    </AppShell>
  );
}
