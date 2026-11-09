import { createClient } from '@supabase/supabase-js'
import { buildRawEmail, escapeHtml, isValidRecipient, resolveActionUrl } from '../../../../lib/email/notification-email.mjs'

export const runtime = 'nodejs'

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
    body,
    signal: AbortSignal.timeout(15000)
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || !data.access_token) {
    throw new Error('Google OAuth token refresh failed (' + response.status + ')')
  }
  return data.access_token
}

export async function POST(request) {
  const secret = process.env.SUPABASE_EMAIL_WEBHOOK_SECRET
  const authorization = request.headers.get('authorization')
  if (!secret || authorization !== 'Bearer ' + secret) {
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
  if (!['seguiu', 'comentou', 'boas_vindas', 'catalogo', 'comunicado'].includes(item.notification_type)) {
    return Response.json({ ignored: true, reason: 'Unsupported notification type' })
  }

  // Compare-and-set: only one webhook delivery can claim a pending row.
  const { data: claimed, error: claimError } = await supabase
    .from('notification_email_outbox')
    .update({ status: 'processing', processing_started_at: new Date().toISOString(), attempts: (item.attempts || 0) + 1 })
    .eq('id', outboxId)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle()

  if (claimError || !claimed) {
    return Response.json({ ignored: true, reason: 'Already claimed' })
  }

  const payload = item.payload || {}
  const actionUrl = resolveActionUrl(payload.destination, appUrl)

  const subject = String(payload.subject || 'Você tem uma novidade no Maratonei').slice(0, 180)
  const message = String(payload.message || 'Acesse o Maratonei para conferir sua novidade.').slice(0, 1000)
  const safeSubject = escapeHtml(subject)
  const safeMessage = escapeHtml(message)
  const safeActionUrl = escapeHtml(actionUrl.toString())

  try {
    const recipient = String(item.recipient_email || '').trim()
    if (!isValidRecipient(recipient)) {
      throw new Error('Invalid recipient email')
    }

    const accessToken = await getGmailAccessToken()
    const isWelcome = item.notification_type === 'boas_vindas'
    const preferenceUrl = resolveActionUrl('/configuracoes', appUrl)
    const safePreferenceUrl = escapeHtml(preferenceUrl.toString())
    const textBody = [
      subject,
      '',
      message,
      '',
      'Acesse: ' + actionUrl.toString(),
      '',
      isWelcome
        ? 'Este é um e-mail de boas-vindas enviado após a criação da sua conta no Maratonei.'
        : 'Você recebeu este e-mail porque ativou notificações por e-mail no Maratonei. Para alterar ou desativar suas preferências, acesse: ' + preferenceUrl.toString()
    ].join('\n')
    const preferenceFooter = isWelcome
      ? ''
      : '<p style="font-size:12px;color:#94A3B8;margin-top:12px">Para alterar ou desativar suas preferências de e-mail, <a href="' + safePreferenceUrl + '" style="color:#FACC15">acesse as configurações</a>.</p>'
    const htmlBody = '<!doctype html><html lang="pt-BR"><body style="margin:0;background:#080B1F;color:#fff;font-family:Arial,sans-serif;padding:32px 16px"><main style="max-width:560px;margin:0 auto;background:#12182F;border:1px solid #ffffff18;border-radius:18px;padding:28px"><div style="font-size:26px;font-weight:800;color:#FACC15;margin-bottom:24px">Maratonei</div><h1 style="font-size:22px;line-height:1.3;margin:0 0 14px">' + safeSubject + '</h1><p style="font-size:16px;line-height:1.6;color:#CBD5E1">' + safeMessage + '</p><a href="' + safeActionUrl + '" style="display:inline-block;margin-top:20px;padding:14px 22px;border-radius:10px;background:#FACC15;color:#080B1F;text-decoration:none;font-weight:800">ACESSAR O MARATONEI</a><p style="font-size:12px;color:#94A3B8;margin-top:28px">' + (isWelcome ? 'Este é um e-mail de boas-vindas enviado após a criação da sua conta.' : 'Você recebeu este e-mail porque ativou notificações por e-mail nas configurações do Maratonei.') + '</p>' + preferenceFooter + '</main></body></html>'
    const raw = buildRawEmail({ from: fromEmail, to: recipient, subject, text: textBody, html: htmlBody })

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw }),
      signal: AbortSignal.timeout(20000)
    })
    if (!response.ok) {
      throw new Error('Gmail API send failed (' + response.status + ')')
    }

    const { error: updateError } = await supabase
      .from('notification_email_outbox')
      .update({ status: 'sent', processing_started_at: null, sent_at: new Date().toISOString(), last_error: null })
      .eq('id', outboxId)
    if (updateError) {
      console.error('Email sent but outbox status update failed:', updateError.message)
    }
    return Response.json({ sent: true, statusRecorded: !updateError })
  } catch (error) {
    const { error: updateError } = await supabase
      .from('notification_email_outbox')
      .update({ status: 'failed', processing_started_at: null, last_error: String(error?.message || error).slice(0, 1000) })
      .eq('id', outboxId)
    if (updateError) console.error('Could not record email failure:', updateError.message)
    return Response.json({ sent: false }, { status: 502 })
  }
}
