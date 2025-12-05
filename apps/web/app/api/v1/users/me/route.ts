import { NextResponse } from 'next/server';

import { getCurrentUser, updateProfile } from '@portal/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  try {
    const updated = await updateProfile(user.id, body);
    return NextResponse.json({ user: updated });
  } catch (error) {
    const err = error as Error & { code?: string };
    if (err.code === 'BAD_REQUEST') {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err.code === 'INVALID_PASSWORD') {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
