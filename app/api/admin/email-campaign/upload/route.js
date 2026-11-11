import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const BUCKET = 'newsletter-assets'
const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }

async function authorizeAdmin(request) {
  const authorization = request.headers.get('authorization') || ''
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const adminEmail = String(process.env.MARATONEI_ADMIN_EMAIL || '').trim().toLowerCase()
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!token || !url || !anonKey || !adminEmail || !serviceKey) {
    return { error: 'Admin service is not configured', status: 503 }
  }

  const authClient = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data, error } = await authClient.auth.getUser(token)
  if (error || !data?.user?.email) return { error: 'Authentication required', status: 401 }
  if (data.user.email.trim().toLowerCase() !== adminEmail) return { error: 'Forbidden', status: 403 }

  const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  return { supabase }
}

async function ensureBucket(supabase) {
  const { data, error } = await supabase.storage.getBucket(BUCKET)
  if (data && !error) return
  const { error: createError } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_FILE_SIZE,
    allowedMimeTypes: [...ALLOWED_TYPES]
  })
  if (createError && !/already exists|duplicate/i.test(createError.message || '')) {
    throw new Error('Não foi possível preparar o armazenamento de imagens.')
  }
}

export async function POST(request) {
  const auth = await authorizeAdmin(request)
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

  let form
  try { form = await request.formData() } catch {
    return Response.json({ error: 'Envie um arquivo de imagem válido.' }, { status: 400 })
  }

  const file = form.get('file')
  if (!file || typeof file.arrayBuffer !== 'function') {
    return Response.json({ error: 'Selecione uma imagem.' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return Response.json({ error: 'Formato não permitido. Use JPG, PNG, WebP ou GIF.' }, { status: 415 })
  }
  if (!file.size || file.size > MAX_FILE_SIZE) {
    return Response.json({ error: 'A imagem deve ter até 5 MB.' }, { status: 413 })
  }

  try {
    await ensureBucket(auth.supabase)
    const path = 'newsletter/' + crypto.randomUUID() + '.' + EXTENSIONS[file.type]
    const { error: uploadError } = await auth.supabase.storage.from(BUCKET).upload(path, await file.arrayBuffer(), {
      contentType: file.type,
      cacheControl: '31536000',
      upsert: false
    })
    if (uploadError) throw uploadError

    const { data } = auth.supabase.storage.from(BUCKET).getPublicUrl(path)
    return Response.json({ ok: true, url: data.publicUrl, path })
  } catch (error) {
    console.error('Newsletter image upload failed:', String(error?.message || error))
    return Response.json({ error: 'Não foi possível armazenar a imagem. Tente novamente.' }, { status: 500 })
  }
}
