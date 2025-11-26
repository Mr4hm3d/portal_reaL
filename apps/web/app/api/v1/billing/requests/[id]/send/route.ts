import { NextResponse } from 'next/server';

import { requireCurrentUser, requireRole } from '@auth';
import { type Role } from '@core-domain/prisma';
import { sendBillingRequest } from '@billing';

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

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const authError = await enforceBillingStaff();
  if (authError) return authError;

  try {
    const user = await requireCurrentUser();
    const billingRequest = await sendBillingRequest(user, params.id);
    return NextResponse.json({ billingRequest });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (code === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (code === 'BAD_CONFIG') {
      return NextResponse.json({ error: 'Email configuration missing' }, { status: 500 });
    }
    return NextResponse.json({ error: 'Unable to send billing request' }, { status: 500 });
  }
}
