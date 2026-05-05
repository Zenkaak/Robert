import { useState, useEffect } from "react";
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
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useInitiatePayment, useGetPaymentStatus, getGetPaymentStatusQueryKey } from "@workspace/api-client-react";
import type { Offer } from "@workspace/api-client-react/src/generated/api.schemas";
import { Loader2, CheckCircle2, XCircle, Wifi, Phone, MessageSquare, Zap } from "lucide-react";

interface PaymentModalProps {
  offer: Offer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  phone: z.string().regex(
    /^(07\d{8}|254\d{9})$/,
    "Enter a valid M-Pesa number e.g. 0712345678"
  ),
});

const categoryIcon = {
  data: Wifi,
  data_multiple: Zap,
  minutes: Phone,
  sms: MessageSquare,
};

export function PaymentModal({ offer, open, onOpenChange }: PaymentModalProps) {
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);

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
    if (!open) {
      const t = setTimeout(() => {
        setCheckoutRequestId(null);
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
  const isFailed = paymentStatus?.status === "failed" || isStatusError;

  const Icon = categoryIcon[offer.category] ?? Wifi;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm bg-card border-border/60 text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
              <Icon className="w-3.5 h-3.5 text-primary" />
            </div>
            Buy {offer.name}
          </DialogTitle>
        </DialogHeader>

        {/* Offer summary */}
        {!checkoutRequestId && (
          <div className="bg-background rounded-lg border border-border/50 p-3 space-y-1.5 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-black text-primary text-base">Ksh {offer.price}</span>
            </div>
            {offer.data && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Data</span>
                <span className="font-medium">{offer.data}</span>
              </div>
            )}
            {offer.minutes && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Minutes</span>
                <span className="font-medium">{offer.minutes}</span>
              </div>
            )}
            {offer.sms && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">SMS</span>
                <span className="font-medium">{offer.sms}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Validity</span>
              <span className="font-medium">{offer.validity}</span>
            </div>
            {offer.category === "data" && !offer.multipleAllowed && (
              <div className="mt-1 pt-1.5 border-t border-border/40">
                <span className="text-[11px] text-orange-400 font-semibold">
                  This bundle can only be purchased once per day
                </span>
              </div>
            )}
            {offer.multipleAllowed && (
              <div className="mt-1 pt-1.5 border-t border-border/40">
                <span className="text-[11px] text-primary font-semibold">
                  You can purchase this bundle multiple times
                </span>
              </div>
            )}
          </div>
        )}

        {/* Form */}
        {!checkoutRequestId ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground text-xs">M-Pesa Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0712 345 678"
                        {...field}
                        type="tel"
                        disabled={initiatePayment.isPending}
                        className="bg-background border-border/60 focus:border-primary text-foreground placeholder:text-muted-foreground"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {form.formState.errors.root && (
                <p className="text-destructive text-xs font-medium bg-destructive/10 px-3 py-2 rounded-md">
                  {form.formState.errors.root.message}
                </p>
              )}

              <Button
                type="submit"
                className="w-full font-bold bg-primary hover:bg-primary/90 text-white"
                disabled={initiatePayment.isPending}
              >
                {initiatePayment.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending prompt...</>
                ) : (
                  `Pay Ksh ${offer.price} via M-Pesa`
                )}
              </Button>
            </form>
          </Form>
        ) : (
          <div className="py-6 flex flex-col items-center text-center space-y-4">
            {isPolling && (
              <>
                <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <Loader2 className="h-7 w-7 text-primary animate-spin" />
                </div>
                <div>
                  <p className="font-bold text-foreground">Check your phone</p>
                  <p className="text-muted-foreground text-xs mt-1 max-w-[220px] mx-auto">
                    An M-Pesa prompt has been sent. Enter your PIN to complete.
                  </p>
                </div>
              </>
            )}

            {isSuccess && (
              <>
                <div className="w-14 h-14 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center">
                  <CheckCircle2 className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-primary">Payment Successful</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Your {offer.name} bundle is now active.
                  </p>
                </div>
                <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold" onClick={() => onOpenChange(false)}>
                  Done
                </Button>
              </>
            )}

            {isFailed && (
              <>
                <div className="w-14 h-14 rounded-full bg-destructive/15 border border-destructive/40 flex items-center justify-center">
                  <XCircle className="h-7 w-7 text-destructive" />
                </div>
                <div>
                  <p className="font-bold text-destructive">Payment Failed</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    {paymentStatus?.resultDesc ?? "The transaction was not completed."}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full border-border/60 text-foreground hover:bg-accent"
                  onClick={() => setCheckoutRequestId(null)}
                >
                  Try Again
                </Button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
