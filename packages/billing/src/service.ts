import {
  BillingStatus,
  PaymentProvider,
  PaymentStatus,
  Prisma,
  prisma,
  type Role
} from '@portal/core-domain/prisma';

import { type CurrentUser } from '@portal/auth/current-user';
import { parseEnv } from '@portal/config/index';
import { renderBillingRequestEmail, sendEmail } from '@portal/email/index';
import { enqueueEmail } from '@portal/jobs/index';
import { startPayment, verifySignature, type BarionWebhookPayload } from '@portal/payments-barion/index';
import { persistProFormaPdf, toProFormaContext } from './pdf';

import {
  type BillingRequestFilterInput,
  type CreateBillingRequestInput,
  type StartPaymentInput,
  type UpdateBillingRequestInput
} from './schemas';
import {
  createInvoice,
  downloadInvoicePdf,
  ensureCustomer,
  type BillingoConfig
} from '@portal/integrations-billingo/index';
import fs from 'node:fs/promises';
import path from 'node:path';

function isBillingStaff(user: CurrentUser) {
  return user.roles.includes('ADMIN' as Role) || user.roles.includes('BILLING' as Role);
}

function requireBillingoConfig(): BillingoConfig {
  const env = parseEnv();
  if (!env.BILLINGO_API_KEY) {
    const err = new Error('Billingo API key missing');
    (err as NodeJS.ErrnoException).code = 'BAD_CONFIG';
    throw err;
  }

  return {
    apiKey: env.BILLINGO_API_KEY,
    apiUrl: env.BILLINGO_API_URL
  } satisfies BillingoConfig;
}

function formatDate(value?: Date | null) {
  if (!value) return new Date().toISOString().slice(0, 10);
  return value.toISOString().slice(0, 10);
}

const billingRequestSelect = {
  id: true,
  amount: true,
  currency: true,
  status: true,
  pdfRelativePath: true,
  billingoInvoiceId: true,
  invoicePdfRelativePath: true,
  dueDate: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  client: { select: { id: true, email: true, name: true, preferredLanguage: true } },
  service: { select: { id: true, title: true } }
} satisfies Prisma.BillingRequestSelect;

async function requireBillingRequest(
  currentUser: CurrentUser,
  id: string,
  select: Prisma.BillingRequestSelect = billingRequestSelect
) {
  const where: Prisma.BillingRequestWhereInput = { id };

  if (!isBillingStaff(currentUser)) {
    where.clientId = currentUser.id;
  }

  const billingRequest = await prisma.billingRequest.findFirst({ where, select });

  if (!billingRequest) {
    const err = new Error('Not found');
    (err as NodeJS.ErrnoException).code = 'NOT_FOUND';
    throw err;
  }

  return billingRequest;
}

export async function listBillingRequests(currentUser: CurrentUser, filters: BillingRequestFilterInput) {
  const where: Prisma.BillingRequestWhereInput = {};

  if (!isBillingStaff(currentUser)) {
    where.clientId = currentUser.id;
  } else {
    if (filters.clientId) where.clientId = filters.clientId;
  }

  if (filters.serviceId) where.serviceId = filters.serviceId;
  if (filters.status) where.status = filters.status;

  return prisma.billingRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: billingRequestSelect
  });
}

export async function createBillingRequest(currentUser: CurrentUser, input: CreateBillingRequestInput) {
  if (!isBillingStaff(currentUser)) {
    const err = new Error('Forbidden');
    (err as NodeJS.ErrnoException).code = 'FORBIDDEN';
    throw err;
  }

  if (input.serviceId) {
    const service = await prisma.service.findUnique({
      where: { id: input.serviceId },
      select: { clientId: true }
    });

    if (!service) {
      const err = new Error('Service not found');
      (err as NodeJS.ErrnoException).code = 'NOT_FOUND';
      throw err;
    }

    if (service.clientId && service.clientId !== input.clientId) {
      const err = new Error('Service does not belong to client');
      (err as NodeJS.ErrnoException).code = 'FORBIDDEN';
      throw err;
    }
  }

  return prisma.billingRequest.create({
    data: {
      clientId: input.clientId,
      serviceId: input.serviceId,
      amount: input.amount,
      currency: input.currency ?? 'HUF',
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      notes: input.notes,
      status: BillingStatus.PENDING
    },
    select: billingRequestSelect
  });
}

export async function getBillingRequestById(currentUser: CurrentUser, id: string) {
  return requireBillingRequest(currentUser, id);
}

