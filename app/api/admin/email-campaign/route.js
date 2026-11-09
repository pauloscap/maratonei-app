import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

function getBearerToken(request) {
  const value = request.headers.get('authorization') || ''
  return value.startsWith('Bearer ') ? value.slice(7) : ''
}

async function authorizeAdmin(request) {
  const token = getBearerToken(request)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const adminEmail = String(process.env.MARATONEI_ADMIN_EMAIL || '').trim().toLowerCase()
  if (!token || !supabaseUrl || !anonKey || !adminEmail) return { error: 'Admin access is not configured', status: 503 }

  const authClient = createClient(supabaseUrl, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data, error } = await authClient.auth.getUser(token)
  if (error || !data?.user?.email) return { error: 'Authentication required', status: 401 }
  if (data.user.email.trim().toLowerCase() !== adminEmail) return { error: 'Forbidden', status: 403 }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return { error: 'Admin service is not configured', status: 503 }
  const adminClient = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  return { user: data.user, supabase: adminClient }
}

async function loadUsers(supabase) {
  const users = []
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new Error('Could not load account emails')
    const batch = data?.users || []
    users.push(...batch)
    if (batch.length < 1000) break
  }
  return users
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

export async function GET(request) {
  const auth = await authorizeAdmin(request)
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })
  return Response.json({ ok: true, email: auth.user.email })
}

export async function POST(request) {
  const auth = await authorizeAdmin(request)
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

  let body
  try { body = await request.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const subject = String(body?.subject || '').trim()
  const message = String(body?.message || '').trim()
  let coverImageUrl = ''
  let blocks = []
  try {
    if (subject.length < 3 || subject.length > 140) throw new Error('Subject must be 3–140 characters')
    if (message.length < 10 || message.length > 1200) throw new Error('Introduction must be 10–1200 characters')
    coverImageUrl = safeHttpsUrl(body?.coverImageUrl, 'Cover image URL')
    blocks = validateBlocks(body?.blocks || [])
    if (!coverImageUrl && blocks.length === 0) throw new Error('Add a cover image or at least one content block')
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 })
  }

  try {
    const { data: unsubscribes, error: unsubscribeError } = await auth.supabase
      .from('newsletter_unsubscribes').select('user_id')
    if (unsubscribeError) throw new Error('Could not load newsletter unsubscribe list')
    const unsubscribed = new Set((unsubscribes || []).map(row => row.user_id))

    const users = await loadUsers(auth.supabase)
    const campaignId = crypto.randomUUID()
    const rows = users.filter(user => user.email && user.email_confirmed_at && !unsubscribed.has(user.id)).map(user => ({
      notification_id: null,
      event_key: 'announcement:' + campaignId,
      user_id: user.id,
      recipient_email: user.email,
      notification_type: 'comunicado',
      payload: { subject, message, coverImageUrl, blocks, destination: '/' },
      status: 'pending'
    }))

    let queued = 0
    for (let index = 0; index < rows.length; index += 400) {
      const batch = rows.slice(index, index + 400)
      const { error } = await auth.supabase.from('notification_email_outbox')
        .upsert(batch, { onConflict: 'user_id,event_key', ignoreDuplicates: true })
      if (error) throw new Error('Could not queue announcement')
      queued += batch.length
    }
    return Response.json({ ok: true, campaignId, queued })
  } catch (error) {
    console.error('Announcement queue failed:', String(error?.message || error))
    return Response.json({ error: 'Could not queue announcement' }, { status: 500 })
  }
}
