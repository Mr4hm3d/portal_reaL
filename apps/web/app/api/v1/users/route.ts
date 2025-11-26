import { NextResponse } from 'next/server';

import { requireRole } from '@auth';
import { createUserSchema, createUser, listUsers } from '@users';

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

export async function GET() {
  const authError = await enforceAdmin();
  if (authError) return authError;

  const users = await listUsers();
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const authError = await enforceAdmin();
  if (authError) return authError;

  const payload = await request.json();
  const parsed = createUserSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
  }

  try {
    const user = await createUser(parsed.data);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    const message = (error as Error).message;
    const status = message === 'User already exists' ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
