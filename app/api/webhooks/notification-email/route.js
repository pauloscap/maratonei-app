import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char])
}

export async function POST(request) {
  const secret = process.env.SUPABASE_EMAIL_WEBHOOK_SECRET
  const authorization = request.headers.get('authorization')

  if (!secret || authorization !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const resendApiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://maratoneiapp.com.br'

  if (!supabaseUrl || !serviceRoleKey || !resendApiKey || !fromEmail) {
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
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [item.recipient_email],
        subject,
        html: `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#080B1F;color:#fff;font-family:Arial,sans-serif;padding:32px 16px"><main style="max-width:560px;margin:0 auto;background:#12182F;border:1px solid #ffffff18;border-radius:18px;padding:28px"><div style="font-size:26px;font-weight:800;color:#FACC15;margin-bottom:24px">Maratonei</div><h1 style="font-size:22px;line-height:1.3;margin:0 0 14px">${safeSubject}</h1><p style="font-size:16px;line-height:1.6;color:#CBD5E1">${safeMessage}</p><a href="${safeActionUrl}" style="display:inline-block;margin-top:20px;padding:14px 22px;border-radius:10px;background:#FACC15;color:#080B1F;text-decoration:none;font-weight:800">ACESSAR O MARATONEI</a><p style="font-size:12px;color:#94A3B8;margin-top:28px">Você recebeu este e-mail porque ativou notificações por e-mail nas configurações do Maratonei.</p></main></body></html>`,
        text: `${subject}\n\n${message}\n\nAcesse: ${actionUrl}\n\nVocê recebeu este e-mail porque ativou notificações por e-mail no Maratonei.`
      })
    })

    if (!response.ok) {
      const details = await response.text()
      throw new Error(`Resend ${response.status}: ${details.slice(0, 500)}`)
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
