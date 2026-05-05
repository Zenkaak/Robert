import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useInitiatePayment, useGetPaymentStatus, getGetPaymentStatusQueryKey } from "@workspace/api-client-react";
import type { Offer } from "@workspace/api-client-react/src/generated/api.schemas";
import { Loader2, CheckCircle2, XCircle, Wifi, Phone, MessageSquare, Zap, Shield, Clock, RefreshCw } from "lucide-react";

interface PaymentModalProps {
  offer: Offer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  phone: z.string().regex(
    /^(7\d{8}|1\d{8}|07\d{8}|254\d{9})$/,
    "Enter a valid Safaricom number e.g. 0712 345 678"
  ),
});

const categoryIcon = {
  data: Wifi,
  data_multiple: Zap,
  minutes: Phone,
  sms: MessageSquare,
};

const categoryColor = {
  data: "text-green-400",
  data_multiple: "text-blue-400",
  minutes: "text-purple-400",
  sms: "text-orange-400",
};

const STK_TIMEOUT = 60;

export function PaymentModal({ offer, open, onOpenChange }: PaymentModalProps) {
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(STK_TIMEOUT);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { phone: "" },
  });

  const initiatePayment = useInitiatePayment();

  const { data: paymentStatus, isError: isStatusError } = useGetPaymentStatus(
    checkoutRequestId ?? "",
    {
      query: {
        enabled: !!checkoutRequestId,
        queryKey: getGetPaymentStatusQueryKey(checkoutRequestId ?? ""),
        refetchInterval: (query) => {
          const status = query.state.data?.status;
          if (!checkoutRequestId || status === "success" || status === "failed") return false;
          return 3000;
        },
      },
    }
  );

  useEffect(() => {
    if (checkoutRequestId) {
      setCountdown(STK_TIMEOUT);
      countdownRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(countdownRef.current!);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } else {
      if (countdownRef.current) clearInterval(countdownRef.current);
    }
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [checkoutRequestId]);

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setCheckoutRequestId(null);
        setCountdown(STK_TIMEOUT);
        form.reset();
        initiatePayment.reset();
      }, 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    initiatePayment.mutate(
      { data: { phone: values.phone, offerId: offer.id, amount: offer.price } },
      {
        onSuccess: (data) => {
          if (data.success && data.checkoutRequestId) {
            setCheckoutRequestId(data.checkoutRequestId);
          } else {
            form.setError("root", { message: data.message ?? "Failed to initiate payment" });
          }
        },
        onError: (err: unknown) => {
          const message = err instanceof Error ? err.message : "Something went wrong";
          form.setError("root", { message });
        },
      }
    );
  }

  const isPolling = !!checkoutRequestId && paymentStatus?.status === "pending";
  const isSuccess = paymentStatus?.status === "success";
  const isFailed = paymentStatus?.status === "failed" || isStatusError || (!!checkoutRequestId && countdown === 0 && !isSuccess);

  const Icon = categoryIcon[offer.category] ?? Wifi;
  const iconColor = categoryColor[offer.category] ?? "text-green-400";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm bg-[#0d1117] border border-white/10 text-foreground p-0 overflow-hidden">

        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle className="flex items-center gap-2.5 text-sm font-bold text-white">
            <div className={`w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center`}>
              <Icon className={`w-4 h-4 ${iconColor}`} />
            </div>
            <div>
              <p className="text-white font-bold leading-tight">{offer.name}</p>
              <p className="text-[11px] text-slate-500 font-normal">M-Pesa Checkout</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 pb-5 pt-4 space-y-4">

          {/* Receipt card */}
          {!checkoutRequestId && (
            <div className="bg-white/[0.03] border border-white/8 rounded-xl overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between border-b border-white/5">
                <span className="text-xs text-slate-500 uppercase tracking-wider">Amount to Pay</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-[11px] font-bold text-slate-400">KSH</span>
                  <span className="text-2xl font-black text-white">{offer.price}</span>
                </div>
              </div>
              <div className="px-4 py-2.5 space-y-2">
                {offer.data && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Data</span>
                    <span className="text-xs font-semibold text-white">{offer.data}</span>
                  </div>
                )}
                {offer.minutes && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Minutes</span>
                    <span className="text-xs font-semibold text-white">{offer.minutes}</span>
                  </div>
                )}
                {offer.sms && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">SMS</span>
                    <span className="text-xs font-semibold text-white">{offer.sms}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Validity</span>
                  <span className="text-xs font-semibold text-white">{offer.validity}</span>
                </div>
              </div>
              {offer.category === "data" && !offer.multipleAllowed && (
                <div className="px-4 py-2 border-t border-white/5 bg-orange-500/5">
                  <p className="text-[11px] text-orange-400 font-medium">Once per day bundle</p>
                </div>
              )}
              {offer.multipleAllowed && (
                <div className="px-4 py-2 border-t border-white/5 bg-green-500/5">
                  <p className="text-[11px] text-green-400 font-medium">Can be purchased multiple times</p>
                </div>
              )}
            </div>
          )}

          {/* Phone form */}
          {!checkoutRequestId && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="flex rounded-lg overflow-hidden border border-white/10 focus-within:border-primary/60 transition-colors">
                          <div className="flex items-center gap-1.5 px-3 bg-white/[0.04] border-r border-white/10 shrink-0">
                            <span className="text-base">🇰🇪</span>
                            <span className="text-xs text-slate-400 font-mono">+254</span>
                          </div>
                          <Input
                            placeholder="712 345 678"
                            {...field}
                            type="tel"
                            inputMode="numeric"
                            disabled={initiatePayment.isPending}
                            className="border-0 bg-white/[0.03] text-white placeholder:text-slate-600 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none h-11"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs text-red-400" />
                    </FormItem>
                  )}
                />

                {form.formState.errors.root && (
                  <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 px-3 py-2.5 rounded-lg">
                    <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-red-400 text-xs">{form.formState.errors.root.message}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 font-bold bg-[#4bb543] hover:bg-[#3da436] text-white text-sm rounded-lg"
                  disabled={initiatePayment.isPending}
                >
                  {initiatePayment.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending prompt...</>
                  ) : (
                    <>Pay KSH {offer.price} via M-Pesa</>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-600">
                  <Shield className="w-3 h-3" />
                  <span>Secured by Safaricom M-Pesa</span>
                </div>
              </form>
            </Form>
          )}

          {/* Awaiting payment */}
          {checkoutRequestId && (isPolling || (!isSuccess && !isFailed)) && (
            <div className="py-4 flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Loader2 className="h-7 w-7 text-primary animate-spin" />
                </div>
                {countdown > 0 && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0d1117] border border-white/10 flex items-center justify-center">
                    <span className="text-[9px] font-black text-slate-400">{countdown}</span>
                  </div>
                )}
              </div>
              <div>
                <p className="font-bold text-white text-sm">Check your phone</p>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed max-w-[200px] mx-auto">
                  M-Pesa prompt sent. Enter your PIN to complete the payment.
                </p>
              </div>
              <div className="w-full bg-white/[0.03] border border-white/8 rounded-lg px-4 py-2.5 flex items-center justify-between">
                <span className="text-xs text-slate-500">Paying</span>
                <span className="text-sm font-black text-white">KSH {offer.price}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                <Clock className="w-3 h-3" />
                <span>Prompt expires in {countdown}s</span>
              </div>
            </div>
          )}

          {/* Success */}
          {isSuccess && (
            <div className="py-4 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </div>
              <div>
                <p className="font-black text-green-400 text-base">Payment Successful!</p>
                <p className="text-slate-400 text-xs mt-1">Your bundle is being activated</p>
              </div>
              <div className="w-full bg-green-500/5 border border-green-500/15 rounded-xl p-4 text-left space-y-2">
                <p className="text-[11px] text-green-500 uppercase tracking-wider font-semibold">Receipt</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Bundle</span>
                  <span className="text-xs font-bold text-white">{offer.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Amount</span>
                  <span className="text-xs font-bold text-green-400">KSH {offer.price}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Validity</span>
                  <span className="text-xs font-bold text-white">{offer.validity}</span>
                </div>
              </div>
              <Button
                className="w-full h-10 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 font-bold text-sm rounded-lg"
                onClick={() => onOpenChange(false)}
              >
                Done
              </Button>
            </div>
          )}

          {/* Failed */}
          {isFailed && !isSuccess && (
            <div className="py-4 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
              <div>
                <p className="font-black text-red-400 text-base">Payment Failed</p>
                <p className="text-slate-500 text-xs mt-1 max-w-[200px] mx-auto leading-relaxed">
                  {countdown === 0 && !paymentStatus?.resultDesc
                    ? "The M-Pesa prompt expired. Please try again."
                    : (paymentStatus?.resultDesc ?? "The transaction was not completed.")}
                </p>
              </div>
              <Button
                className="w-full h-10 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold text-sm rounded-lg"
                onClick={() => { setCheckoutRequestId(null); setCountdown(STK_TIMEOUT); initiatePayment.reset(); }}
              >
                <RefreshCw className="w-3.5 h-3.5 mr-2" />
                Try Again
              </Button>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
