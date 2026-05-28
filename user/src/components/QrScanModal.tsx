import { useCallback, useEffect, useRef, useState } from "react";
import { X, ScanLine } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useWallet } from "@/lib/wallet";
import type { Product } from "@/lib/mockData";
import { resolveScan, type ScanResolution } from "@/lib/api/scanService";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";

type Phase =
  | "idle"
  | "requesting-permission"
  | "scanning"
  | "found"
  | "submitting"
  | "success"
  | "rewarded"
  | "invalid-code"
  | "backend-fallback"
  | "camera-error";

export function QrScanModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { addReward } = useWallet();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("idle");
  const [resolution, setResolution] = useState<ScanResolution | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanningHint, setScanningHint] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const inFlightRef = useRef(false);
  const lastTextRef = useRef<string | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openRef = useRef(open);

  const stopCamera = useCallback(() => {
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = null;

    try {
      controlsRef.current?.stop();
    } catch {
      // ignore
    }
    controlsRef.current = null;
    readerRef.current?.reset?.();
    readerRef.current = null;

    const v = videoRef.current;
    const stream = v?.srcObject as MediaStream | null;
    if (stream) {
      for (const t of stream.getTracks()) t.stop();
    }
    if (v) v.srcObject = null;
  }, []);

  const cameraErrorMessage = (err: unknown) => {
    const name =
      typeof err === "object" && err ? (err as { name?: string }).name : "";
    if (name === "NotAllowedError" || name === "SecurityError")
      return "Camera permission denied.";
    if (name === "NotFoundError" || name === "OverconstrainedError")
      return "No suitable camera found.";
    if (name === "NotReadableError")
      return "Camera is already in use by another app.";
    return "Unable to access the camera.";
  };

  const onDetected = useCallback(
    async (text: string) => {
      if (!openRef.current) return;
      if (inFlightRef.current) return;
      if (lastTextRef.current === text) return;

      inFlightRef.current = true;
      lastTextRef.current = text;
      setPhase("found");

      stopCamera();
      setPhase("submitting");

      let result: ScanResolution;
      try {
        result = await resolveScan(text);
      } catch {
        result = {
          status: "invalid-code",
          reason: "Failed to resolve scan",
          rawText: text,
        };
      }

      if (!openRef.current) return;
      setResolution(result);
      if (result.status === "success") setPhase("success");
      else if (result.status === "backend-fallback")
        setPhase("backend-fallback");
      else setPhase("invalid-code");
      inFlightRef.current = false;
    },
    [stopCamera],
  );

  const startCamera = useCallback(async () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    stopCamera();
    setScanningHint(false);
    setPhase("requesting-permission");

    hintTimerRef.current = setTimeout(() => setScanningHint(true), 6500);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Camera is not supported in this browser.");
        setPhase("camera-error");
        return;
      }

      const reader = new BrowserQRCodeReader();
      readerRef.current = reader;

      const controls = await reader.decodeFromConstraints(
        {
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        videoEl,
        (result) => {
          const text = result?.getText?.() ?? "";
          if (!text) return;
          void onDetected(text);
        },
      );

      controlsRef.current = controls;
      setPhase("scanning");
    } catch (err) {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      hintTimerRef.current = null;
      const message = cameraErrorMessage(err);
      setCameraError(message);
      setPhase("camera-error");
    }
  }, [onDetected, stopCamera]);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) {
      stopCamera();
      setPhase("idle");
      setResolution(null);
      setCameraError(null);
      return;
    }

    setResolution(null);
    setCameraError(null);
    setScanningHint(false);
    inFlightRef.current = false;
    lastTextRef.current = null;

    void startCamera();
    return () => stopCamera();
  }, [open, startCamera, stopCamera]);

  if (!open) return null;

  const confirm = () => {
    if (!resolution || !("product" in resolution)) return;
    stopCamera();
    addReward(resolution.product.tokenReward);
    setPhase("rewarded");
    setTimeout(onClose, 1400);
  };

  const rescan = () => {
    setResolution(null);
    setCameraError(null);
    setScanningHint(false);
    inFlightRef.current = false;
    lastTextRef.current = null;
    void startCamera();
  };

  const close = () => {
    stopCamera();
    onClose();
  };

  const product: Product | null =
    resolution && "product" in resolution ? resolution.product : null;

  return (
    <div className="fixed inset-0 z-[100] bg-ui-dark/80 backdrop-blur-sm grid place-items-center px-4 animate-fade-up">
      <div className="w-full max-w-sm bg-background rounded-[16px] overflow-hidden ring-1 ring-black/10 shadow-2xl">
        <div className="flex justify-between items-center px-5 py-3 border-b border-zinc-200">
          <span className="font-mono text-[11px] uppercase tracking-widest text-ui-muted">
            QR Provenance Scan
          </span>
          <button onClick={close} className="text-ui-muted hover:text-ui-dark">
            <X className="size-4" />
          </button>
        </div>

        <div className="aspect-square bg-ui-dark relative overflow-hidden">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover opacity-90"
            muted
            playsInline
          />
          <div className="absolute inset-6 border-2 border-brand-accent/60 rounded-2xl">
            <span className="absolute -top-px -left-px size-6 border-t-2 border-l-2 border-brand-accent rounded-tl-2xl" />
            <span className="absolute -top-px -right-px size-6 border-t-2 border-r-2 border-brand-accent rounded-tr-2xl" />
            <span className="absolute -bottom-px -left-px size-6 border-b-2 border-l-2 border-brand-accent rounded-bl-2xl" />
            <span className="absolute -bottom-px -right-px size-6 border-b-2 border-r-2 border-brand-accent rounded-br-2xl" />
            {(phase === "scanning" ||
              phase === "requesting-permission" ||
              phase === "found" ||
              phase === "submitting") && (
              <div className="absolute inset-x-0 top-0 h-[2px] bg-brand-accent shadow-[0_0_20px_4px_rgba(16,185,129,0.6)] animate-scan" />
            )}
          </div>
          <div className="absolute inset-0 grid place-items-center pointer-events-none">
            {phase === "requesting-permission" ? (
              <div className="flex flex-col items-center gap-2 text-neutral-300 text-center px-10">
                <ScanLine className="size-10 text-brand-accent/60" />
                <span className="font-mono text-[10px] uppercase tracking-widest">
                  Requesting camera access…
                </span>
              </div>
            ) : phase === "scanning" ? (
              <div className="flex flex-col items-center gap-2 text-neutral-400">
                <ScanLine className="size-10 text-brand-accent/60" />
                <span className="font-mono text-[10px] uppercase tracking-widest">
                  Scanning for QR…
                </span>
                {scanningHint && (
                  <span className="text-[11px] text-neutral-400/80">
                    Try better light and hold steady
                  </span>
                )}
              </div>
            ) : phase === "submitting" ? (
              <div className="flex flex-col items-center gap-2 text-neutral-300 text-center px-10">
                <ScanLine className="size-10 text-brand-accent/60" />
                <span className="font-mono text-[10px] uppercase tracking-widest">
                  Validating code…
                </span>
              </div>
            ) : product ? (
              <div className="text-center px-6">
                <div className="size-12 mx-auto rounded-full bg-brand-accent/20 grid place-items-center ring-2 ring-brand-accent/40">
                  <div className="size-3 bg-brand-accent rounded-full" />
                </div>
                <p className="mt-3 text-neutral-300 font-mono text-[10px] uppercase tracking-widest">
                  Item ID #{product.id}
                </p>
                <p className="text-neutral-50 font-medium mt-1">
                  {product.name}
                </p>
              </div>
            ) : phase === "invalid-code" ? (
              <div className="text-center px-8">
                <p className="text-neutral-50 font-medium">Invalid QR code</p>
                <p className="mt-2 text-neutral-300 text-xs">
                  {resolution?.status === "invalid-code"
                    ? resolution.reason
                    : "Try scanning again."}
                </p>
              </div>
            ) : (
              <div className="text-center px-8">
                <p className="text-neutral-50 font-medium">Camera error</p>
                <p className="mt-2 text-neutral-300 text-xs">
                  {cameraError ?? "Unable to access the camera."}
                </p>
              </div>
            )}
          </div>
        </div>

        {(phase === "success" ||
          phase === "backend-fallback" ||
          phase === "rewarded") &&
          product && (
            <div className="px-5 py-4 space-y-3">
              {phase === "backend-fallback" && (
                <div className="text-[11px] font-mono uppercase tracking-widest text-amber-700 bg-amber-50 ring-1 ring-amber-200 px-3 py-2 rounded-[10px]">
                  Using mock mode (backend unavailable)
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-ui-muted">Material</span>
                <span className="font-mono">{product.material}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-ui-muted">Weight</span>
                <span className="font-mono">
                  {product.weightKg.toFixed(3)} kg
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-ui-muted">Reward (vendor)</span>
                <span className="font-mono text-brand-secondary font-semibold">
                  +{product.tokenReward.toFixed(2)} $ECO
                </span>
              </div>
              <button
                disabled={phase === "rewarded"}
                onClick={confirm}
                className="w-full py-3 rounded-[10px] bg-brand-primary text-neutral-50 text-sm font-medium active:scale-98 transition-transform disabled:bg-emerald-700"
              >
                {phase === "rewarded" ? "Reward minted ✓" : "Confirm drop-off"}
              </button>
              <button
                onClick={() =>
                  navigate({
                    to: "/journey/$itemId",
                    params: { itemId: product.id },
                  })
                }
                className="w-full py-3 rounded-[10px] bg-zinc-100 text-ui-dark text-sm font-medium active:scale-98 transition-transform"
              >
                View provenance
              </button>
            </div>
          )}

        {(phase === "invalid-code" || phase === "camera-error") && (
          <div className="px-5 py-4 space-y-3">
            <button
              onClick={rescan}
              className="w-full py-3 rounded-[10px] bg-brand-primary text-neutral-50 text-sm font-medium active:scale-98 transition-transform"
            >
              Rescan
            </button>
            <button
              onClick={close}
              className="w-full py-3 rounded-[10px] bg-zinc-100 text-ui-dark text-sm font-medium active:scale-98 transition-transform"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}