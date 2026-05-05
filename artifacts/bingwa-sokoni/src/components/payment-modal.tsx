import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useInitiatePayment, useGetPaymentStatus } from "@workspace/api-client-react";
import type { Offer } from "@workspace/api-client-react/src/generated/api.schemas";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { getGetPaymentStatusQueryKey } from "@workspace/api-client-react";

interface PaymentModalProps {
  offer: Offer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  phone: z.string().regex(/^(07\d{8}|254\d{9})$/, "Enter a valid Safaricom number (e.g. 0712345678 or 254712345678)"),
});

export function PaymentModal({ offer, open, onOpenChange }: PaymentModalProps) {
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: "",
    },
  });

  const initiatePayment = useInitiatePayment();
  
  const { data: paymentStatus, isError: isStatusError } = useGetPaymentStatus(
    checkoutRequestId || "", 
    { 
      query: { 
        enabled: !!checkoutRequestId, 
        queryKey: getGetPaymentStatusQueryKey(checkoutRequestId || ""),
        refetchInterval: (query) => {
          // Stop polling if status is success or failed, or if there's no checkout ID
          const status = query.state.data?.status;
          if (!checkoutRequestId || status === "success" || status === "failed") {
            return false;
          }
          return 3000;
        }
      } 
    }
  );

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setCheckoutRequestId(null);
        form.reset();
        initiatePayment.reset();
      }, 200); // Wait for exit animation
    }
  }, [open, form, initiatePayment]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    initiatePayment.mutate({
      data: {
        phone: values.phone,
        offerId: offer.id,
        amount: offer.price,
      }
    }, {
      onSuccess: (data) => {
        if (data.success && data.checkoutRequestId) {
          setCheckoutRequestId(data.checkoutRequestId);
        } else {
          form.setError("root", { message: data.message || "Failed to initiate payment" });
        }
      },
      onError: (error: any) => {
        form.setError("root", { message: error?.message || "Something went wrong" });
      }
    });
  }

  const isPolling = checkoutRequestId && paymentStatus?.status === "pending";
  const isSuccess = paymentStatus?.status === "success";
  const isFailed = paymentStatus?.status === "failed" || isStatusError;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Buy {offer.name}</DialogTitle>
          <DialogDescription>
            Pay <span className="font-bold text-foreground">Ksh {offer.price}</span> via M-Pesa.
          </DialogDescription>
        </DialogHeader>

        {!checkoutRequestId && (
          <div className="bg-muted p-4 rounded-lg my-2 border border-border">
            <h4 className="font-semibold text-sm mb-2 text-foreground">Offer Details</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              {offer.data && <li>• {offer.data} Data</li>}
              {offer.minutes && <li>• {offer.minutes} Minutes</li>}
              {offer.sms && <li>• {offer.sms} SMS</li>}
              <li>• Valid for {offer.validity}</li>
              {offer.category === "data" && !offer.multipleAllowed && (
                <li className="text-orange-600 font-medium">• Available once per day</li>
              )}
            </ul>
          </div>
        )}

        {!checkoutRequestId ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>M-Pesa Phone Number</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="07XX XXX XXX" 
                        {...field} 
                        className="text-lg py-6"
                        type="tel"
                        disabled={initiatePayment.isPending}
                        data-testid="input-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {form.formState.errors.root && (
                <div className="text-destructive text-sm font-medium p-2 bg-destructive/10 rounded">
                  {form.formState.errors.root.message}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full py-6 text-lg font-bold" 
                disabled={initiatePayment.isPending}
                data-testid="button-submit-payment"
              >
                {initiatePayment.isPending ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
                ) : (
                  `Pay Ksh ${offer.price}`
                )}
              </Button>
            </form>
          </Form>
        ) : (
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
            {isPolling && (
              <>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-lg">Check your phone</h3>
                  <p className="text-muted-foreground text-sm max-w-[250px] mx-auto">
                    We've sent an M-Pesa prompt to your phone. Enter your PIN to complete the purchase.
                  </p>
                </div>
              </>
            )}

            {isSuccess && (
              <>
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-green-700">Payment Successful!</h3>
                  <p className="text-muted-foreground text-sm">
                    Your {offer.name} bundle has been activated.
                  </p>
                </div>
                <Button className="w-full mt-4" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </>
            )}

            {isFailed && (
              <>
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-destructive">Payment Failed</h3>
                  <p className="text-muted-foreground text-sm">
                    {paymentStatus?.resultDesc || "The transaction was not completed."}
                  </p>
                </div>
                <Button variant="outline" className="w-full mt-4" onClick={() => setCheckoutRequestId(null)}>
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
