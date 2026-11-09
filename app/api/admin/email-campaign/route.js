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
  if (!token || !supabaseUrl || !anonKey || !adminEmail) {
    return { error: 'Admin access is not configured', status: 503 }
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
  const { data, error } = await authClient.auth.getUser(token)
  if (error || !data?.user?.email) return { error: 'Authentication required', status: 401 }
  if (data.user.email.trim().toLowerCase() !== adminEmail) {
    return { error: 'Forbidden', status: 403 }
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return { error: 'Admin service is not configured', status: 503 }
  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
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

export async function GET(request) {
  const auth = await authorizeAdmin(request)
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })
  return Response.json({ ok: true, email: auth.user.email })
}

export async function POST(request) {
  const auth = await authorizeAdmin(request)
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const subject = String(body?.subject || '').trim()
  const message = String(body?.message || '').trim()
  if (subject.length < 3 || subject.length > 140 || message.length < 10 || message.length > 1200) {
    return Response.json({ error: 'Subject must be 3–140 characters and message 10–1200 characters' }, { status: 400 })
  }

  try {
    const { data: preferences, error: preferenceError } = await auth.supabase
      .from('notification_email_preferences')
      .select('user_id')
      .eq('email_comunicados', true)
    if (preferenceError) throw new Error('Could not load announcement subscribers')

    const optedIn = new Set((preferences || []).map(row => row.user_id))
    if (!optedIn.size) return Response.json({ ok: true, campaignId: null, queued: 0 })

    const users = await loadUsers(auth.supabase)
    const campaignId = crypto.randomUUID()
    const rows = users
      .filter(user => user.email && optedIn.has(user.id))
      .map(user => ({
        notification_id: null,
        event_key: 'announcement:' + campaignId,
        user_id: user.id,
        recipient_email: user.email,
        notification_type: 'comunicado',
        payload: {
          subject,
          message,
          destination: '/'
        },
        status: 'pending'
      }))

    let queued = 0
    for (let index = 0; index < rows.length; index += 400) {
      const batch = rows.slice(index, index + 400)
      const { error } = await auth.supabase
        .from('notification_email_outbox')
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
