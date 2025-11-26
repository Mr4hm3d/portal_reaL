import { NextResponse } from 'next/server';

import { requireCurrentUser, requireRole } from '@auth';
import { type Role } from '@core-domain/prisma';
import { createBillingoInvoiceForRequest, createInvoiceSchema } from '@billing';

export async function POST(request: Request) {
  try {
    await requireRole(['ADMIN' as Role, 'BILLING' as Role]);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    const status = code === 'UNAUTHORIZED' ? 401 : 403;
    return NextResponse.json({ error: 'Unauthorized' }, { status });
  }

  const payload = await request.json();
  const parsed = createInvoiceSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
  }

  try {
    const user = await requireCurrentUser();
    const billingRequest = await createBillingoInvoiceForRequest(user, parsed.data.billingRequestId);
    return NextResponse.json({ billingRequest });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'CONFLICT') {
      return NextResponse.json({ error: (error as Error).message }, { status: 409 });
    }
    if (code === 'BAD_CONFIG') {
      return NextResponse.json({ error: 'Billingo configuration missing' }, { status: 500 });
    }
    if (code === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Billing request not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Unable to create invoice' }, { status: 500 });
  }
}
