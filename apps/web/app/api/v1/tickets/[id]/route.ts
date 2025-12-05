import { NextResponse } from 'next/server';

import { requireCurrentUser, requireRole } from '@portal/auth';
import { updateTicket, updateTicketSchema, getTicketById } from '@portal/tickets';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireCurrentUser();
    const ticket = await getTicketById(user, params.id);
    if (!ticket) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ ticket });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    const status = code === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ error: 'Unable to fetch ticket' }, { status });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireRole(['ADMIN', 'SUPPORT']);
    const payload = await request.json();
    const parsed = updateTicketSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
    }

    const ticket = await updateTicket(await requireCurrentUser(), params.id, parsed.data);
    return NextResponse.json({ ticket });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (code === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if ((error as Error).message === 'Not found') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ error: 'Unable to update ticket' }, { status: 500 });
  }
}
