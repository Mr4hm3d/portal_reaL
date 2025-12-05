import { NextResponse } from 'next/server';

import { requireCurrentUser } from '@portal/auth';
import { parseEnv } from '@portal/config/index';
import { startBillingRequestPayment, startPaymentSchema } from '@portal/billing';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const env = parseEnv();
  const payload = await request.json().catch(() => ({}));
  const parsed = startPaymentSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
  }

  try {
    const user = await requireCurrentUser();
    const { redirectUrl, paymentId } = await startBillingRequestPayment(
      user,
      params.id,
      parsed.data,
      env.APP_BASE_URL
    );

    return NextResponse.json({ redirectUrl, paymentId });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'NOT_FOUND') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (code === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (code === 'BAD_CONFIG') return NextResponse.json({ error: 'Payment not configured' }, { status: 500 });
    if (code === 'CONFLICT') return NextResponse.json({ error: 'Already paid' }, { status: 409 });

    return NextResponse.json({ error: 'Unable to start payment' }, { status: 500 });
  }
}
