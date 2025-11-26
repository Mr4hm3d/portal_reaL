import { NextResponse } from 'next/server';

import { requireCurrentUser, requireRole } from '@auth';
import { type Role } from '@core-domain/prisma';
import { getBillingRequestById, updateBillingRequest, updateBillingRequestSchema } from '@billing';

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

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireCurrentUser();
    const billingRequest = await getBillingRequestById(user, params.id);

    if (!billingRequest) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ billingRequest });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    const status = code === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ error: 'Unable to fetch billing request' }, { status });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const authError = await enforceBillingStaff();
  if (authError) return authError;

  const payload = await request.json();
  const parsed = updateBillingRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
  }

  try {
    const user = await requireCurrentUser();
    const billingRequest = await updateBillingRequest(user, params.id, parsed.data);
    return NextResponse.json({ billingRequest });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (code === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Unable to update billing request' }, { status: 500 });
  }
}
