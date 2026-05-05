import { useState } from "react";
import { useListOffers } from "@workspace/api-client-react";
import { OfferCard } from "@/components/offer-card";
import { PaymentModal } from "@/components/payment-modal";
import { Skeleton } from "@/components/ui/skeleton";
import type { Offer } from "@workspace/api-client-react/src/generated/api.schemas";

export default function Home() {
  const { data: offersData, isLoading, error } = useListOffers();
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-primary text-primary-foreground p-4 sticky top-0 z-10 shadow-sm">
          <h1 className="text-xl font-bold tracking-tight text-center">ROBERT LENGOU BINGWA OFFERS</h1>
        </header>
        <main className="max-w-3xl mx-auto p-4 space-y-8 mt-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-40" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !offersData) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="bg-card border border-border p-6 rounded-xl shadow-sm text-center max-w-md w-full">
          <h2 className="text-xl font-semibold text-destructive mb-2">Error loading offers</h2>
          <p className="text-muted-foreground mb-4">Please check your connection and try again.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-primary text-primary-foreground p-4 sticky top-0 z-10 shadow-md">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-xl font-black tracking-tight text-center uppercase">
            ROBERT LENGOU BINGWA OFFERS
          </h1>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto p-4 space-y-8 py-8">
        
        {offersData.data && offersData.data.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground flex items-center gap-2">
              <span className="bg-primary w-2 h-6 rounded-full inline-block"></span>
              Daily Data Deals
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {offersData.data.map(offer => (
                <OfferCard key={offer.id} offer={offer} onClick={() => setSelectedOffer(offer)} />
              ))}
            </div>
          </section>
        )}

        {offersData.minutes && offersData.minutes.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground flex items-center gap-2">
              <span className="bg-chart-2 w-2 h-6 rounded-full inline-block"></span>
              Minutes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {offersData.minutes.map(offer => (
                <OfferCard key={offer.id} offer={offer} onClick={() => setSelectedOffer(offer)} />
              ))}
            </div>
          </section>
        )}

        {offersData.sms && offersData.sms.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground flex items-center gap-2">
              <span className="bg-chart-3 w-2 h-6 rounded-full inline-block"></span>
              SMS Bundles
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {offersData.sms.map(offer => (
                <OfferCard key={offer.id} offer={offer} onClick={() => setSelectedOffer(offer)} />
              ))}
            </div>
          </section>
        )}

        {offersData.data_multiple && offersData.data_multiple.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground flex items-center gap-2">
              <span className="bg-chart-4 w-2 h-6 rounded-full inline-block"></span>
              Data Boosters
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {offersData.data_multiple.map(offer => (
                <OfferCard key={offer.id} offer={offer} onClick={() => setSelectedOffer(offer)} />
              ))}
            </div>
          </section>
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
