import { useState, useEffect } from "react";
import { X, History, CheckCircle2, XCircle, Trash2, Wifi, Phone, MessageSquare, Zap } from "lucide-react";
import { getHistory, clearHistory, maskPhone, type HistoryEntry } from "@/lib/history";

interface HistoryDrawerProps {
  open: boolean;
  onClose: () => void;
}

const categoryIcon: Record<string, React.ElementType> = {
  data: Wifi,
  data_multiple: Zap,
  minutes: Phone,
  sms: MessageSquare,
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" }) +
    " · " + d.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
}

export function HistoryDrawer({ open, onClose }: HistoryDrawerProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    if (open) setEntries(getHistory());
  }, [open]);

  function handleClear() {
    clearHistory();
    setEntries([]);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-[#0d1117] border-l border-white/10 flex flex-col transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <div className="flex items-center gap-2.5">
            <History className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold text-white">Purchase History</p>
          </div>
          <div className="flex items-center gap-2">
            {entries.length > 0 && (
              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10"
              >
                <Trash2 className="w-3 h-3" />
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto py-3 px-4 space-y-2.5">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20 space-y-3">
              <div className="w-14 h-14 rounded-full bg-white/[0.03] border border-white/8 flex items-center justify-center">
                <History className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">No purchases yet</p>
                <p className="text-xs text-slate-600 mt-1">Your completed payments will appear here</p>
              </div>
            </div>
          ) : (
            entries.map((entry) => (
              <HistoryCard key={entry.checkoutRequestId} entry={entry} />
            ))
          )}
        </div>

        {/* Footer count */}
        {entries.length > 0 && (
          <div className="px-5 py-3 border-t border-white/[0.07]">
            <p className="text-[11px] text-slate-600 text-center">
              {entries.length} purchase{entries.length !== 1 ? "s" : ""} in history
            </p>
          </div>
        )}
      </div>
    </>
  );
}

function HistoryCard({ entry }: { entry: HistoryEntry }) {
  const isSuccess = entry.status === "success";

  return (
    <div className={`rounded-xl border overflow-hidden ${isSuccess ? "border-white/[0.07] bg-white/[0.02]" : "border-red-500/10 bg-red-500/[0.03]"}`}>
      {/* Top row */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
        <div className="flex items-center gap-2.5">
          {isSuccess ? (
            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <div>
            <p className="text-xs font-bold text-white leading-tight">{entry.offerName}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{formatDate(entry.purchasedAt)}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider leading-none">KSH</p>
          <p className="text-base font-black text-white leading-tight">{entry.amount}</p>
        </div>
      </div>

      {/* Details */}
      <div className="px-4 py-2.5 space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-[11px] text-slate-500">Paid from</span>
          <span className="text-[11px] font-mono font-semibold text-slate-300">{maskPhone(entry.payerPhone)}</span>
        </div>
        {entry.recipientPhone && (
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-slate-500">Sent to</span>
            <span className="text-[11px] font-mono font-semibold text-slate-300">{maskPhone(entry.recipientPhone)}</span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-[11px] text-slate-500">Validity</span>
          <span className="text-[11px] font-semibold text-slate-300">{entry.validity}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[11px] text-slate-500">Status</span>
          <span className={`text-[11px] font-bold ${isSuccess ? "text-green-400" : "text-red-400"}`}>
            {isSuccess ? "Success" : "Failed"}
          </span>
        </div>
      </div>
    </div>
  );
}
