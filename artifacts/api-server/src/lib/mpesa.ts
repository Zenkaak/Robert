import { logger } from "./logger";

const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY!;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET!;
const PASSKEY = process.env.MPESA_PASSKEY!;
const TILL_NUMBER = process.env.MPESA_TILL_NUMBER!;
const SHORTCODE = process.env.MPESA_SHORTCODE!;

const MPESA_BASE_URL = "https://api.safaricom.co.ke";

export interface StkPushResult {
  success: boolean;
  message: string;
  checkoutRequestId?: string;
  merchantRequestId?: string;
}

async function getAccessToken(): Promise<string> {
  const credentials = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString("base64");
  const response = await fetch(
    `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    logger.error({ status: response.status, body: text }, "Failed to get M-Pesa access token");
    throw new Error("Failed to get M-Pesa access token");
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

function getTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  );
}

function getPassword(timestamp: string): string {
  const raw = `${SHORTCODE}${PASSKEY}${timestamp}`;
  return Buffer.from(raw).toString("base64");
}

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) return "254" + cleaned.slice(1);
  if (cleaned.startsWith("254")) return cleaned;
  if (cleaned.startsWith("7") || cleaned.startsWith("1")) return "254" + cleaned;
  return cleaned;
}

const callbackUrl = (() => {
  const domains = process.env.REPLIT_DOMAINS;
  if (domains) {
    const domain = domains.split(",")[0]?.trim();
    return `https://${domain}/api/payments/callback`;
  }
  return "https://example.com/api/payments/callback";
})();

export async function initiateStkPush(
  phone: string,
  amount: number,
  offerName: string,
  checkoutRequestId?: string
): Promise<StkPushResult> {
  try {
    const token = await getAccessToken();
    const timestamp = getTimestamp();
    const password = getPassword(timestamp);
    const formattedPhone = formatPhone(phone);

    const payload = {
      BusinessShortCode: SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerBuyGoodsOnline",
      Amount: Math.ceil(amount),
      PartyA: formattedPhone,
      PartyB: TILL_NUMBER,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: "BingwaSokoni",
      TransactionDesc: offerName,
    };

    const response = await fetch(`${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as {
      ResponseCode?: string;
      ResponseDescription?: string;
      MerchantRequestID?: string;
      CheckoutRequestID?: string;
      CustomerMessage?: string;
      errorCode?: string;
      errorMessage?: string;
    };

    logger.info({ data }, "M-Pesa STK push response");

    if (data.ResponseCode === "0") {
      return {
        success: true,
        message: data.CustomerMessage ?? "STK push sent successfully",
        checkoutRequestId: data.CheckoutRequestID,
        merchantRequestId: data.MerchantRequestID,
      };
    }

    return {
      success: false,
      message: data.errorMessage ?? data.ResponseDescription ?? "STK push failed",
    };
  } catch (err) {
    logger.error({ err }, "M-Pesa STK push error");
    return {
      success: false,
      message: "Payment service error. Please try again.",
    };
  }
}
