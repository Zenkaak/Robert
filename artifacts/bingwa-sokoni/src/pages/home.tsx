import { useState, useMemo } from "react";
import { useListOffers } from "@workspace/api-client-react";
import { OfferRow } from "@/components/offer-row";
import { PaymentModal } from "@/components/payment-modal";
import { Search, Wifi, Phone, MessageSquare, Zap } from "lucide-react";
import type { Offer } from "@workspace/api-client-react/src/generated/api.schemas";

type Tab = "data" | "data_multiple" | "minutes" | "sms";

const TABS: { id: Tab; label: string; icon: React.ElementType; note: string }[] = [
  { id: "data",          label: "Data",          icon: Wifi,          note: "Once per day" },
  { id: "data_multiple", label: "Data Boosters",  icon: Zap,           note: "Buy multiple times" },
  { id: "minutes",       label: "Minutes",        icon: Phone,         note: "Buy multiple times" },
  { id: "sms",           label: "SMS",            icon: MessageSquare, note: "Buy multiple times" },
];

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
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border/50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center shrink-0">
              <Wifi className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground leading-none">Robert Lengou</p>
              <p className="text-sm font-bold text-foreground leading-tight tracking-tight">BINGWA OFFERS</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="hidden sm:inline">Secured by</span>
            <span className="font-bold text-primary">M-Pesa</span>
          </div>
        </div>

        {/* Trust bar */}
        <div className="border-t border-border/30 bg-card/30">
          <div className="max-w-3xl mx-auto px-4 py-1.5 flex gap-4 overflow-x-auto text-[11px] text-muted-foreground scrollbar-hide">
            <span className="shrink-0 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
              Instant activation
            </span>
            <span className="shrink-0 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
              Support 24/7
            </span>
            <span className="shrink-0 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
              And more offers available
            </span>
          </div>
        </div>
      </header>

      {/* ── Category tabs ── */}
      <div className="sticky top-[88px] z-10 bg-background/95 backdrop-blur border-b border-border/40">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSearch(""); }}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-primary text-white shadow-md"
                      : "bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-4 space-y-3">

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${activeTabMeta.label.toLowerCase()} packages...`}
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
          />
        </div>

        {/* Tab note */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {activeOffers.length} package{activeOffers.length !== 1 ? "s" : ""} available
          </p>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            activeTab === "data"
              ? "bg-orange-500/15 text-orange-400"
              : "bg-primary/15 text-primary"
          }`}>
            {activeTabMeta.note}
          </span>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 rounded-lg bg-card border border-border/40 animate-pulse" />
            ))}
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="text-center py-16">
            <p className="text-destructive font-semibold mb-1">Failed to load offers</p>
            <p className="text-muted-foreground text-sm mb-4">Please check your connection and try again.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Retry
            </button>
          </div>
        )}

        {/* Offer list */}
        {!isLoading && !error && (
          <>
            {activeOffers.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">
                No packages match your search.
              </div>
            ) : (
              <div className="space-y-2">
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
