import nodemailer from 'nodemailer';

import { parseEnv } from '@portal/config/index';

export type EmailLanguage = 'hu' | 'en';

export interface SendEmailInput {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  language?: EmailLanguage;
  attachments?: Array<{ filename: string; content: Buffer; contentType?: string }>;
}

let transporter: nodemailer.Transporter | null = null;

function resolveFromAddress(env = parseEnv()) {
  const fallbackDomain = new URL(env.APP_BASE_URL).hostname;
  return env.SMTP_USER ?? `no-reply@${fallbackDomain}`;
}

function getTransporter(env = parseEnv()) {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: false,
      auth:
        env.SMTP_USER && env.SMTP_PASS
          ? {
              user: env.SMTP_USER,
              pass: env.SMTP_PASS
            }
          : undefined
    });
  }

  return transporter;
}

export async function sendEmail(payload: SendEmailInput) {
  const env = parseEnv();
  const mail = {
    from: `${env.BRANDING_NAME} <${resolveFromAddress(env)}>`,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
    attachments: payload.attachments
  } satisfies nodemailer.SendMailOptions;

  const transport = getTransporter(env);
  return transport.sendMail(mail);
}

export function renderBillingRequestEmail(
  language: EmailLanguage,
  brandName: string,
  amount: string,
  dueDate?: string
) {
  if (language === 'en') {
    return {
      subject: `${brandName} payment request`,
      text: `Hello,\n\nPlease find attached your pro forma payment request for ${amount}.\nDue date: ${dueDate ?? 'n/a'}.\n\nThank you,\n${brandName}`
    };
  }

  return {
    subject: `${brandName} díjbekérő`,
    text: `Szia!\n\nCsatolva találod a díjbekérőt: ${amount}.\nFizetési határidő: ${dueDate ?? 'nincs megadva'}.\n\nKöszönjük,\n${brandName}`
  };
}

export function renderPasswordResetEmail(language: EmailLanguage, brandName: string, resetLink: string) {
  if (language === 'en') {
    return {
      subject: `${brandName} password reset`,
      text: `Hello,\n\nA password reset was requested for your account. If this was you, please follow this link to set a new password: ${resetLink}\n\nIf you did not request this, you can ignore this message.\n\n${brandName}`
    };
  }

  return {
    subject: `${brandName} jelszó visszaállítás`,
    text: `Szia!\n\nJelszó visszaállítást kértek a fiókodhoz. Ha te voltál, kattints erre a hivatkozásra az új jelszó beállításához: ${resetLink}\n\nHa nem te kezdeményezted, kérjük hagyd figyelmen kívül.\n\n${brandName}`
  };
}

export function renderTicketCreatedEmail(
  language: EmailLanguage,
  brandName: string,
  ticketTitle: string,
  ticketLink: string
) {
  if (language === 'en') {
    return {
      subject: `${brandName} ticket created`,
      text: `Hello,\n\nA new ticket was created: "${ticketTitle}".\nYou can view it here: ${ticketLink}\n\n${brandName}`
    };
  }

  return {
    subject: `${brandName} új jegy létrehozva`,
    text: `Szia!\n\nÚj jegyet hoztunk létre: "${ticketTitle}".\nItt éred el: ${ticketLink}\n\n${brandName}`
  };
}

export function renderTicketReplyEmail(
  language: EmailLanguage,
  brandName: string,
  ticketTitle: string,
  authorName: string,
  ticketLink: string
) {
  if (language === 'en') {
    return {
      subject: `${brandName} ticket reply`,
      text: `Hello,\n\n${authorName} replied to ticket "${ticketTitle}".\nView the discussion: ${ticketLink}\n\n${brandName}`
    };
  }

  return {
    subject: `${brandName} válasz érkezett a jegyre`,
    text: `Szia!\n\n${authorName} válaszolt a(z) "${ticketTitle}" jegyre.\nA beszélgetést itt éred el: ${ticketLink}\n\n${brandName}`
  };
}

export function renderTicketStatusEmail(
  language: EmailLanguage,
  brandName: string,
  ticketTitle: string,
  newStatus: string,
  ticketLink: string
) {
  if (language === 'en') {
    return {
      subject: `${brandName} ticket update`,
      text: `Hello,\n\nThe ticket "${ticketTitle}" is now ${newStatus}.\nDetails: ${ticketLink}\n\n${brandName}`
    };
  }

  return {
    subject: `${brandName} jegy frissítve`,
    text: `Szia!\n\nA(z) "${ticketTitle}" jegy státusza megváltozott: ${newStatus}.\nRészletek: ${ticketLink}\n\n${brandName}`
  };
}
