import { NextResponse } from 'next/server';

import { requireRole } from '@auth';
import { getUserById, updateUser, updateUserSchema } from '@users';

type RouteParams = { params: { id: string } };

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

export async function GET(_request: Request, { params }: RouteParams) {
  const authError = await enforceAdmin();
  if (authError) return authError;

  const user = await getUserById(params.id);
  if (!user) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const authError = await enforceAdmin();
  if (authError) return authError;

  const payload = await request.json();
  const parsed = updateUserSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
  }

  try {
    const user = await updateUser(params.id, parsed.data);
    return NextResponse.json({ user });
  } catch (error) {
    const message = (error as Error).message;
    const status = message === 'User not found' ? 404 : message === 'Email already in use' ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
