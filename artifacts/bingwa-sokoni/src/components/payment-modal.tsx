import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  useInitiatePayment,
  useGetPaymentStatus,
  getGetPaymentStatusQueryKey,
} from "@workspace/api-client-react";
import type { Offer } from "@workspace/api-client-react/src/generated/api.schemas";
import { Loader2, CheckCircle2, XCircle, Wifi, Phone, MessageSquare, Zap, Shield, Clock, RefreshCw, User, Users, ArrowLeft } from "lucide-react";
import { addHistory, maskPhone } from "@/lib/history";

interface PaymentModalProps {
  offer: Offer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const phoneSchema = z
  .string()
  .regex(/^(07\d{8}|254\d{9}|7\d{8}|1\d{8})$/, "Enter a valid Safaricom number e.g. 0712 345 678");

const selfSchema = z.object({ buyFor: z.literal("self"), payerPhone: phoneSchema });
const otherSchema = z.object({ buyFor: z.literal("other"), payerPhone: phoneSchema, recipientPhone: phoneSchema });
const formSchema = z.discriminatedUnion("buyFor", [selfSchema, otherSchema]);
type FormValues = z.infer<typeof formSchema>;

const categoryIcon = { data: Wifi, data_multiple: Zap, minutes: Phone, sms: MessageSquare };
const categoryColor: Record<string, string> = {
  data: "#4ade80", data_multiple: "#60a5fa", minutes: "#c084fc", sms: "#fb923c",
};

const STK_TIMEOUT = 60;

function PhoneInput({ value, onChange, disabled, placeholder = "712 345 678" }: {
  value: string; onChange: (v: string) => void; disabled?: boolean; placeholder?: string;
}) {
  return (
    <div className="flex rounded-xl overflow-hidden border border-white/10 focus-within:border-green-500/50 transition-colors bg-white/[0.03]">
      <div className="flex items-center gap-1.5 px-3 bg-white/[0.04] border-r border-white/10 shrink-0">
        <span className="text-base">🇰🇪</span>
        <span className="text-xs text-slate-400 font-mono">+254</span>
      </div>
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type="tel"
        inputMode="numeric"
        disabled={disabled}
        className="border-0 bg-transparent text-white placeholder:text-slate-600 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none h-11 text-sm"
      />
    </div>
  );
}

export function PaymentModal({ offer, open, onOpenChange }: PaymentModalProps) {
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [buyFor, setBuyFor] = useState<"self" | "other">("self");
  const [countdown, setCountdown] = useState(STK_TIMEOUT);
  const [savedPayer, setSavedPayer] = useState("");
  const [savedRecipient, setSavedRecipient] = useState("");
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { buyFor: "self", payerPhone: "" },
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
        setCountdown((c) => { if (c <= 1) { clearInterval(countdownRef.current!); return 0; } return c - 1; });
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
        setBuyFor("self");
        setSavedPayer(""); setSavedRecipient("");
        form.reset({ buyFor: "self", payerPhone: "" });
        initiatePayment.reset();
      }, 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Save to history when status resolves
  useEffect(() => {
    if (!checkoutRequestId || !paymentStatus || paymentStatus.status === "pending") return;
    if (paymentStatus.status === "success" || paymentStatus.status === "failed") {
      addHistory({
        checkoutRequestId,
        offerName: offer.name,
        amount: offer.price,
        validity: offer.validity,
        payerPhone: savedPayer || paymentStatus.phone || "",
        recipientPhone: savedRecipient || paymentStatus.recipientPhone || undefined,
        status: paymentStatus.status,
        purchasedAt: new Date().toISOString(),
      });
    }
  }, [paymentStatus?.status]);

  function switchBuyFor(mode: "self" | "other") {
    setBuyFor(mode);
    const currentPayer = form.getValues("payerPhone");
    if (mode === "self") form.reset({ buyFor: "self", payerPhone: currentPayer });
    else form.reset({ buyFor: "other", payerPhone: currentPayer, recipientPhone: "" });
  }

  function onSubmit(values: FormValues) {
    const recipientPhone = values.buyFor === "other" ? values.recipientPhone : undefined;
    setSavedPayer(values.payerPhone);
    setSavedRecipient(recipientPhone ?? "");
    initiatePayment.mutate(
      { data: { phone: values.payerPhone, offerId: offer.id, amount: offer.price, recipientPhone: recipientPhone ?? null } },
      {
        onSuccess: (data) => {
          if (data.success && data.checkoutRequestId) {
            setCheckoutRequestId(data.checkoutRequestId);
          } else {
            (form.setError as (name: string, err: { message: string }) => void)("root", { message: data.message ?? "Failed to initiate payment" });
          }
        },
        onError: (err: unknown) => {
          const message = err instanceof Error ? err.message : "Something went wrong";
          (form.setError as (name: string, err: { message: string }) => void)("root", { message });
        },
      }
    );
  }

