import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'node:crypto'
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

function safeExternalHttps(value) {
  try {
    const url = new URL(String(value || ''))
    return url.protocol === 'https:' ? url.toString() : ''
  } catch {
    return ''
  }
}

function renderNewsletterBlocks(blocks) {
  const safeBlocks = Array.isArray(blocks) ? blocks.slice(0, 12) : []
  const html = safeBlocks.map(block => {
    const title = escapeHtml(String(block?.title || '').slice(0, 120))
    const text = escapeHtml(String(block?.text || '').slice(0, 700)).replace(/\n/g, '<br>')
    const imageUrl = safeExternalHttps(block?.imageUrl)
    const linkUrl = safeExternalHttps(block?.linkUrl)
    const image = imageUrl ? '<img src="' + escapeHtml(imageUrl) + '" alt="' + title + '" width="536" style="display:block;width:100%;max-width:536px;height:auto;border:0;border-radius:8px;margin:0 0 14px">' : ''
    const heading = title ? '<h2 style="font-family:Arial,sans-serif;font-size:19px;line-height:1.35;color:#111827;margin:8px 0">' + title + '</h2>' : ''
    const paragraph = text ? '<p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.65;color:#4B5563;margin:8px 0 14px">' + text + '</p>' : ''
    const button = linkUrl ? '<p style="margin:16px 0 4px"><a href="' + escapeHtml(linkUrl) + '" style="display:inline-block;padding:11px 17px;border-radius:6px;background:#F2C94C;color:#172033;text-decoration:none;font-family:Arial,sans-serif;font-size:13px;font-weight:bold">' + escapeHtml(String(block?.linkLabel || 'SAIBA MAIS').slice(0, 40)) + '</a></p>' : ''
    return '<tr><td style="padding:22px 0 0;border-top:1px solid #E5E7EB">' + image + heading + paragraph + button + '</td></tr>'
  }).join('')
  const text = safeBlocks.map(block => [block?.title, block?.text, block?.linkUrl].filter(Boolean).join('\n')).join('\n\n')
  return { html, text }
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
    .select('id, user_id, recipient_email, notification_type, payload, status, attempts')
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
  const coverImageUrl = safeExternalHttps(payload.coverImageUrl)
  const safeCoverImageUrl = coverImageUrl ? '<img src="' + escapeHtml(coverImageUrl) + '" alt="Destaque da newsletter" width="100%" style="display:block;width:100%;height:auto;border-radius:14px;margin:18px 0">' : ''
  const newsletter = renderNewsletterBlocks(payload.blocks)

  try {
    const recipient = String(item.recipient_email || '').trim()
    if (!isValidRecipient(recipient)) {
      throw new Error('Invalid recipient email')
    }

    const accessToken = await getGmailAccessToken()
    const isWelcome = item.notification_type === 'boas_vindas'
    const isNewsletter = item.notification_type === 'comunicado'
    const preferenceUrl = resolveActionUrl('/configuracoes', appUrl)
    const safePreferenceUrl = escapeHtml(preferenceUrl.toString())
    const unsubscribeSecret = process.env.SUPABASE_SERVICE_ROLE_KEY
    const unsubscribeToken = isNewsletter && unsubscribeSecret
      ? item.user_id + '.' + createHmac('sha256', unsubscribeSecret).update(item.user_id).digest('hex')
      : ''
    const unsubscribeUrl = unsubscribeToken
      ? new URL('/api/email/unsubscribe?token=' + encodeURIComponent(unsubscribeToken), appUrl).toString()
      : ''
    const safeUnsubscribeUrl = escapeHtml(unsubscribeUrl)
    const textBody = [
      subject,
      '',
      message,
      '',
      newsletter.text,
      '',
      'Acesse: ' + actionUrl.toString(),
      '',
      isWelcome
        ? 'Este é um e-mail de boas-vindas enviado após a criação da sua conta no Maratonei.'
        : isNewsletter
          ? 'Você recebeu esta newsletter porque possui uma conta no Maratonei. Para deixar de receber newsletters, acesse: ' + unsubscribeUrl
          : 'Você recebeu este e-mail porque ativou notificações por e-mail no Maratonei. Para alterar ou desativar suas preferências, acesse: ' + preferenceUrl.toString()
    ].join('\n')
    const preferenceFooter = isNewsletter && unsubscribeUrl
      ? '<p style="font-size:12px;color:#64748B;margin-top:12px;text-align:center">Você recebe esta newsletter por ter uma conta no Maratonei. <a href="' + safeUnsubscribeUrl + '" style="color:#9A7414">Cancelar recebimento</a></p>'
      : isWelcome
        ? ''
        : '<p style="font-size:12px;color:#94A3B8;margin-top:12px">Para alterar ou desativar suas preferências de e-mail, <a href="' + safePreferenceUrl + '" style="color:#9A7414">acesse as configurações</a>.</p>'
    const htmlBody = '<!doctype html><html lang="pt-BR"><body style="margin:0;padding:0;background:#F3F4F6;color:#374151;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F3F4F6;width:100%"><tr><td align="center" style="padding:28px 12px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#FFFFFF;border:1px solid #E5E7EB;border-radius:10px;overflow:hidden"><tr><td align="center" style="padding:25px 28px 18px;border-bottom:1px solid #F0F0F0"><div style="font-size:22px;line-height:1.2;font-weight:900;letter-spacing:1px;color:#172033">🍿 MARATONEI</div></td></tr><tr><td style="padding:26px 32px 30px"><h1 style="font-size:23px;line-height:1.3;color:#111827;margin:0 0 16px;font-weight:800">' + safeSubject + '</h1>' + safeCoverImageUrl + '<p style="font-size:15px;line-height:1.7;color:#4B5563;white-space:pre-line;margin:0 0 18px">' + safeMessage + '</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' + newsletter.html + '</table><p style="text-align:center;margin:28px 0 8px"><a href="' + safeActionUrl + '" style="display:inline-block;padding:13px 21px;border-radius:6px;background:#F2C94C;color:#172033;text-decoration:none;font-size:13px;font-weight:bold">ACESSAR O MARATONEI</a></p></td></tr><tr><td style="padding:17px 28px;background:#F9FAFB;border-top:1px solid #E5E7EB"><p style="font-size:11px;line-height:1.5;color:#6B7280;text-align:center;margin:0">' + (isWelcome ? 'Este é um e-mail de boas-vindas enviado após a criação da sua conta.' : (isNewsletter ? 'Você recebe esta newsletter por ter uma conta no Maratonei.' : 'Você recebeu este e-mail porque ativou notificações por e-mail nas configurações do Maratonei.')) + '</p>' + preferenceFooter + '</td></tr></table></td></tr></table></body></html>'
    const raw = buildRawEmail({ from: fromEmail, to: recipient, subject, text: textBody, html: htmlBody, headers: isNewsletter && unsubscribeUrl ? { 'List-Unsubscribe': '<' + unsubscribeUrl + '>', 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } : {} })

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
