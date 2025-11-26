'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function LogoutButton({ locale, label }: { locale: string; label: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleLogout = async () => {
    try {
      setSubmitting(true);
      await fetch('/api/v1/auth/logout', { method: 'POST' });
      router.push(`/${locale}/login`);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={submitting}
      className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
    >
      {label}
    </button>
  );
}