  const isPolling = !!checkoutRequestId && paymentStatus?.status === "pending";
  const isSuccess = paymentStatus?.status === "success";
  const isFailed = paymentStatus?.status === "failed" || isStatusError || (!!checkoutRequestId && countdown === 0 && !isSuccess);

  const Icon = categoryIcon[offer.category] ?? Wifi;
  const color = categoryColor[offer.category] ?? "#4ade80";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px] bg-[#0d1117] border border-white/10 text-white p-0 overflow-hidden gap-0">

        {/* Top bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{offer.name}</p>
            <p className="text-[11px] text-slate-500">
              {offer.validity}
              {offer.data ? ` · ${offer.data}` : ""}
              {offer.minutes ? ` · ${offer.minutes} mins` : ""}
              {offer.sms ? ` · ${offer.sms} SMS` : ""}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Amount</p>
            <p className="text-lg font-black text-white leading-tight">
              <span className="text-xs font-bold text-slate-400 mr-0.5">KSH</span>{offer.price}
            </p>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">

          {/* ── FORM ── */}
          {!checkoutRequestId && (
            <>
              {/* Toggle */}
              <div className="flex rounded-xl overflow-hidden border border-white/10 bg-white/[0.02] p-1 gap-1">
                {(["self", "other"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => switchBuyFor(mode)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                      buyFor === mode ? "bg-white/10 text-white shadow" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {mode === "self" ? <><User className="w-3.5 h-3.5" />Buy for Myself</> : <><Users className="w-3.5 h-3.5" />Buy for Someone</>}
                  </button>
                ))}
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">

                  {buyFor === "other" && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] text-slate-400 font-medium">Recipient's Number</p>
                      <p className="text-[10px] text-slate-600">Bundle will be activated on this number</p>
                      <FormField control={form.control} name="recipientPhone" render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <PhoneInput value={field.value ?? ""} onChange={field.onChange} disabled={initiatePayment.isPending} />
                          </FormControl>
                          <FormMessage className="text-xs text-red-400" />
                        </FormItem>
                      )} />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <p className="text-[11px] text-slate-400 font-medium">
                      {buyFor === "other" ? "Your M-Pesa Number (Payer)" : "Your M-Pesa Number"}
                    </p>
                    {buyFor === "other" && (
                      <p className="text-[10px] text-slate-600">You'll receive the STK push to pay</p>
                    )}
                    <FormField control={form.control} name="payerPhone" render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <PhoneInput value={field.value} onChange={field.onChange} disabled={initiatePayment.isPending} />
                        </FormControl>
                        <FormMessage className="text-xs text-red-400" />
                      </FormItem>
                    )} />
                  </div>

                  {(form.formState.errors as Record<string, { message?: string }>)["root"] && (
                    <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 px-3 py-2.5 rounded-lg">
                      <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-red-400 text-xs">
                        {(form.formState.errors as Record<string, { message?: string }>)["root"]?.message}
                      </p>
                    </div>
                  )}

                  {offer.category === "data" && !offer.multipleAllowed && (
                    <p className="text-[11px] text-orange-400 font-medium bg-orange-500/8 border border-orange-500/15 px-3 py-2 rounded-lg">
                      ⚠ Once per day per number
                    </p>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 font-black text-sm rounded-xl text-white"
                    style={{ background: "#4bb543" }}
                    disabled={initiatePayment.isPending}
                  >
                    {initiatePayment.isPending
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending STK Push...</>
                      : `Pay KSH ${offer.price} via M-Pesa`}
                  </Button>

                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-600">
                    <Shield className="w-3 h-3" />
                    <span>Secured by Safaricom M-Pesa</span>
                  </div>
                </form>
              </Form>
            </>
          )}

          {/* ── AWAITING ── */}
          {checkoutRequestId && (isPolling || (!isSuccess && !isFailed)) && (
            <div className="py-6 flex flex-col items-center text-center space-y-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "#4bb54318", border: "1px solid #4bb54330" }}>
                  <Loader2 className="h-9 w-9 animate-spin" style={{ color: "#4bb543" }} />
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#0d1117] border border-white/15 flex items-center justify-center">
                  <span className="text-[10px] font-black text-slate-300">{countdown}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="font-black text-white text-base">Check your phone!</p>
                <p className="text-slate-500 text-xs leading-relaxed max-w-[210px] mx-auto">
                  M-Pesa prompt sent to <span className="font-mono text-slate-300">{maskPhone(savedPayer)}</span>. Enter your PIN to pay.
                </p>
              </div>
              <div className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] divide-y divide-white/[0.05]">
                <div className="flex justify-between items-center px-4 py-2.5">
                  <span className="text-xs text-slate-500">Bundle</span>
                  <span className="text-xs font-bold text-white">{offer.name}</span>
                </div>
                <div className="flex justify-between items-center px-4 py-2.5">
                  <span className="text-xs text-slate-500">Amount</span>
                  <span className="text-xs font-black text-white">KSH {offer.price}</span>
                </div>
                {savedRecipient && (
                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-xs text-slate-500">Recipient</span>
                    <span className="text-xs font-mono font-bold text-white">{maskPhone(savedRecipient)}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                <Clock className="w-3 h-3" />
                <span>Prompt expires in {countdown}s</span>
              </div>
            </div>
          )}

          {/* ── SUCCESS ── */}
          {isSuccess && (
            <div className="py-4 flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "#22c55e18", border: "1px solid #22c55e30" }}>
                <CheckCircle2 className="h-10 w-10 text-green-400" />
              </div>
              <div>
                <p className="font-black text-green-400 text-lg">Payment Successful!</p>
                <p className="text-slate-500 text-xs mt-1">Your bundle is being activated</p>
              </div>
              <div className="w-full rounded-xl border border-green-500/15 bg-green-500/5 divide-y divide-green-500/10 text-left">
                <div className="px-4 py-2 border-b border-green-500/10">
                  <p className="text-[10px] text-green-500 uppercase tracking-widest font-bold">Receipt</p>
                </div>
                <div className="flex justify-between items-center px-4 py-2.5">
                  <span className="text-xs text-slate-500">Bundle</span>
                  <span className="text-xs font-bold text-white">{offer.name}</span>
                </div>
                <div className="flex justify-between items-center px-4 py-2.5">
                  <span className="text-xs text-slate-500">Amount Paid</span>
                  <span className="text-xs font-black text-green-400">KSH {offer.price}</span>
                </div>
                <div className="flex justify-between items-center px-4 py-2.5">
                  <span className="text-xs text-slate-500">Paid from</span>
                  <span className="text-xs font-mono font-bold text-white">{maskPhone(savedPayer)}</span>
                </div>
                {savedRecipient && (
                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-xs text-slate-500">Sent to</span>
                    <span className="text-xs font-mono font-bold text-white">{maskPhone(savedRecipient)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center px-4 py-2.5">
                  <span className="text-xs text-slate-500">Validity</span>
                  <span className="text-xs font-bold text-white">{offer.validity}</span>
                </div>
              </div>
              <Button
                className="w-full h-11 font-bold text-sm rounded-xl text-green-400 border border-green-500/20"
                style={{ background: "#22c55e12" }}
                onClick={() => onOpenChange(false)}
              >
                Done
              </Button>
            </div>
          )}

          {/* ── FAILED ── */}
          {isFailed && !isSuccess && (
            <div className="py-4 flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "#ef444418", border: "1px solid #ef444430" }}>
                <XCircle className="h-10 w-10 text-red-400" />
              </div>
              <div>
                <p className="font-black text-red-400 text-lg">Payment Failed</p>
                <p className="text-slate-500 text-xs mt-1.5 leading-relaxed max-w-[210px] mx-auto">
                  {countdown === 0 && !paymentStatus?.resultDesc
                    ? "The M-Pesa prompt expired. Please try again."
                    : (paymentStatus?.resultDesc ?? "The transaction was not completed.")}
                </p>
              </div>
              <div className="flex w-full gap-2">
                <Button className="flex-1 h-11 font-bold text-sm rounded-xl border border-white/10 text-slate-400"
                  style={{ background: "#ffffff08" }} onClick={() => onOpenChange(false)}>
                  <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back
                </Button>
                <Button className="flex-1 h-11 font-bold text-sm rounded-xl text-white"
                  style={{ background: "#4bb543" }}
                  onClick={() => { setCheckoutRequestId(null); setCountdown(STK_TIMEOUT); initiatePayment.reset(); }}>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Try Again
                </Button>
              </div>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
