import { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";
import { Loader2, Camera, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface QRScannerProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (data: string) => void;
}

export function QRScanner({ isOpen, onClose, onScan }: QRScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const controlsRef = useRef<IScannerControls | null>(null);

    useEffect(() => {
        if (!isOpen) {
            if (controlsRef.current) {
                controlsRef.current.stop();
                controlsRef.current = null;
            }
            return;
        }

        const codeReader = new BrowserQRCodeReader();

        async function startScanning() {
            setLoading(true);
            setError(null);
            try {
                const videoInputDevices = await BrowserQRCodeReader.listVideoInputDevices();
                if (videoInputDevices.length === 0) {
                    throw new Error("No camera found");
                }

                // Use the last camera (often the back camera on mobile)
                const deviceId = videoInputDevices[videoInputDevices.length - 1].deviceId;

                const controls = await codeReader.decodeFromVideoDevice(
                    deviceId,
                    videoRef.current!,
                    (result, err) => {
                        if (result) {
                            onScan(result.getText());
                            onClose();
                        }
                    }
                );
                controlsRef.current = controls;
                setLoading(false);
            } catch (err: any) {
                console.error("Camera error:", err);
                setError(err.message || "Failed to start camera");
                setLoading(false);
            }
        }

        startScanning();

        return () => {
            if (controlsRef.current) {
                controlsRef.current.stop();
                controlsRef.current = null;
            }
        };
    }, [isOpen, onClose, onScan]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-black border-none ring-0">
                <DialogHeader className="p-4 absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/60 to-transparent">
                    <DialogTitle className="text-white flex items-center gap-2 text-sm font-medium">
                        <Camera className="size-4" />
                        Scan Product QR
                    </DialogTitle>
                </DialogHeader>

                <div className="relative aspect-square bg-zinc-900 flex items-center justify-center">
                    {loading && (
                        <div className="flex flex-col items-center gap-2 text-zinc-400">
                            <Loader2 className="size-8 animate-spin" />
                            <p className="text-xs font-mono uppercase tracking-widest">Initializing Camera...</p>
                        </div>
                    )}

                    {error && (
                        <div className="p-6 text-center space-y-4">
                            <p className="text-sm text-red-400 font-medium">{error}</p>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-medium transition-colors"
                            >
                                Close Scanner
                            </button>
                        </div>
                    )}

                    <video
                        ref={videoRef}
                        className={`w-full h-full object-cover ${loading || error ? 'hidden' : 'block'}`}
                    />

                    {!loading && !error && (
                        <div className="absolute inset-0 border-[2px] border-white/20 pointer-events-none">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-48 border-2 border-brand-primary rounded-2xl animate-pulse ring-[1000px] ring-black/40" />
                        </div>
                    )}
                </div>

                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 z-20 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
                >
                    <X className="size-4" />
                </button>
            </DialogContent>
        </Dialog>
    );
}
