import { randomUUID } from 'node:crypto'

export function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char])
}

export function isValidRecipient(value) {
  const recipient = String(value || '').trim()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient) && !/[\r\n]/.test(recipient)
}

function mimeBase64(value) {
  return Buffer.from(value, 'utf8').toString('base64').replace(/.{1,76}/g, '$&\r\n').trim()
}

export function resolveActionUrl(destination, appUrl = 'https://www.maratoneiapp.com.br') {
  const safePath = typeof destination === 'string' &&
    destination.startsWith('/') &&
    !destination.startsWith('//') &&
    !destination.includes(String.fromCharCode(92))
    ? destination
    : '/'

  try {
    const base = new URL(appUrl)
    const actionUrl = new URL(safePath, base.origin)
    return actionUrl.origin === base.origin ? actionUrl : new URL('/', base.origin)
  } catch {
    return new URL('https://maratoneiapp.com.br/')
  }
}

export function buildRawEmail({ from, to, subject, text, html, headers = {} }) {
  const boundary = 'maratonei_' + randomUUID()
  const encodedSubject = Buffer.from(subject, 'utf8').toString('base64')
  const parts = [
    'From: Maratonei App <' + from + '>',
    'To: ' + to,
    'Subject: =?UTF-8?B?' + encodedSubject + '?=',
    'MIME-Version: 1.0',
    ...Object.entries(headers).filter(([name, value]) => /^[A-Za-z0-9-]+$/.test(name) && !/[\r\n]/.test(String(value))).map(([name, value]) => name + ': ' + value),
    'Content-Type: multipart/alternative; boundary="' + boundary + '"',
    '',
    '--' + boundary,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    mimeBase64(text),
    '',
    '--' + boundary,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    mimeBase64(html),
    '',
    '--' + boundary + '--',
    ''
  ].join('\r\n')
  return Buffer.from(parts, 'utf8').toString('base64url')
}
