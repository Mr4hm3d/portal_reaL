import fs from 'node:fs/promises';
import path from 'node:path';

import PDFDocument from 'pdfkit';

import { parseEnv } from '@config/index';

import { type Prisma } from '@core-domain/prisma';

export interface ProFormaContext {
  id: string;
  createdAt: Date;
  amount: number;
  currency: string;
  dueDate?: Date | null;
  notes?: string | null;
  client: { name: string; email: string };
  service?: { title: string | null } | null;
}

function formatDate(date?: Date | null) {
  if (!date) return '—';
  return new Date(date).toISOString().slice(0, 10);
}

export async function renderProFormaPdf(context: ProFormaContext, brandName: string) {
  const doc = new PDFDocument({ margin: 50 });
  const chunks: Buffer[] = [];

  doc.on('data', (chunk) => chunks.push(chunk));

  doc.fontSize(20).text(`${brandName} — Díjbekérő / Pro Forma Invoice`, { align: 'center' });
  doc.moveDown();

  doc.fontSize(12).text(`Kelt / Issued: ${formatDate(context.createdAt)}`);
  doc.text(`Fizetési határidő / Due date: ${formatDate(context.dueDate)}`);
  doc.moveDown();

  doc.text(`Ügyfél / Client: ${context.client.name} <${context.client.email}>`);
  if (context.service?.title) {
    doc.text(`Szolgáltatás / Service: ${context.service.title}`);
  }
  doc.moveDown();

  doc.fontSize(14).text(`Összeg / Amount: ${context.amount.toFixed(2)} ${context.currency}`);
  doc.moveDown();

  doc.fontSize(12).text('Megjegyzés / Notes:');
  doc.fontSize(11).text(context.notes ?? '—');

  doc.moveDown();
  doc.fontSize(10).text(
    'Ez egy díjbekérő, nem minősül számlának. / This is a pro forma payment request, not a tax invoice.',
    { align: 'left' }
  );

  doc.end();

  await new Promise<void>((resolve, reject) => {
    doc.on('end', () => resolve());
    doc.on('error', (err) => reject(err));
  });

  return Buffer.concat(chunks);
}

export async function persistProFormaPdf(context: ProFormaContext, relativePath: string) {
  const env = parseEnv();
  const brandName = env.BRANDING_NAME;
  const pdfBuffer = await renderProFormaPdf(context, brandName);

  const absolutePath = path.join(env.FILE_STORAGE_ROOT, relativePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, pdfBuffer);

  return { buffer: pdfBuffer, absolutePath };
}

export function toProFormaContext(billingRequest: Prisma.BillingRequestGetPayload<{ select: any }>): ProFormaContext {
  return {
    id: billingRequest.id,
    createdAt: billingRequest.createdAt,
    amount: Number(billingRequest.amount),
    currency: billingRequest.currency,
    dueDate: billingRequest.dueDate,
    notes: billingRequest.notes,
    client: {
      name: billingRequest.client.name,
      email: billingRequest.client.email
    },
    service: billingRequest.service
      ? {
          title: billingRequest.service.title
        }
      : undefined
  } satisfies ProFormaContext;
}
