import { NextResponse } from 'next/server';

import { requireCurrentUser } from '@auth';
import { TicketStatus } from '@core-domain/prisma';
import { createTicket, createTicketSchema, listTickets, ticketFilterSchema } from '@tickets';

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser();
    const { searchParams } = new URL(request.url);
    const priorityParam = searchParams.get('priority');
    const priority = priorityParam ? Number(priorityParam) : undefined;
    const parsedFilters = ticketFilterSchema.safeParse({
      status: searchParams.get('status') as TicketStatus | null,
      serviceId: searchParams.get('serviceId') ?? undefined,
      clientId: searchParams.get('clientId') ?? undefined,
      priority: Number.isFinite(priority) ? priority : undefined
    });

    if (!parsedFilters.success) {
      return NextResponse.json({ error: 'Invalid filters', details: parsedFilters.error.format() }, { status: 400 });
    }

    const tickets = await listTickets(user, parsedFilters.data);
    return NextResponse.json({ tickets });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    const status = code === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ error: 'Unable to fetch tickets' }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const payload = await request.json();
    const parsed = createTicketSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
    }

    const ticket = await createTicket(user, parsed.data);
    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if ((error as Error).message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Unable to create ticket' }, { status: 500 });
  }
}
