import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const TEST_RECIPIENT = 'paulor.garcia7@gmail.com'
const SENDER_EMAIL = 'contatomaratoneiapp@gmail.com'

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]))
}

function safeHttpsUrl(value, fieldName) {
  if (!value) return ''
  try {
    const url = new URL(String(value).trim())
    if (url.protocol !== 'https:') throw new Error()
    return url.toString()
  } catch {
    throw new Error(fieldName + ' must be a valid HTTPS URL')
  }
}

function validateBlocks(input) {
  if (!Array.isArray(input) || input.length > 12) throw new Error('Use up to 12 newsletter content blocks')
  return input.map(block => {
    const title = String(block?.title || '').trim().slice(0, 120)
    const text = String(block?.text || '').trim().slice(0, 700)
    const imageUrl = safeHttpsUrl(block?.imageUrl, 'Image URL')
    const linkUrl = safeHttpsUrl(block?.linkUrl, 'Link URL')
    const linkLabel = String(block?.linkLabel || 'SAIBA MAIS').trim().slice(0, 40)
    if (!title && !text && !imageUrl && !linkUrl) throw new Error('Remove empty newsletter blocks')
    if (linkUrl && !title && !text && !imageUrl) throw new Error('A link block needs a title, text or image')
    return { title, text, imageUrl, linkUrl, linkLabel }
  })
}