export async function updateBillingRequest(
  currentUser: CurrentUser,
  id: string,
  input: UpdateBillingRequestInput
) {
  if (!isBillingStaff(currentUser)) {
    const err = new Error('Forbidden');
    (err as NodeJS.ErrnoException).code = 'FORBIDDEN';
    throw err;
  }

  try {
    return await prisma.billingRequest.update({
      where: { id },
      data: {
        status: input.status,
        pdfRelativePath: input.pdfRelativePath,
        billingoInvoiceId: input.billingoInvoiceId,
        invoicePdfRelativePath: input.invoicePdfRelativePath,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        notes: input.notes
      },
      select: billingRequestSelect
    });
  } catch (error) {
    const err = error as Error & { code?: string };
    if (err.code === 'P2025') {
      const notFound = new Error('Not found');
      (notFound as NodeJS.ErrnoException).code = 'NOT_FOUND';
      throw notFound;
    }
    throw error;
  }
}

export async function startBillingRequestPayment(
  currentUser: CurrentUser,
  id: string,
  input: StartPaymentInput,
  baseUrl: string
) {
  const billingRequest = await requireBillingRequest(currentUser, id, {
    ...billingRequestSelect,
    amount: true,
    currency: true,
    client: { select: { id: true, email: true, name: true } }
  });

  if (billingRequest.status === BillingStatus.PAID) {
    const err = new Error('Already paid');
    (err as NodeJS.ErrnoException).code = 'CONFLICT';
    throw err;
  }

  const env = parseEnv();

  if (!env.BARION_POSKEY) {
    const err = new Error('Barion POS key missing');
    (err as NodeJS.ErrnoException).code = 'BAD_CONFIG';
    throw err;
  }

  const { paymentId, redirectUrl, raw } = await startPayment(
    {
      posKey: env.BARION_POSKEY ?? '',
      apiUrl: process.env.BARION_API_URL,
      payee: process.env.BARION_PAYEE ?? billingRequest.client.email,
      webhookSecret: process.env.BARION_WEBHOOK_SECRET
    },
    {
      billingRequestId: billingRequest.id,
      amount: Number(billingRequest.amount),
      currency: billingRequest.currency,
      locale: (input.locale as 'hu-HU' | 'en-US') ?? 'hu-HU',
      redirectUrl: input.successUrl ?? `${baseUrl}/billing/success`,
      failureUrl: input.failureUrl ?? `${baseUrl}/billing/failure`,
      callbackUrl: `${baseUrl}/api/v1/webhooks/barion`,
      customerEmail: input.customerEmail ?? billingRequest.client.email
    }
  );

  await prisma.paymentTransaction.create({
    data: {
      provider: PaymentProvider.BARION,
      providerPaymentId: paymentId,
      status: PaymentStatus.PENDING,
      amount: billingRequest.amount,
      currency: billingRequest.currency,
      billingRequestId: billingRequest.id,
      rawResponse: raw as Prisma.JsonValue
    }
  });

  await prisma.billingRequest.update({
    where: { id: billingRequest.id },
    data: { status: BillingStatus.SENT }
  });

  return { redirectUrl, paymentId };
}

export async function sendBillingRequest(currentUser: CurrentUser, id: string) {
  if (!isBillingStaff(currentUser)) {
    const err = new Error('Forbidden');
    (err as NodeJS.ErrnoException).code = 'FORBIDDEN';
    throw err;
  }

  const billingRequest = await requireBillingRequest(currentUser, id, {
    ...billingRequestSelect,
    createdAt: true,
    amount: true,
    currency: true,
    dueDate: true
  });

  const relativePath =
    billingRequest.pdfRelativePath ?? path.posix.join('billing', 'proforma', `${billingRequest.id}.pdf`);

  const { buffer } = await persistProFormaPdf(toProFormaContext(billingRequest), relativePath);

  const language = billingRequest.client.preferredLanguage === 'en' ? 'en' : 'hu';
  const env = parseEnv();
  const emailCopy = renderBillingRequestEmail(
    language,
    env.BRANDING_NAME,
    `${Number(billingRequest.amount).toFixed(2)} ${billingRequest.currency}`,
    billingRequest.dueDate ? billingRequest.dueDate.toISOString().slice(0, 10) : undefined
  );

  try {
    await enqueueEmail({
      to: billingRequest.client.email,
      subject: emailCopy.subject,
      text: emailCopy.text,
      attachments: [
        {
          filename: `pro-forma-${billingRequest.id}.pdf`,
          content: buffer,
          contentType: 'application/pdf'
        }
      ]
    });
  } catch (err) {
    await sendEmail({
      to: billingRequest.client.email,
      subject: emailCopy.subject,
      text: emailCopy.text,
      attachments: [
        {
          filename: `pro-forma-${billingRequest.id}.pdf`,
          content: buffer,
          contentType: 'application/pdf'
        }
      ]
    });
  }

  return prisma.billingRequest.update({
    where: { id: billingRequest.id },
    data: { status: BillingStatus.SENT, pdfRelativePath: relativePath },
    select: billingRequestSelect
  });
}

