import fs from 'node:fs/promises';

import { NextResponse } from 'next/server';

import { requireCurrentUser } from '@auth';
import { deleteFile, getFilePathForDownload } from '@files';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireCurrentUser();
    const { file, absolutePath } = await getFilePathForDownload(user, params.id);
    const buffer = await fs.readFile(absolutePath);
    const response = new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': file.mimeType,
        'Content-Disposition': `attachment; filename="${file.filename}"`
      }
    });

    return response;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (code === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (code === 'NOT_FOUND') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ error: 'Unable to download file' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireCurrentUser();
    await deleteFile(user, params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (code === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (code === 'NOT_FOUND') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ error: 'Unable to delete file' }, { status: 500 });
  }
}
