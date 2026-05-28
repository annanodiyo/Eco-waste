import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShieldCheck, Info } from "lucide-react";

export type ConfirmSignBatch = {
  id: string;
  material: string;
  est: string;
  user: string;
};

export function ConfirmSignDialog({
  batch,
  open,
  onOpenChange,
  onConfirm,
}: {
  batch: ConfirmSignBatch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 rounded-[18px] border-black/5 bg-card/95 backdrop-blur-xl shadow-2xl shadow-emerald-900/10 ring-1 ring-black/5 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 text-left space-y-4">
          <div className="size-12 rounded-full bg-brand-primary/10 ring-1 ring-brand-primary/20 flex items-center justify-center">
            <ShieldCheck className="size-6 text-brand-primary" strokeWidth={1.8} />
          </div>
          <div className="space-y-1.5">
            <DialogTitle className="text-xl font-semibold tracking-tight">
              Confirm Submission
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-ui-muted">
              Are you sure you want to weigh and sign this batch? This action records
              the submission and cannot be easily reversed.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="px-6 space-y-3">
          {batch && (
            <div className="rounded-[12px] bg-zinc-50 ring-1 ring-black/5 px-4 py-3 space-y-1.5">
              <Row label="Batch ID" value={batch.id} />
              <Row label="Material" value={`${batch.material} · ${batch.est}`} />
              <Row label="User" value={batch.user} truncate />
            </div>
          )}

          <div className="flex gap-2.5 rounded-[12px] bg-amber-50/70 ring-1 ring-amber-200/60 px-3.5 py-3">
            <Info className="size-4 text-amber-700 shrink-0 mt-0.5" strokeWidth={2} />
            <p className="text-xs leading-relaxed text-amber-900/90">
              Please verify the material and weight before signing. Signed batches
              become part of the system record.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-row gap-2 px-6 py-5 mt-2">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 px-4 py-2.5 rounded-full text-sm font-medium text-ui-dark bg-transparent ring-1 ring-black/10 hover:bg-zinc-50 active:scale-[0.98] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-full text-sm font-medium text-neutral-50 bg-brand-primary hover:bg-brand-secondary ring-1 ring-emerald-900/20 shadow-sm shadow-emerald-900/10 active:scale-[0.98] transition-all"
          >
            Sign Batch
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, truncate }: { label: string; value: string; truncate?: boolean }) {
  return (
    <div className="flex justify-between items-center gap-3 text-xs">
      <span className="font-mono uppercase tracking-wider text-ui-muted text-[10px]">
        {label}
      </span>
      <span className={`font-mono text-ui-dark ${truncate ? "truncate" : ""}`}>
        {value}
      </span>
    </div>
  );
}
