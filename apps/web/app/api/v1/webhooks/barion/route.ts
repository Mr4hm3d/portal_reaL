import { NextResponse } from 'next/server';

import { handleBarionWebhook } from '@portal/billing';

export async function POST(request: Request) {
  const signature = request.headers.get('barion-signature');
  const rawBody = await request.text();

  try {
    const result = await handleBarionWebhook(rawBody, signature);
    return NextResponse.json({ ok: true, billingRequestId: result.billingRequestId, status: result.status });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (code === 'NOT_FOUND') return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

    return NextResponse.json({ error: 'Unhandled webhook' }, { status: 500 });
  }
}
