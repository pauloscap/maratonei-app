import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

export const runtime = 'nodejs'

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char])
}

async function getGmailAccessToken() {
  const body = new URLSearchParams({
    client_id: process.env.GMAIL_CLIENT_ID,
    client_secret: process.env.GMAIL_CLIENT_SECRET,
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    grant_type: 'refresh_token'
  })
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })
  const data = await response.json()
  if (!response.ok || !data.access_token) {
    throw new Error(`Google OAuth token refresh failed (${response.status})`)
  }
  return data.access_token
}

function buildRawEmail({ from, to, subject, text, html }) {
  const boundary = `maratonei_${randomUUID()}`
  const encodedSubject = Buffer.from(subject, 'utf8').toString('base64')
  const parts = [
    `From: Maratonei App <${from}>`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${encodedSubject}?=`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    Buffer.from(text, 'utf8').toString('base64'),
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    Buffer.from(html, 'utf8').toString('base64'),
    '',
    `--${boundary}--`,
    ''
  ].join('\r\n')
  return Buffer.from(parts, 'utf8').toString('base64url')
}

export async function POST(request) {
  const secret = process.env.SUPABASE_EMAIL_WEBHOOK_SECRET
  const authorization = request.headers.get('authorization')
  if (!secret || authorization !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const gmailClientId = process.env.GMAIL_CLIENT_ID
  const gmailClientSecret = process.env.GMAIL_CLIENT_SECRET
  const gmailRefreshToken = process.env.GMAIL_REFRESH_TOKEN
  const fromEmail = 'contatomaratoneiapp@gmail.com'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://maratoneiapp.com.br'

  if (!supabaseUrl || !serviceRoleKey || !gmailClientId || !gmailClientSecret || !gmailRefreshToken) {
    return Response.json({ error: 'Email service is not configured' }, { status: 503 })
  }

  let event
  try {
    event = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const outboxId = event?.record?.id
  if (event?.type !== 'INSERT' || event?.table !== 'notification_email_outbox' || !outboxId) {
    return Response.json({ ignored: true })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
  const { data: item, error: readError } = await supabase
    .from('notification_email_outbox')
    .select('id, recipient_email, notification_type, payload, status, attempts')
    .eq('id', outboxId)
    .single()

  if (readError || !item) {
    return Response.json({ error: 'Outbox item not found' }, { status: 404 })
  }
  if (item.status !== 'pending') {
    return Response.json({ ignored: true, status: item.status })
  }

  const { data: claimed, error: claimError } = await supabase
    .from('notification_email_outbox')
    .update({ status: 'processing', attempts: item.attempts + 1 })
    .eq('id', outboxId)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle()

  if (claimError || !claimed) {
    return Response.json({ ignored: true, reason: 'Already claimed' })
  }

  const payload = item.payload || {}
  const destination = String(payload.destination || '/')
  const actionUrl = new URL(destination.startsWith('/') ? destination : '/', appUrl).toString()
  const subject = payload.subject || 'Você tem uma novidade no Maratonei'
  const message = payload.message || 'Acesse o Maratonei para conferir sua novidade.'
  const safeSubject = escapeHtml(subject)
  const safeMessage = escapeHtml(message)
  const safeActionUrl = escapeHtml(actionUrl)

  try {
    if (!item.recipient_email || /[\r\n]/.test(item.recipient_email)) {
      throw new Error('Invalid recipient email')
    }
    const accessToken = await getGmailAccessToken()
    const textBody = `${subject}\n\n${message}\n\nAcesse: ${actionUrl}\n\nVocê recebeu este e-mail porque ativou notificações por e-mail no Maratonei.`
    const htmlBody = `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#080B1F;color:#fff;font-family:Arial,sans-serif;padding:32px 16px"><main style="max-width:560px;margin:0 auto;background:#12182F;border:1px solid #ffffff18;border-radius:18px;padding:28px"><div style="font-size:26px;font-weight:800;color:#FACC15;margin-bottom:24px">Maratonei</div><h1 style="font-size:22px;line-height:1.3;margin:0 0 14px">${safeSubject}</h1><p style="font-size:16px;line-height:1.6;color:#CBD5E1">${safeMessage}</p><a href="${safeActionUrl}" style="display:inline-block;margin-top:20px;padding:14px 22px;border-radius:10px;background:#FACC15;color:#080B1F;text-decoration:none;font-weight:800">ACESSAR O MARATONEI</a><p style="font-size:12px;color:#94A3B8;margin-top:28px">Você recebeu este e-mail porque ativou notificações por e-mail nas configurações do Maratonei.</p></main></body></html>`
    const raw = buildRawEmail({
      from: fromEmail,
      to: item.recipient_email,
      subject,
      text: textBody,
      html: htmlBody
    })
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw })
    })
    if (!response.ok) {
      throw new Error(`Gmail API send failed (${response.status})`)
    }

    await supabase
      .from('notification_email_outbox')
      .update({ status: 'sent', sent_at: new Date().toISOString(), last_error: null })
      .eq('id', outboxId)
    return Response.json({ sent: true })
  } catch (error) {
    await supabase
      .from('notification_email_outbox')
      .update({
        status: 'failed',
        last_error: String(error?.message || error).slice(0, 1000)
      })
      .eq('id', outboxId)
    return Response.json({ sent: false }, { status: 502 })
  }
}
