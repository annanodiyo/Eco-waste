import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { LogOut, X } from "lucide-react";
import { useRoleSession } from "@/lib/roleSession";
import { openRolePicker } from "@/lib/rolePicker";

type Props = { open: boolean; onClose: () => void };

export function SwitchRoleModal({ open, onClose }: Props) {
  const navigate = useNavigate();
  const { clearRole } = useRoleSession();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const confirm = () => {
    clearRole();
    onClose();
    navigate({ to: "/" });
    openRolePicker();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="switch-role-title"
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-card rounded-[16px] ring-1 ring-black/5 shadow-2xl p-6 sm:p-7 animate-in zoom-in-95 fade-in duration-200"
      >
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
              <LogOut className="size-5 text-brand-primary" strokeWidth={1.8} />
            </div>
            <h2 id="switch-role-title" className="text-lg font-semibold tracking-tight">
              Switch Role?
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="size-8 rounded-full hover:bg-zinc-100 flex items-center justify-center text-ui-muted transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="text-sm text-ui-muted mb-6 text-pretty">
          You are about to leave the current workspace and return to role selection.
        </p>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-full text-sm font-medium bg-background ring-1 ring-black/10 hover:bg-zinc-100 transition-colors active:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            className="px-5 py-3 rounded-full text-sm font-medium bg-ui-dark text-neutral-50 hover:bg-brand-primary transition-colors active:scale-[0.98]"
          >
            Return to Role Selection
          </button>
        </div>
      </div>
    </div>
  );
}
