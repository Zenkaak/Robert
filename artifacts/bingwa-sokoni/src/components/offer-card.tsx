import type { Offer } from "@workspace/api-client-react/src/generated/api.schemas";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface OfferCardProps {
  offer: Offer;
  onClick: () => void;
}

export function OfferCard({ offer, onClick }: OfferCardProps) {
  const isDataOffer = offer.category === "data";
  
  return (
    <Card 
      className="overflow-hidden border-2 border-border/50 hover:border-primary transition-all cursor-pointer hover:shadow-md group active:scale-[0.98]"
      onClick={onClick}
      data-testid={`card-offer-${offer.id}`}
    >
      <div className="p-4 flex flex-col h-full justify-between">
        <div className="space-y-2">
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-bold text-lg leading-tight text-foreground group-hover:text-primary transition-colors">
              {offer.name}
            </h3>
            <div className="bg-primary/10 text-primary font-black px-3 py-1 rounded-full whitespace-nowrap">
              Ksh {offer.price}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mt-2">
            {offer.data && (
              <span className="flex items-center gap-1 font-medium bg-secondary px-2 py-0.5 rounded-md text-secondary-foreground">
                {offer.data} Data
              </span>
            )}
            {offer.minutes && (
              <span className="flex items-center gap-1 font-medium bg-secondary px-2 py-0.5 rounded-md text-secondary-foreground">
                {offer.minutes} Mins
              </span>
            )}
            {offer.sms && (
              <span className="flex items-center gap-1 font-medium bg-secondary px-2 py-0.5 rounded-md text-secondary-foreground">
                {offer.sms} SMS
              </span>
            )}
          </div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-border flex justify-between items-center text-xs">
          <span className="text-muted-foreground font-medium uppercase tracking-wider">{offer.validity} validity</span>
          {isDataOffer && !offer.multipleAllowed && (
            <Badge variant="outline" className="text-[10px] uppercase font-bold text-orange-600 border-orange-200 bg-orange-50">
              Once Daily
            </Badge>
          )}
          {offer.multipleAllowed && (
            <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/20 bg-primary/5">
              Multi-buy
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
