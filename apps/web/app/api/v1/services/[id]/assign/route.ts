import { NextResponse } from 'next/server';

import { requireCurrentUser, requireRole } from '@portal/auth';
import { assignServiceSchema, assignServiceToClient } from '@portal/services';

async function enforceAdmin() {
  try {
    await requireRole(['ADMIN']);
    return null;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    const status = code === 'UNAUTHORIZED' ? 401 : 403;
    return NextResponse.json({ error: 'Unauthorized' }, { status });
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const authError = await enforceAdmin();
  if (authError) return authError;

  const payload = await request.json();
  const parsed = assignServiceSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
  }

  try {
    const user = await requireCurrentUser();
    const service = await assignServiceToClient(user, params.id, parsed.data);
    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    const message = (error as Error).message;
    const code = (error as NodeJS.ErrnoException).code;

    if (code === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (code === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (message === 'Not found') return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ error: 'Unable to assign service' }, { status: 500 });
  }
}
