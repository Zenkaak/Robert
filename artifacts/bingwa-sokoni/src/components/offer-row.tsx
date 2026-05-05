import type { Offer } from "@workspace/api-client-react/src/generated/api.schemas";
import { Wifi, Phone, MessageSquare } from "lucide-react";

interface OfferRowProps {
  offer: Offer;
  onClick: () => void;
}

const categoryIcon = {
  data: Wifi,
  data_multiple: Wifi,
  minutes: Phone,
  sms: MessageSquare,
};

export function OfferRow({ offer, onClick }: OfferRowProps) {
  const Icon = categoryIcon[offer.category] ?? Wifi;

  const details = [
    offer.data ? `${offer.data}` : null,
    offer.minutes ? `${offer.minutes}` : null,
    offer.sms ? `${offer.sms}` : null,
  ].filter(Boolean).join(" + ");

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-4 py-3.5 rounded-lg bg-card border border-border/40 hover:border-primary/50 hover:bg-accent transition-all cursor-pointer group text-left"
    >
      {/* Icon */}
      <div className="shrink-0 w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>

      {/* Name + details */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground leading-tight truncate group-hover:text-primary transition-colors">
          {offer.name}
        </p>
        {details && (
          <p className="text-xs text-muted-foreground mt-0.5">{details}</p>
        )}
      </div>

      {/* Validity */}
      <div className="shrink-0 text-right hidden sm:block">
        <span className="text-xs text-muted-foreground uppercase tracking-wide">
          {offer.validity}
        </span>
      </div>

      {/* Price */}
      <div className="shrink-0 text-right ml-2">
        <span className="text-base font-black text-primary">
          Ksh {offer.price}
        </span>
      </div>
    </button>
  );
}