function buildHtml({ subject, message, coverImageUrl, blocks }) {
  const sections = blocks.map(block => `
    <tr><td style="padding:22px 0 0;border-top:1px solid #E5E7EB">
      ${block.imageUrl ? `<img src="${escapeHtml(block.imageUrl)}" alt="${escapeHtml(block.title || 'Imagem')}" width="536" style="display:block;width:100%;max-width:536px;height:auto;border:0;border-radius:8px;margin:0 0 14px">` : ''}
      ${block.title ? `<h2 style="font-family:Arial,sans-serif;font-size:19px;line-height:1.35;color:#111827;margin:8px 0">${escapeHtml(block.title)}</h2>` : ''}
      ${block.text ? `<p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.65;color:#4B5563;margin:8px 0 14px;white-space:pre-wrap">${escapeHtml(block.text)}</p>` : ''}
      ${block.linkUrl ? `<p style="margin:16px 0 4px"><a href="${escapeHtml(block.linkUrl)}" style="display:inline-block;background:#F2C94C;color:#172033;text-decoration:none;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;padding:11px 17px;border-radius:6px">${escapeHtml(block.linkLabel || 'SAIBA MAIS')}</a></p>` : ''}
    </td></tr>`).join('')
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;padding:0;background:#F3F4F6;font-family:Arial,Helvetica,sans-serif;color:#374151">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F3F4F6;width:100%">
      <tr><td align="center" style="padding:28px 12px">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#FFFFFF;border:1px solid #E5E7EB;border-radius:10px;overflow:hidden">
          <tr><td align="center" style="padding:25px 28px 18px;border-bottom:1px solid #F0F0F0">
            <div style="font-family:Arial,sans-serif;font-size:22px;line-height:1.2;font-weight:900;letter-spacing:1px;color:#172033">🍿 MARATONEI</div>
          </td></tr>
          <tr><td style="padding:26px 32px 30px">
            <p style="font-family:Arial,sans-serif;font-size:11px;line-height:1.4;font-weight:bold;letter-spacing:1.2px;color:#9A7414;margin:0 0 10px">NEWSLETTER · E-MAIL DE TESTE</p>
            <h1 style="font-family:Arial,sans-serif;font-size:24px;line-height:1.3;color:#111827;margin:0 0 18px;font-weight:800">${escapeHtml(subject)}</h1>
            ${coverImageUrl ? `<img src="${escapeHtml(coverImageUrl)}" alt="Capa da newsletter" width="536" style="display:block;width:100%;max-width:536px;height:auto;border:0;border-radius:8px;margin:0 0 20px">` : ''}
            <p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:#4B5563;margin:0 0 18px;white-space:pre-wrap">${escapeHtml(message)}</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${sections}</table>
            <p style="text-align:center;margin:28px 0 8px"><a href="https://maratoneiapp.com.br" style="display:inline-block;background:#F2C94C;color:#172033;text-decoration:none;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;padding:13px 21px;border-radius:6px">ACESSAR MARATONEI</a></p>
          </td></tr>
          <tr><td style="padding:17px 28px;background:#F9FAFB;border-top:1px solid #E5E7EB">
            <p style="font-family:Arial,sans-serif;font-size:11px;line-height:1.5;color:#6B7280;text-align:center;margin:0">Este é um e-mail de teste enviado somente ao administrador do Maratonei.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body></html>`
}

function toBase64Url(value) {
  return Buffer.from(value, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

async function authorizeAdmin(request) {
  const header = request.headers.get('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const adminEmail = String(process.env.MARATONEI_ADMIN_EMAIL || '').trim().toLowerCase()
  if (!token || !supabaseUrl || !anonKey || !adminEmail) return { error: 'Admin access is not configured', status: 503 }
  const client = createClient(supabaseUrl, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data, error } = await client.auth.getUser(token)
  if (error || !data?.user?.email) return { error: 'Authentication required', status: 401 }
  if (data.user.email.trim().toLowerCase() !== adminEmail) return { error: 'Forbidden', status: 403 }
  return { user: data.user }
}

export async function POST(request) {
  const auth = await authorizeAdmin(request)
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

  let body
  try { body = await request.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  let subject, message, coverImageUrl, blocks
  try {
    subject = String(body?.subject || '').trim()
    message = String(body?.message || '').trim()
    if (subject.length < 3 || subject.length > 140) throw new Error('Subject must be 3–140 characters')
    if (message.length < 10 || message.length > 1200) throw new Error('Introduction must be 10–1200 characters')
    coverImageUrl = safeHttpsUrl(body?.coverImageUrl, 'Cover image URL')
    blocks = validateBlocks((body?.blocks || []).filter(block => Object.values(block || {}).some(value => String(value).trim())))
    if (!coverImageUrl && blocks.length === 0) throw new Error('Add a cover image or at least one content block')
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 })
  }

  const clientId = process.env.GMAIL_CLIENT_ID
  const clientSecret = process.env.GMAIL_CLIENT_SECRET
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN
  if (!clientId || !clientSecret || !refreshToken) {
    return Response.json({ error: 'Gmail credentials are incomplete. Check GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET and GMAIL_REFRESH_TOKEN in the Preview environment.' }, { status: 503 })
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: 'refresh_token' }),
      cache: 'no-store'
    })
    const tokenData = await tokenResponse.json()
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Gmail OAuth refresh failed:', tokenData.error || tokenResponse.status)
      return Response.json({ error: 'Gmail authentication failed. Review the OAuth credentials and refresh token.' }, { status: 502 })
    }

    const html = buildHtml({ subject, message, coverImageUrl, blocks })
    const mime = [
      'From: Maratonei <' + SENDER_EMAIL + '>',
      'To: ' + TEST_RECIPIENT,
      'Subject: ' + subject.replace(/[\r\n]/g, ' '),
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      Buffer.from(html, 'utf8').toString('base64')
    ].join('\r\n')

    const gmailResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + tokenData.access_token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: toBase64Url(mime) }),
      cache: 'no-store'
    })
    const gmailData = await gmailResponse.json().catch(() => ({}))
    if (!gmailResponse.ok) {
      console.error('Gmail test send failed:', JSON.stringify({ status: gmailData.error?.status || gmailResponse.status, message: gmailData.error?.message || 'No message returned', reasons: (gmailData.error?.errors || []).map(item => item.reason).filter(Boolean) }))
      return Response.json({ error: 'Gmail rejected the test email. Check the authorized account, Gmail API and send permission.' }, { status: 502 })
    }

    return Response.json({ ok: true, sentTo: TEST_RECIPIENT, messageId: gmailData.id || null })
  } catch (error) {
    console.error('Isolated Gmail test failed:', String(error?.message || error))
    return Response.json({ error: 'Could not send the isolated test email.' }, { status: 500 })
  }
}
