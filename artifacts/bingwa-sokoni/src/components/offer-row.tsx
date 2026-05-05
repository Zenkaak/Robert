import type { Offer } from "@workspace/api-client-react/src/generated/api.schemas";
import { Wifi, Phone, MessageSquare, Zap } from "lucide-react";

interface OfferRowProps {
  offer: Offer;
  onClick: () => void;
}

const categoryIcon = {
  data: Wifi,
  data_multiple: Zap,
  minutes: Phone,
  sms: MessageSquare,
};

const categoryColor = {
  data: "from-green-500/20 to-green-600/10 border-green-500/30",
  data_multiple: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
  minutes: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
  sms: "from-orange-500/20 to-orange-600/10 border-orange-500/30",
};

const iconColor = {
  data: "text-green-400",
  data_multiple: "text-blue-400",
  minutes: "text-purple-400",
  sms: "text-orange-400",
};

export function OfferRow({ offer, onClick }: OfferRowProps) {
  const Icon = categoryIcon[offer.category] ?? Wifi;
  const gradClass = categoryColor[offer.category] ?? categoryColor.data;
  const icClass = iconColor[offer.category] ?? iconColor.data;

  const details = [
    offer.data ?? null,
    offer.minutes ?? null,
    offer.sms ?? null,
  ]
    .filter(Boolean)
    .join(" + ");

  const validityLabel = offer.validity.toUpperCase();

  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl bg-[#131720] border border-white/5 hover:border-primary/40 hover:bg-[#1a2030] transition-all cursor-pointer group"
    >
      {/* Icon */}
      <div
        className={`shrink-0 w-10 h-10 rounded-full bg-gradient-to-br border flex items-center justify-center ${gradClass}`}
      >
        <Icon className={`w-4 h-4 ${icClass}`} />
      </div>

      {/* Name + sub */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-white leading-tight group-hover:text-primary transition-colors truncate">
          {offer.name}
        </p>
        {details && (
          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full bg-current ${icClass} inline-block`} />
            {details}
          </p>
        )}
      </div>

      {/* Price block — dasnet style: small KSH label + big number */}
      <div className="shrink-0 text-left">
        <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
          KSH
        </span>
        <span className="block text-xl font-black text-white leading-tight">
          {offer.price}
        </span>
      </div>

      {/* Validity — far right */}
      <div className="shrink-0 text-right hidden sm:block w-24">
        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
          {validityLabel}
        </span>
      </div>
    </button>
  );
}
