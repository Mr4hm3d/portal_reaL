import { NextResponse } from 'next/server';

import { requireCurrentUser } from '@auth';
import { fileFilterSchema, listFiles, saveUploadedFile, uploadFileMetadataSchema } from '@files';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser();
    const { searchParams } = new URL(request.url);
    const parsed = fileFilterSchema.safeParse({
      ticketId: searchParams.get('ticketId') ?? undefined,
      serviceId: searchParams.get('serviceId') ?? undefined
    });

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid filters', details: parsed.error.format() }, { status: 400 });
    }

    const files = await listFiles(user, parsed.data);
    return NextResponse.json({ files });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    const status = code === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ error: 'Unable to list files' }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    const parsedMeta = uploadFileMetadataSchema.safeParse({
      ticketId: formData.get('ticketId')?.toString() || undefined,
      serviceId: formData.get('serviceId')?.toString() || undefined,
      visibility: formData.get('visibility')?.toString() || undefined
    });

    if (!parsedMeta.success) {
      return NextResponse.json({ error: 'Invalid metadata', details: parsedMeta.error.format() }, { status: 400 });
    }

    const stored = await saveUploadedFile(user, file, parsedMeta.data);
    return NextResponse.json({ file: stored }, { status: 201 });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (code === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (code === 'NOT_FOUND') return NextResponse.json({ error: 'Related entity not found' }, { status: 404 });
    return NextResponse.json({ error: 'Unable to upload file' }, { status: 500 });
  }
}
