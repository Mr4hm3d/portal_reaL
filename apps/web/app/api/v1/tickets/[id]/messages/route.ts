import { NextResponse } from 'next/server';

import { requireCurrentUser } from '@portal/auth';
import { addTicketMessage, listTicketMessages, ticketMessageSchema } from '@portal/tickets';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireCurrentUser();
    const messages = await listTicketMessages(user, params.id);
    return NextResponse.json({ messages });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if ((error as Error).message === 'Not found') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ error: 'Unable to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireCurrentUser();
    const payload = await request.json();
    const parsed = ticketMessageSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
    }

    const message = await addTicketMessage(user, params.id, parsed.data);
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if ((error as Error).message === 'Not found') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ error: 'Unable to post message' }, { status: 500 });
  }
}
