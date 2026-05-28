import { Copy } from "lucide-react";
import { useState } from "react";

export function TxHash({ hash, short = true }: { hash: string; short?: boolean }) {
  const [copied, setCopied] = useState(false);
  if (!hash) return <span className="font-mono text-xs text-ui-muted">—</span>;
  const display = short && hash.length > 14 ? `${hash.slice(0, 6)}…${hash.slice(-4)}` : hash;
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(hash);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className="inline-flex items-center gap-1.5 font-mono text-xs text-ui-muted hover:text-brand-primary group"
    >
      {display}
      <Copy className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      {copied && <span className="text-[10px] text-brand-primary">copied</span>}
    </button>
  );
}
