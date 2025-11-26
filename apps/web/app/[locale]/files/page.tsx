import { redirect } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { getCurrentUser } from '@portal/auth';
import { listFiles } from '@portal/files';
import { listServices } from '@portal/services/service';
import { listTickets } from '@portal/tickets/service';

import { FileUploadForm } from '@/components/file-upload-form';

function formatBytes(bytes: number) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[exponent]}`;
}

export default async function FilesPage({ params }: { params: { locale: string } }) {
  const t = useTranslations('files');
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${params.locale}/login`);
  }

  const [files, tickets, services] = await Promise.all([
    listFiles(user, {}),
    listTickets(user, {}),
    listServices(user, {})
  ]);

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm text-slate-600">{t('intro')}</p>
        <h1 className="text-2xl font-semibold text-slate-900">{t('title')}</h1>
      </div>

      <FileUploadForm
        locale={params.locale}
        tickets={tickets.map((ticket) => ({ id: ticket.id, label: ticket.title }))}
        services={services.map((service) => ({ id: service.id, label: service.title }))}
      />

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-900">{t('table.filename')}</th>
              <th className="px-4 py-3 font-semibold text-slate-900">{t('table.visibility')}</th>
              <th className="px-4 py-3 font-semibold text-slate-900">{t('table.links')}</th>
              <th className="px-4 py-3 font-semibold text-slate-900">{t('table.size')}</th>
              <th className="px-4 py-3 font-semibold text-slate-900">{t('table.created')}</th>
              <th className="px-4 py-3 font-semibold text-slate-900">{t('table.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {files.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-600">
                  {t('empty')}
                </td>
              </tr>
            ) : (
              files.map((file) => (
                <tr key={file.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-900">{file.filename}</td>
                  <td className="px-4 py-3 text-slate-700">{t(`visibility.${file.visibility}` as const)}</td>
                  <td className="px-4 py-3 text-slate-700">
                    <div className="flex flex-col gap-1 text-xs text-slate-700">
                      {file.ticketId ? (
                        <Link
                          href={`/${params.locale}/tickets/${file.ticketId}`}
                          className="font-medium text-slate-900 underline-offset-2 hover:underline"
                        >
                          {t('table.ticketLink')}
                        </Link>
                      ) : null}
                      {file.serviceId ? (
                        <Link
                          href={`/${params.locale}/services`}
                          className="font-medium text-slate-900 underline-offset-2 hover:underline"
                        >
                          {t('table.serviceLink')}
                        </Link>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{formatBytes(Number(file.size))}</td>
                  <td className="px-4 py-3 text-slate-700">{new Date(file.createdAt).toLocaleString(params.locale)}</td>
                  <td className="px-4 py-3">
                    <a
                      href={`/api/v1/files/${file.id}`}
                      className="text-sm font-medium text-slate-900 underline-offset-2 hover:underline"
                    >
                      {t('table.download')}
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
