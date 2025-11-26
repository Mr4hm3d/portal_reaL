import crypto from 'node:crypto';

export type BarionLocale = 'hu-HU' | 'en-US';

export interface BarionConfig {
  posKey: string;
  apiUrl?: string;
  payee: string;
  webhookSecret?: string;
}

export interface StartPaymentParams {
  billingRequestId: string;
  amount: number;
  currency: string;
  locale: BarionLocale;
  redirectUrl: string;
  callbackUrl: string;
  failureUrl?: string;
  customerEmail?: string;
}

export interface StartPaymentResult {
  paymentId: string;
  redirectUrl: string;
  raw: unknown;
}

function resolveApiUrl(input?: string) {
  return input ?? 'https://api.test.barion.com/v2';
}

export async function startPayment(config: BarionConfig, params: StartPaymentParams): Promise<StartPaymentResult> {
  const apiUrl = resolveApiUrl(config.apiUrl);

  const payload = {
    POSKey: config.posKey,
    PaymentType: 'Immediate',
    GuestCheckOut: true,
    FundingSources: ['All'],
    Locale: params.locale,
    Currency: params.currency,
    RedirectUrl: params.redirectUrl,
    CallbackUrl: params.callbackUrl,
    Transactions: [
      {
        POSTransactionId: params.billingRequestId,
        Payee: config.payee,
        Total: params.amount,
        Comment: `Billing request ${params.billingRequestId}`,
        Items: [
          {
            Name: `Billing request ${params.billingRequestId}`,
            Description: 'Portal billing payment',
            Quantity: 1,
            Unit: 'piece',
            UnitPrice: params.amount,
            ItemTotal: params.amount
          }
        ]
      }
    ],
    PayerHint: params.customerEmail
  };

  const response = await fetch(`${apiUrl}/Payment/Start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Barion start payment failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as {
    PaymentId: string;
    GatewayUrl: string;
  };

  return {
    paymentId: data.PaymentId,
    redirectUrl: data.GatewayUrl,
    raw: data
  };
}

export type BarionPaymentStatus =
  | 'Prepared'
  | 'Started'
  | 'InProgress'
  | 'Authorized'
  | 'Succeeded'
  | 'Canceled'
  | 'Failed'
  | 'Expired';

export interface BarionWebhookPayload {
  PaymentId: string;
  Status: BarionPaymentStatus;
  Transactions?: { POSTransactionId?: string }[];
}

export function verifySignature(secret: string | undefined, rawBody: string, signatureHeader?: string) {
  if (!secret) return false;
  if (!signatureHeader) return false;

  const signature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return signature === signatureHeader;
}
