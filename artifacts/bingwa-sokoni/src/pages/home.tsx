import { useState, useMemo } from "react";
import { useListOffers } from "@workspace/api-client-react";
import { OfferRow } from "@/components/offer-row";
import { PaymentModal } from "@/components/payment-modal";
import { HistoryDrawer } from "@/components/history-drawer";
import {
  Search,
  Wifi,
  Phone,
  MessageSquare,
  Zap,
  ShieldCheck,
  Clock,
  Headphones,
  BadgeCheck,
  SlidersHorizontal,
  CreditCard,
  Store,
  MessageCircle,
  History,
} from "lucide-react";
import type { Offer } from "@workspace/api-client-react/src/generated/api.schemas";

type Tab = "data" | "data_multiple" | "minutes" | "sms";

const TABS: { id: Tab; label: string; icon: React.ElementType; note: string; color: string }[] = [
  { id: "data",          label: "Data",          icon: Wifi,          note: "Once per day",   color: "text-green-400"  },
  { id: "data_multiple", label: "Data Boosters", icon: Zap,           note: "Multiple times", color: "text-blue-400"   },
  { id: "minutes",       label: "Minutes",       icon: Phone,         note: "Multiple times", color: "text-purple-400" },
  { id: "sms",           label: "SMS",           icon: MessageSquare, note: "Multiple times", color: "text-orange-400" },
];

const CATEGORY_CARDS = [
  { id: "data" as Tab,          label: "Data Bundles",  sub: "Once per day",   icon: Wifi,          color: "text-green-400",  glow: "shadow-green-500/10"  },
  { id: "data_multiple" as Tab, label: "Data Boosters", sub: "Multiple times", icon: Zap,           color: "text-blue-400",   glow: "shadow-blue-500/10"   },
  { id: "minutes" as Tab,       label: "Minutes",       sub: "Multiple times", icon: Phone,         color: "text-purple-400", glow: "shadow-purple-500/10" },
  { id: "sms" as Tab,           label: "SMS Bundles",   sub: "Multiple times", icon: MessageSquare, color: "text-orange-400", glow: "shadow-orange-500/10" },
];

const TRUST_ITEMS = [
  { icon: BadgeCheck,  label: "Verified Vendor"   },
  { icon: Clock,       label: "Instant delivery"  },
  { icon: ShieldCheck, label: "Secured by M-Pesa" },
  { icon: Headphones,  label: "Support 24/7"      },
  { icon: BadgeCheck,  label: "Verified Vendor"   },
];

