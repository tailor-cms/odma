import { fileURLToPath, URL } from 'node:url';
import path from 'node:path';
import pick from 'lodash/pick.js';
import { SMTPClient } from 'emailjs';
import urlJoin from 'url-join';
import { createLogger, Level } from '../../shared/logger.js';
import { renderHtml, renderText } from './render.js';
import { mail as config, origin } from '#config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logger = createLogger('mailer', { level: Level.DEBUG });

const from = `${config.sender.name} <${config.sender.address}>`;
const client = new SMTPClient(config);
// NOTE: Enable SMTP tracing if DEBUG is set.
client.smtp.debug(Number(Boolean(process.env.DEBUG)));
logger.info(getConfig(client), '📧  SMTP client created');

const send = async (...args) => {
  try {
    const msg = await client.sendAsync(...args);
    logger.debug('📧  Email sent', msg);
    return msg;
  } catch (error) {
    logger.error('📧  Failed to send email', error);
  }
};

const templatesDir = path.join(__dirname, './templates/');

const resetUrl = (token) =>
  urlJoin(origin, '/auth/reset-password/', token, '/');

export default {
  send,
  invite,
  resetPassword,
};

function invite(user, token) {
  const href = resetUrl(token);
  const { hostname } = new URL(href);
  const recipient = user.email;
  const recipientName = user.firstName || user.email;
  const data = { href, origin, hostname, recipientName };
  const html = renderHtml(path.join(templatesDir, 'welcome.mjml'), data);
  const text = renderText(path.join(templatesDir, 'welcome.txt'), data);
  logger.info(
    { recipient, sender: from },
    '📧  Sending invite email to:',
    recipient,
  );
  return send({
    from,
    to: recipient,
    subject: 'Invite',
    text,
    attachment: [{ data: html, alternative: true }],
  });
}

function resetPassword(user, token) {
  const href = resetUrl(token);
  const recipient = user.email;
  const recipientName = user.firstName || user.email;
  const data = { href, recipientName, origin };
  const html = renderHtml(path.join(templatesDir, 'reset.mjml'), data);
  const text = renderText(path.join(templatesDir, 'reset.txt'), data);
  logger.info(
    { recipient, sender: from },
    '📧  Sending reset password email to:',
    recipient,
  );
  return send({
    from,
    to: recipient,
    subject: 'Reset password',
    text,
    attachment: [{ data: html, alternative: true }],
  });
}

function getConfig(client) {
  // NOTE: List public keys:
  // https://github.com/eleith/emailjs/blob/7fddabe/smtp/smtp.js#L86
  return pick(client.smtp, [
    'host',
    'port',
    'domain',
    'authentication',
    'ssl',
    'tls',
    'timeout',
  ]);
}
