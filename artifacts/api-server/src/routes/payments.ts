import { Router, type IRouter } from "express";
import { initiateStkPush } from "../lib/mpesa.js";
import { InitiatePaymentBody, GetPaymentStatusParams } from "@workspace/api-zod";
import { OFFERS } from "./offers.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

interface PaymentRecord {
  checkoutRequestId: string;
  status: "pending" | "success" | "failed";
  resultCode?: string;
  resultDesc?: string;
  amount?: number;
  phone?: string;
  recipientPhone?: string;
  offerName?: string;
  createdAt: string;
}

const paymentStore = new Map<string, PaymentRecord>();

const allOffers = [
  ...OFFERS.data,
  ...OFFERS.minutes,
  ...OFFERS.sms,
  ...OFFERS.data_multiple,
];

router.post("/payments/stkpush", async (req, res): Promise<void> => {
  const parsed = InitiatePaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const { phone, offerId, amount, recipientPhone } = parsed.data;
  const offer = allOffers.find((o) => o.id === offerId);

  if (!offer) {
    res.status(400).json({ error: "not_found", message: "Offer not found" });
    return;
  }

  req.log.info({ phone, recipientPhone, offerId, amount }, "Initiating M-Pesa STK push");

  const desc = recipientPhone ? `${offer.name} for ${recipientPhone}` : offer.name;
  const result = await initiateStkPush(phone, amount, desc);

  if (result.success && result.checkoutRequestId) {
    paymentStore.set(result.checkoutRequestId, {
      checkoutRequestId: result.checkoutRequestId,
      status: "pending",
      amount,
      phone,
      recipientPhone: recipientPhone ?? undefined,
      offerName: offer.name,
      createdAt: new Date().toISOString(),
    });
  }

  res.json({
    success: result.success,
    message: result.message,
    checkoutRequestId: result.checkoutRequestId ?? null,
    merchantRequestId: result.merchantRequestId ?? null,
  });
});

router.post("/payments/callback", async (req, res): Promise<void> => {
  const body = req.body as {
    Body?: {
      stkCallback?: {
        CheckoutRequestID?: string;
        ResultCode?: number;
        ResultDesc?: string;
        CallbackMetadata?: {
          Item?: Array<{ Name: string; Value?: unknown }>;
        };
      };
    };
  };

  const callback = body?.Body?.stkCallback;
  if (!callback) {
    res.json({ ResultCode: 0, ResultDesc: "Accepted" });
    return;
  }

  const checkoutRequestId = callback.CheckoutRequestID;
  const resultCode = callback.ResultCode?.toString() ?? "";
  const resultDesc = callback.ResultDesc ?? "";

  logger.info({ checkoutRequestId, resultCode, resultDesc }, "M-Pesa callback received");

  if (checkoutRequestId) {
    const existing = paymentStore.get(checkoutRequestId);
    paymentStore.set(checkoutRequestId, {
      checkoutRequestId,
      status: resultCode === "0" ? "success" : "failed",
      resultCode,
      resultDesc,
      amount: existing?.amount,
      phone: existing?.phone,
      offerName: existing?.offerName,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    });
  }

  res.json({ ResultCode: 0, ResultDesc: "Accepted" });
});

router.get("/payments/status/:checkoutRequestId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.checkoutRequestId)
    ? req.params.checkoutRequestId[0]
    : req.params.checkoutRequestId;

  const params = GetPaymentStatusParams.safeParse({ checkoutRequestId: raw });
  if (!params.success) {
    res.status(400).json({ error: "validation_error", message: params.error.message });
    return;
  }

  const record = paymentStore.get(params.data.checkoutRequestId);
  if (!record) {
    res.status(404).json({ error: "not_found", message: "Payment not found" });
    return;
  }

  res.json({
    checkoutRequestId: record.checkoutRequestId,
    status: record.status,
    resultCode: record.resultCode ?? null,
    resultDesc: record.resultDesc ?? null,
    amount: record.amount ?? null,
    phone: record.phone ?? null,
    recipientPhone: record.recipientPhone ?? null,
    offerName: record.offerName ?? null,
    createdAt: record.createdAt ?? null,
  });
});

export default router;
