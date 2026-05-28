import type { ChainStatus } from "@/lib/mockData";

const STYLES: Record<ChainStatus, string> = {
  verified: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  signed: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  pending: "bg-amber-100 text-amber-800 ring-amber-200",
  archived: "bg-zinc-50 text-zinc-500 ring-zinc-200",
};

export function ChainBadge({ status }: { status: ChainStatus }) {
  return (
    <span
      className={`px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-full ring-1 ${STYLES[status]}`}
    >
      {status}
    </span>
  );
}
