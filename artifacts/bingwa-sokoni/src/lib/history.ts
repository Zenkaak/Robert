export interface HistoryEntry {
  checkoutRequestId: string;
  offerName: string;
  amount: number;
  validity: string;
  payerPhone: string;
  recipientPhone?: string;
  status: "success" | "failed";
  purchasedAt: string;
}

const KEY = "bingwa_purchase_history";
const MAX = 50;

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 9) return phone;
  const local = digits.startsWith("254") ? "0" + digits.slice(3) : digits;
  if (local.length < 9) return phone;
  return local.slice(0, 4) + "***" + local.slice(-3);
}

export function getHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function addHistory(entry: HistoryEntry): void {
  try {
    const existing = getHistory().filter((e) => e.checkoutRequestId !== entry.checkoutRequestId);
    const updated = [entry, ...existing].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

export function clearHistory(): void {
  localStorage.removeItem(KEY);
}
