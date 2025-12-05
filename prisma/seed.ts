import { prisma, Role, ServiceType, TicketStatus, Visibility, BillingStatus, Language } from '@portal/core-domain/prisma';
import { hashPassword } from '@portal/auth/password';
import { parseEnv } from '@portal/config/index';

async function main() {
  parseEnv();

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const clientEmail = process.env.SEED_CLIENT_EMAIL ?? 'client@example.com';
  const clientPassword = process.env.SEED_CLIENT_PASSWORD ?? 'Client123!';

  console.log('Seeding baseline data...');

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Admin',
      passwordHash: await hashPassword(adminPassword),
      roles: [Role.ADMIN, Role.SUPPORT, Role.BILLING],
      preferredLanguage: Language.hu
    }
  });

  const client = await prisma.user.upsert({
    where: { email: clientEmail },
    update: {},
    create: {
      email: clientEmail,
      name: 'Client',
      passwordHash: await hashPassword(clientPassword),
      roles: [Role.CLIENT],
      preferredLanguage: Language.hu
    }
  });

  let serviceTemplate = await prisma.service.findFirst({ where: { clientId: null, title: 'Alap támogatás' } });
  if (!serviceTemplate) {
    serviceTemplate = await prisma.service.create({
      data: {
        title: 'Alap támogatás',
        description: 'Alapszintű havi támogatási csomag',
        type: ServiceType.MONTHLY,
        price: 50000,
        metadata: { responseSLAHours: 8 }
      }
    });
  }

  let clientService = await prisma.service.findFirst({ where: { clientId: client.id, title: serviceTemplate.title } });
  if (!clientService) {
    clientService = await prisma.service.create({
      data: {
        title: serviceTemplate.title,
        description: serviceTemplate.description,
        type: serviceTemplate.type,
        price: serviceTemplate.price,
        clientId: client.id,
        metadata: serviceTemplate.metadata
      }
    });
  }

  const wiki = await prisma.wikiArticle.findFirst({ where: { title: 'Kezdés' } });
  if (!wiki) {
    await prisma.wikiArticle.create({
      data: {
        title: 'Kezdés',
        contentMarkdown: '# Üdvözöljük a portálon\nItt találja a szolgáltatások és támogatás részleteit.',
        visibility: Visibility.CLIENT_ONLY,
        language: Language.hu
      }
    });
  }

  const serviceWiki = await prisma.wikiArticle.findFirst({
    where: { title: 'Szolgáltatás részletei', serviceId: clientService.id }
  });
  if (!serviceWiki) {
    await prisma.wikiArticle.create({
      data: {
        title: 'Szolgáltatás részletei',
        contentMarkdown: '## Csomag tartalma\n- Havi támogatás\n- 8 órás válaszidő',
        visibility: Visibility.CLIENT_ONLY,
        language: Language.hu,
        serviceId: clientService.id
      }
    });
  }

  const ticket = await prisma.ticket.findFirst({
    where: { title: 'Első lépések segítség', createdById: client.id }
  });
  if (!ticket) {
    await prisma.ticket.create({
      data: {
        title: 'Első lépések segítség',
        description: 'Kérem segítsenek beállítani az első szolgáltatást.',
        createdById: client.id,
        assignedToId: admin.id,
        status: TicketStatus.OPEN,
        priority: 1,
        serviceId: clientService.id,
        messages: {
          create: {
            authorId: client.id,
            content: 'Milyen dokumentumokra lesz szükség a kezdéshez?'
          }
        }
      }
    });
  }

  const billing = await prisma.billingRequest.findFirst({
    where: { clientId: client.id, status: BillingStatus.PENDING }
  });
  if (!billing) {
    await prisma.billingRequest.create({
      data: {
        clientId: client.id,
        serviceId: clientService.id,
        amount: 50000,
        currency: 'HUF',
        status: BillingStatus.PENDING,
        notes: 'Minta pro forma a kezdéshez'
      }
    });
  }

  console.log('Seed complete. Default credentials:');
  console.log(`Admin: ${adminEmail} / ${adminPassword}`);
  console.log(`Client: ${clientEmail} / ${clientPassword}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
