'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';

export function TicketReplyForm({ submitMessage }: { submitMessage: (content: string) => Promise<void> }) {
  const t = useTranslations('tickets');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError(null);

    try {
      await submitMessage(content);
      setContent('');
    } catch (err) {
      console.error(err);
      setError(t('errorGeneric'));
    } finally {
      setSending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      aria-label={t('replyForm')}
    >
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-900" htmlFor="message">
          {t('replyLabel')}
        </label>
        <textarea
          id="message"
          name="message"
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none"
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={sending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-70"
        >
          {sending ? t('sending') : t('send')}
        </button>
        <p className="text-xs text-slate-600">{t('replyHint')}</p>
      </div>
    </form>
  );
}