function mapBarionStatusToPayment(status: string): PaymentStatus {
  switch (status) {
    case 'Succeeded':
    case 'Authorized':
      return PaymentStatus.SUCCESS;
    case 'Prepared':
    case 'Started':
    case 'InProgress':
      return PaymentStatus.PENDING;
    default:
      return PaymentStatus.FAILED;
  }
}

export async function handleBarionWebhook(rawBody: string, signature: string | null) {
  if (!verifySignature(process.env.BARION_WEBHOOK_SECRET, rawBody, signature ?? undefined)) {
    const err = new Error('Invalid signature');
    (err as NodeJS.ErrnoException).code = 'UNAUTHORIZED';
    throw err;
  }

  const payload = JSON.parse(rawBody) as BarionWebhookPayload;

  const transaction = await prisma.paymentTransaction.findUnique({
    where: { provider_providerPaymentId: { provider: PaymentProvider.BARION, providerPaymentId: payload.PaymentId } }
  });

  if (!transaction) {
    const err = new Error('Payment not found');
    (err as NodeJS.ErrnoException).code = 'NOT_FOUND';
    throw err;
  }

  const mappedStatus = mapBarionStatusToPayment(payload.Status);

  await prisma.paymentTransaction.update({
    where: { id: transaction.id },
    data: { status: mappedStatus, rawWebhook: payload as Prisma.JsonValue }
  });

  if (mappedStatus === PaymentStatus.SUCCESS) {
    await prisma.billingRequest.update({
      where: { id: transaction.billingRequestId },
      data: { status: BillingStatus.PAID }
    });
  }

  return { billingRequestId: transaction.billingRequestId, status: mappedStatus };
}

export async function resolveInvoiceFile(currentUser: CurrentUser, billingoInvoiceId: string) {
  const where: Prisma.BillingRequestWhereInput = { billingoInvoiceId };

  if (!isBillingStaff(currentUser)) {
    where.clientId = currentUser.id;
  }

  const billingRequest = await prisma.billingRequest.findFirst({
    where,
    select: billingRequestSelect
  });

  if (!billingRequest || !billingRequest.invoicePdfRelativePath) {
    const err = new Error('Invoice not found');
    (err as NodeJS.ErrnoException).code = 'NOT_FOUND';
    throw err;
  }

  const env = parseEnv();
  const absolutePath = path.join(env.FILE_STORAGE_ROOT, billingRequest.invoicePdfRelativePath);

  return { billingRequest, absolutePath };
}

export async function createBillingoInvoiceForRequest(currentUser: CurrentUser, billingRequestId: string) {
  if (!isBillingStaff(currentUser)) {
    const err = new Error('Forbidden');
    (err as NodeJS.ErrnoException).code = 'FORBIDDEN';
    throw err;
  }

  const billingRequest = await requireBillingRequest(currentUser, billingRequestId, billingRequestSelect);

  if (billingRequest.status !== BillingStatus.PAID) {
    const err = new Error('Billing request not paid');
    (err as NodeJS.ErrnoException).code = 'CONFLICT';
    throw err;
  }

  if (billingRequest.billingoInvoiceId) {
    const err = new Error('Invoice already created');
    (err as NodeJS.ErrnoException).code = 'CONFLICT';
    throw err;
  }

  const config = requireBillingoConfig();
  const customer = await ensureCustomer(config, {
    name: billingRequest.client.name,
    email: billingRequest.client.email
  });

  const invoice = await createInvoice(config, {
    customerId: customer.id,
    currency: billingRequest.currency,
    language: billingRequest.client.preferredLanguage === 'en' ? 'en' : 'hu',
    dueDate: formatDate(billingRequest.dueDate ?? new Date()),
    items: [
      {
        name: billingRequest.service?.title ?? 'Szolgáltatás',
        unitPrice: Number(billingRequest.amount),
        quantity: 1,
        vat: '0%'
      }
    ],
    comment: billingRequest.notes ?? undefined
  });

  const pdfBuffer = await downloadInvoicePdf(config, invoice.id);
  const env = parseEnv();
  const relativePath = path.posix.join('billing', 'invoices', `${invoice.id}.pdf`);
  const absolutePath = path.join(env.FILE_STORAGE_ROOT, relativePath);

  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, Buffer.from(pdfBuffer));

  return prisma.billingRequest.update({
    where: { id: billingRequest.id },
    data: {
      billingoInvoiceId: String(invoice.id),
      invoicePdfRelativePath: relativePath
    },
    select: billingRequestSelect
  });
}
