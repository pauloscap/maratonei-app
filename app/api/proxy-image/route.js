export const runtime = 'nodejs'

const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const ALLOWED_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
])

function isAllowedImageUrl(value) {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') return false
    if (url.hostname !== 'image.tmdb.org') return false
    if (url.port && url.port !== '443') return false
    if (url.username || url.password) return false
    if (url.search || url.hash) return false
    if (!/^\/t\/p\/(?:w\d+|original)\/[A-Za-z0-9._/-]+$/.test(url.pathname)) return false
    if (url.pathname.split('/').some((part) => part === '.' || part === '..')) return false
    return true
  } catch {
    return false
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const imageUrl = searchParams.get('url')

  if (!imageUrl || imageUrl.length > 2048 || !isAllowedImageUrl(imageUrl)) {
    return new Response('URL de imagem não permitida', { status: 400 })
  }

  try {
    const upstream = await fetch(imageUrl, {
      method: 'GET',
      redirect: 'error',
      signal: AbortSignal.timeout(8000),
      headers: { Accept: 'image/avif,image/webp,image/png,image/jpeg' },
    })

    if (!upstream.ok || !upstream.body) {
      return new Response('Imagem indisponível', { status: 502 })
    }

    const contentType = (upstream.headers.get('content-type') || '')
      .split(';')[0]
      .trim()
      .toLowerCase()
    if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
      await upstream.body.cancel()
      return new Response('Formato de imagem não permitido', { status: 415 })
    }

    const declaredLength = Number(upstream.headers.get('content-length') || 0)
    if (declaredLength > MAX_IMAGE_BYTES) {
      await upstream.body.cancel()
      return new Response('Imagem excede o limite permitido', { status: 413 })
    }

    const reader = upstream.body.getReader()
    const chunks = []
    let total = 0

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        total += value.byteLength
        if (total > MAX_IMAGE_BYTES) {
          await reader.cancel()
          return new Response('Imagem excede o limite permitido', { status: 413 })
        }
        chunks.push(value)
      }
    } finally {
      reader.releaseLock()
    }

    const image = new Uint8Array(total)
    let offset = 0
    for (const chunk of chunks) {
      image.set(chunk, offset)
      offset += chunk.byteLength
    }

    return new Response(image, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(total),
        'X-Content-Type-Options': 'nosniff',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    })
  } catch {
    return new Response('Falha ao buscar imagem', { status: 502 })
  }
}
