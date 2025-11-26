import { NextResponse } from 'next/server';

import { requireCurrentUser } from '@auth';
import { createArticleSchema, createWikiArticle, listWikiArticles, wikiFilterSchema } from '@wiki';

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser();
    const { searchParams } = new URL(request.url);
    const parsed = wikiFilterSchema.safeParse({
      serviceId: searchParams.get('serviceId') ?? undefined,
      visibility: searchParams.get('visibility') ?? undefined,
      language: searchParams.get('language') ?? undefined
    });

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid filters', details: parsed.error.format() }, { status: 400 });
    }

    const articles = await listWikiArticles(user, parsed.data);
    return NextResponse.json({ articles });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    const status = code === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ error: 'Unable to fetch wiki articles' }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const payload = await request.json();
    const parsed = createArticleSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
    }

    const article = await createWikiArticle(user, parsed.data);
    return NextResponse.json({ article }, { status: 201 });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if ((error as Error).message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Unable to create wiki article' }, { status: 500 });
  }
}
