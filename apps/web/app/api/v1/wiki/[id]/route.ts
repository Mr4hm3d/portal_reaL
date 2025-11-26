import { NextResponse } from 'next/server';

import { requireCurrentUser } from '@portal/auth';
import { getWikiArticle, updateArticleSchema, updateWikiArticle } from '@portal/wiki';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireCurrentUser();
    const article = await getWikiArticle(user, params.id);

    if (!article) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ article });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    const status = code === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ error: 'Unable to fetch article' }, { status });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireCurrentUser();
    const payload = await request.json();
    const parsed = updateArticleSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
    }

    const article = await updateWikiArticle(user, params.id, parsed.data);
    return NextResponse.json({ article });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if ((error as Error).message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if ((error as Error & { code?: string }).code === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Unable to update article' }, { status: 500 });
  }
}
