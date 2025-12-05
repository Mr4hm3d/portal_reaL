import { NextResponse } from 'next/server';

import { clearSessionCookie } from '@portal/auth';

export async function POST() {
  clearSessionCookie();
  return NextResponse.json({ success: true });
}