function Ticker() {
  const text = "Best bundle offers in Kenya — Instant activation, 24/7 — ROBERT LENGOU BINGWA OFFERS — ";
  return (
    <div className="bg-primary/10 border-y border-primary/20 py-1.5 overflow-hidden">
      <div className="flex whitespace-nowrap animate-[marquee_30s_linear_infinite]">
        {[...Array(4)].map((_, i) => (
          <span key={i} className="text-primary text-xs font-medium mr-12 shrink-0">
            <span className="mr-2 opacity-60">●</span>{text}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const { data: offersData, isLoading, error } = useListOffers();
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("data");
  const [search, setSearch] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);

  const activeOffers: Offer[] = useMemo(() => {
    if (!offersData) return [];
    const list = offersData[activeTab] ?? [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        (o.data?.toLowerCase().includes(q)) ||
        (o.minutes?.toLowerCase().includes(q)) ||
        (o.sms?.toLowerCase().includes(q)) ||
        String(o.price).includes(q) ||
        o.validity.toLowerCase().includes(q)
    );
  }, [offersData, activeTab, search]);

  const activeTabMeta = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col">

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-[#0d1117]/95 backdrop-blur border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <Wifi className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 leading-none">Robert Lengou</p>
              <p className="text-base font-black text-white tracking-tight leading-tight">BINGWA OFFERS</p>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHistoryOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all text-xs text-slate-300 font-semibold"
            >
              <History className="w-3.5 h-3.5" />
              <span>History</span>
            </button>
            <span className="text-xs text-slate-500 hidden sm:block">
              Secured by <span className="text-primary font-bold">M-Pesa</span>
            </span>
          </div>
        </div>

        {/* Trust bar */}
        <div className="border-t border-white/5 bg-[#0a0e15]">
          <div className="max-w-5xl mx-auto px-4 py-1.5 flex gap-5 overflow-x-auto scrollbar-hide">
            {TRUST_ITEMS.map((item, i) => {
              const Icon = item.icon;
              return (
                <span key={i} className="shrink-0 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Icon className="w-3 h-3 text-primary" />
                  {item.label}
                </span>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── Ticker ── */}
      <Ticker />

      {/* ── Body ── */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-5 space-y-5">

        {/* Category cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CATEGORY_CARDS.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => { setActiveTab(cat.id); setSearch(""); }}
                className={`flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-xl border transition-all ${
                  isActive
                    ? "bg-primary/10 border-primary/40 shadow-lg shadow-primary/10"
                    : "bg-[#131720] border-white/5 hover:border-white/15 hover:bg-[#1a2030]"
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? "text-primary" : cat.color}`} />
                <div className="text-center">
                  <p className={`text-xs font-bold leading-tight ${isActive ? "text-primary" : "text-white"}`}>
                    {cat.label}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{cat.sub}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Tab pills + search */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-start sm:items-center">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide shrink-0">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSearch(""); }}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-primary text-white"
                      : "bg-[#131720] border border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-white" : tab.color.replace("text-", "bg-")}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search packages (e.g. 1GB, midnight...)"
              className="w-full pl-8 pr-10 py-2 bg-[#131720] border border-white/8 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
            />
            <SlidersHorizontal className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
          </div>
        </div>

        {/* Offer count + note */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">
            {activeOffers.length} package{activeOffers.length !== 1 ? "s" : ""}
          </span>
          <span className={`font-semibold px-2.5 py-1 rounded-full text-[11px] ${
            activeTab === "data"
              ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
              : "bg-primary/10 text-primary border border-primary/20"
          }`}>
            {activeTabMeta.note}
          </span>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-[#131720] animate-pulse border border-white/5" />
            ))}
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="text-center py-20">
            <p className="text-red-400 font-semibold mb-1">Failed to load offers</p>
            <p className="text-slate-500 text-sm mb-4">Check your connection and try again.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
            >
              Retry
            </button>
          </div>
        )}

        {/* Offer grid */}
        {!isLoading && !error && (
          <>
            {activeOffers.length === 0 ? (
              <div className="text-center py-20 text-slate-500 text-sm">
                No packages match your search.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activeOffers.map((offer) => (
                  <OfferRow
                    key={offer.id}
                    offer={offer}
                    onClick={() => setSelectedOffer(offer)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Offline purchase card */}
        <div className="rounded-xl border border-white/8 bg-[#131720] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
            <Store className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-white">Offline Purchase</span>
          </div>
          <div className="px-4 py-4 space-y-3 text-sm text-slate-300">
            <p className="text-slate-400 text-xs leading-relaxed">
              Send money directly to our M-Pesa Till. Your bundle is activated automatically — no need to send any message.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 bg-black/30 rounded-lg px-3 py-2.5 border border-white/5">
                <CreditCard className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">M-Pesa Till</p>
                  <p className="text-lg font-black text-white tracking-widest">4336560</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-black/30 rounded-lg px-3 py-2.5 border border-white/5">
                <Phone className="w-4 h-4 text-green-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Business Name</p>
                  <p className="text-sm font-bold text-white">Robert Lengou</p>
                </div>
              </div>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2.5 space-y-1 text-xs text-slate-400">
              <p className="font-semibold text-primary text-[11px] uppercase tracking-wide">How it works</p>
              <p>1. Select your bundle above and tap to buy</p>
              <p>2. Send the exact amount to <span className="text-white font-bold">Till 4336560</span></p>
              <p>3. Bundle activates automatically on your number</p>
            </div>
            <a
              href="https://wa.me/254114200533"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] text-sm font-semibold hover:bg-[#25D366]/20 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp — +254 114 200 533
            </a>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 bg-[#0a0e15] mt-6">
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                <Wifi className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-500 leading-none">Robert Lengou</p>
                <p className="text-sm font-black text-white tracking-tight">BINGWA OFFERS</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-white/[0.03] border border-white/5 px-3 py-2 rounded-lg">
              <CreditCard className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>M-Pesa Till:</span>
              <span className="font-black text-white tracking-widest">4336560</span>
            </div>
          </div>
          <div className="border-t border-white/5" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-600">
            <p>© {new Date().getFullYear()} Robert Lengou Bingwa Offers. All rights reserved.</p>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-primary" />
              <span>Payments secured by M-Pesa</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ── WhatsApp floating button ── */}
      <a
        href="https://wa.me/254114200533"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-[#25D366] hover:bg-[#20c05a] text-white px-4 py-3 rounded-full shadow-xl shadow-black/40 transition-all hover:scale-105 active:scale-95"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="w-5 h-5 shrink-0" />
        <span className="text-sm font-bold hidden sm:inline">WhatsApp Us</span>
      </a>

      {/* ── Modals ── */}
      <HistoryDrawer open={historyOpen} onClose={() => setHistoryOpen(false)} />

      {selectedOffer && (
        <PaymentModal
          offer={selectedOffer}
          open={!!selectedOffer}
          onOpenChange={(open) => !open && setSelectedOffer(null)}
        />
      )}
    </div>
  );
}
