import { redirect } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { getCurrentUser } from '@auth';
import { listServices } from '@services/service';
import { listUsers } from '@users/service';
import { ServiceAssignForm } from '@/components/service-assign-form';
import { ServiceTemplateForm } from '@/components/service-template-form';

export default async function ServicesPage({ params }: { params: { locale: string } }) {
  const t = useTranslations('services');
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${params.locale}/login`);
  }

  const services = await listServices(user, {});
  const isAdmin = user.roles.includes('ADMIN');
  const clients = isAdmin ? await listUsers() : [];

  const templates = services.filter((service) => !service.client);
  const assigned = services.filter((service) => service.client);
  const templateOptions = templates.map((service) => ({ id: service.id, title: service.title }));

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm text-slate-600">{t('intro')}</p>
        <h1 className="text-2xl font-semibold text-slate-900">{t('title')}</h1>
      </div>

      {isAdmin ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-inner">
            <p className="text-sm font-semibold text-slate-900">{t('form.titleLabel')}</p>
            <p className="text-sm text-slate-700">{t('form.descriptionLabel')}</p>
            <ServiceTemplateForm locale={params.locale} />
          </div>

          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-inner">
            <p className="text-sm font-semibold text-slate-900">{t('assign.title')}</p>
            <p className="text-sm text-slate-700">{t('assign.description')}</p>
            <ServiceAssignForm templates={templateOptions} clients={clients} locale={params.locale} />
          </div>
        </div>
      ) : null}

      {isAdmin ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">{t('templates')}</h2>
            <p className="text-sm text-slate-600">{t('templateHint')}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {templates.length === 0 ? (
              <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">{t('templateEmpty')}</p>
            ) : (
              templates.map((service) => (
                <div key={service.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">{service.type}</p>
                      <h2 className="text-lg font-semibold text-slate-900">{service.title}</h2>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{service.price?.toString()} HUF</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">{service.description}</p>
                  {service.metadata ? (
                    <pre className="mt-3 overflow-auto rounded-md bg-slate-50 p-3 text-xs text-slate-700">
                      {JSON.stringify(service.metadata, null, 2)}
                    </pre>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{t(isAdmin ? 'assignments' : 'title')}</h2>
          <p className="text-sm text-slate-600">{t('assignmentHint')}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {assigned.length === 0 ? (
            <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">{t('assignedEmpty')}</p>
          ) : (
            assigned.map((service) => (
              <div key={service.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">{service.type}</p>
                    <h2 className="text-lg font-semibold text-slate-900">{service.title}</h2>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{service.price?.toString()} HUF</span>
                </div>
                <p className="mt-2 text-sm text-slate-700">{service.description}</p>
                {service.client ? (
                  <p className="mt-2 text-xs text-slate-600">
                    {t('assignedTo', { name: service.client.name || service.client.email })}
                  </p>
                ) : null}
                {service.metadata ? (
                  <pre className="mt-3 overflow-auto rounded-md bg-slate-50 p-3 text-xs text-slate-700">
                    {JSON.stringify(service.metadata, null, 2)}
                  </pre>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
