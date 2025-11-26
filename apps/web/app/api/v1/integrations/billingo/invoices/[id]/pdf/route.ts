import fs from 'node:fs/promises';
import { NextResponse } from 'next/server';

import { requireCurrentUser } from '@auth';
import { resolveInvoiceFile } from '@billing';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireCurrentUser();
    const { absolutePath } = await resolveInvoiceFile(user, params.id);
    const file = await fs.readFile(absolutePath);

    return new NextResponse(file, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${params.id}.pdf"`
      }
    });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    if (code === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Unable to fetch invoice' }, { status: 500 });
  }
}
