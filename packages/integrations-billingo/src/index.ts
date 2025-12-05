export interface BillingoConfig {
  apiKey: string;
  apiUrl?: string;
}

export interface BillingoCustomerInput {
  name: string;
  email?: string;
  countryCode?: string;
  city?: string;
  address?: string;
  postalCode?: string;
  taxNumber?: string;
}

export interface BillingoInvoiceItem {
  name: string;
  unitPrice: number;
  quantity: number;
  unit?: string;
  vat?: string;
}

export interface CreateInvoiceInput {
  customerId: number;
  currency: string;
  language: 'hu' | 'en';
  dueDate: string;
  items: BillingoInvoiceItem[];
  fulfillmentDate?: string;
  invoiceDate?: string;
  paymentMethod?: string;
  comment?: string;
}

interface BillingoInvoiceResponse {
  id: number;
}

interface BillingoCustomerResponse {
  id: number;
}

const DEFAULT_API_URL = 'https://api.billingo.hu/v3';

async function billingoRequest<T>(config: BillingoConfig, path: string, init?: RequestInit): Promise<T> {
  const url = `${config.apiUrl ?? DEFAULT_API_URL}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': config.apiKey,
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const body = await response.text();
    const error = new Error(`Billingo API error: ${response.status} ${body}`);
    (error as NodeJS.ErrnoException).code = 'BILLINGO_API_ERROR';
    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function findCustomerByEmail(config: BillingoConfig, email: string): Promise<BillingoCustomerResponse | null> {
  if (!email) return null;
  const query = new URLSearchParams({ search: email, page: '1', per_page: '1' }).toString();
  const result = await billingoRequest<{ data: BillingoCustomerResponse[] }>(config, `/customers?${query}`);
  return result.data[0] ?? null;
}

export async function createCustomer(config: BillingoConfig, input: BillingoCustomerInput): Promise<BillingoCustomerResponse> {
  const payload = {
    name: input.name,
    emails: input.email ? [input.email] : [],
    billing_address: {
      country_code: input.countryCode ?? 'HU',
      city: input.city ?? 'Budapest',
      street_name: input.address ?? 'Unknown',
      postal_code: input.postalCode ?? '0000'
    },
    taxcode: input.taxNumber ?? null,
    type: 'private'
  };

  return billingoRequest(config, '/customers', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function ensureCustomer(config: BillingoConfig, input: BillingoCustomerInput): Promise<BillingoCustomerResponse> {
  if (input.email) {
    const existing = await findCustomerByEmail(config, input.email);
    if (existing) return existing;
  }

  return createCustomer(config, input);
}

export async function createInvoice(config: BillingoConfig, input: CreateInvoiceInput): Promise<BillingoInvoiceResponse> {
  const payload = {
    customer_id: input.customerId,
    currency: input.currency,
    language: input.language,
    due_date: input.dueDate,
    payment_method: input.paymentMethod ?? 'bankcard',
    invoice_date: input.invoiceDate ?? input.dueDate,
    fulfillment_date: input.fulfillmentDate ?? input.dueDate,
    comment: input.comment,
    items: input.items.map((item) => ({
      name: item.name,
      unit_price: item.unitPrice,
      quantity: item.quantity,
      unit: item.unit ?? 'db',
      vat: item.vat ?? '0%'
    }))
  };

  return billingoRequest(config, '/invoices', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function downloadInvoicePdf(config: BillingoConfig, invoiceId: number): Promise<ArrayBuffer> {
  const url = `${config.apiUrl ?? DEFAULT_API_URL}/invoices/${invoiceId}/documents/pdf`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-API-KEY': config.apiKey
    }
  });

  if (!response.ok) {
    const body = await response.text();
    const error = new Error(`Billingo PDF download failed: ${response.status} ${body}`);
    (error as NodeJS.ErrnoException).code = 'BILLINGO_API_ERROR';
    throw error;
  }

  return response.arrayBuffer();
}
