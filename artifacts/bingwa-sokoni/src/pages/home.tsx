import { useState, useMemo, useRef, useEffect } from "react";
import { useListOffers } from "@workspace/api-client-react";
import { OfferRow } from "@/components/offer-row";
import { PaymentModal } from "@/components/payment-modal";
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
} from "lucide-react";
import type { Offer } from "@workspace/api-client-react/src/generated/api.schemas";

type Tab = "data" | "data_multiple" | "minutes" | "sms";

const TABS: { id: Tab; label: string; icon: React.ElementType; note: string; color: string }[] = [
  { id: "data",          label: "Data",          icon: Wifi,          note: "Once per day",      color: "text-green-400"  },
  { id: "data_multiple", label: "Data Boosters", icon: Zap,           note: "Multiple times",    color: "text-blue-400"   },
  { id: "minutes",       label: "Minutes",       icon: Phone,         note: "Multiple times",    color: "text-purple-400" },
  { id: "sms",           label: "SMS",           icon: MessageSquare, note: "Multiple times",    color: "text-orange-400" },
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
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>Secured by <span className="text-primary font-bold">M-Pesa</span></span>
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
          {/* Pill tabs */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide shrink-0">
            {TABS.map((tab) => {
              const Icon = tab.icon;
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
              placeholder={`Search packages (e.g. 1GB, midnight...)`}
              className="w-full pl-8 pr-10 py-2 bg-[#131720] border border-white/8 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
            />
            <SlidersHorizontal className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
          </div>
        </div>

        {/* Offer count + purchase note */}
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

        {/* Loading skeletons */}
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

        {/* Two-column offer grid */}
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
      </main>

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
