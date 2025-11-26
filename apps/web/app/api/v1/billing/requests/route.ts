import { NextResponse } from 'next/server';

import { requireCurrentUser, requireRole } from '@auth';
import { BillingStatus, type Role } from '@core-domain/prisma';
import {
  billingRequestFilterSchema,
  createBillingRequest,
  createBillingRequestSchema,
  listBillingRequests
} from '@billing';

async function enforceBillingStaff() {
  try {
    await requireRole(['ADMIN' as Role, 'BILLING' as Role]);
    return null;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    const status = code === 'UNAUTHORIZED' ? 401 : 403;
    return NextResponse.json({ error: 'Unauthorized' }, { status });
  }
}

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser();
    const { searchParams } = new URL(request.url);
    const parsedFilters = billingRequestFilterSchema.safeParse({
      clientId: searchParams.get('clientId') ?? undefined,
      serviceId: searchParams.get('serviceId') ?? undefined,
      status: (searchParams.get('status') as BillingStatus | null) ?? undefined
    });

    if (!parsedFilters.success) {
      return NextResponse.json({ error: 'Invalid filters', details: parsedFilters.error.format() }, { status: 400 });
    }

    const billingRequests = await listBillingRequests(user, parsedFilters.data);
    return NextResponse.json({ billingRequests });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    const status = code === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ error: 'Unable to fetch billing requests' }, { status });
  }
}

export async function POST(request: Request) {
  const authError = await enforceBillingStaff();
  if (authError) return authError;

  const payload = await request.json();
  const parsed = createBillingRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
  }

  try {
    const user = await requireCurrentUser();
    const billingRequest = await createBillingRequest(user, parsed.data);
    return NextResponse.json({ billingRequest }, { status: 201 });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }
    if (code === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Unable to create billing request' }, { status: 500 });
  }
}
