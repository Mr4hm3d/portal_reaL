import { NextResponse } from 'next/server';

import { requireCurrentUser, requireRole } from '@portal/auth';
import type { ServiceType } from '@portal/core-domain/prisma';
import {
  createServiceSchema,
  createServiceTemplate,
  listServices,
  serviceFilterSchema
} from '@portal/services';

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

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser();
    const { searchParams } = new URL(request.url);
    const parsedFilters = serviceFilterSchema.safeParse({
      clientId: searchParams.get('clientId') ?? undefined,
      type: (searchParams.get('type') as ServiceType | null) ?? undefined
    });

    if (!parsedFilters.success) {
      return NextResponse.json({ error: 'Invalid filters', details: parsedFilters.error.format() }, { status: 400 });
    }

    const services = await listServices(user, parsedFilters.data);
    return NextResponse.json({ services });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    const status = code === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ error: 'Unable to fetch services' }, { status });
  }
}

export async function POST(request: Request) {
  const authError = await enforceAdmin();
  if (authError) return authError;

  const payload = await request.json();
  const parsed = createServiceSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
  }

  const user = await requireCurrentUser();
  const service = await createServiceTemplate(user, parsed.data);
  return NextResponse.json({ service }, { status: 201 });
}
