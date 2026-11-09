import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const maxDuration = 60

const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_KEY || '4e44d9029b1273360df0be1de39768d1'
const PAGE_SIZE = 10
const SEND_LIMIT = 40

function dayDifference(dateValue) {
  if (!dateValue) return null
  const date = new Date(String(dateValue).slice(0, 10) + 'T00:00:00Z')
  if (Number.isNaN(date.getTime())) return null
  const today = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z')
  return Math.round((date.getTime() - today.getTime()) / 86400000)
}

async function tmdb(path, params = {}) {
  const url = new URL(TMDB_BASE + path)
  url.searchParams.set('api_key', TMDB_KEY)
  url.searchParams.set('language', 'pt-BR')
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value))
  }
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(12000),
    cache: 'no-store'
  })
  if (!response.ok) throw new Error('TMDB request failed (' + response.status + ')')
  return response.json()
}

function catalogEvent(eventType, externalId, eventKey, title, date, message, destination) {
  return {
    event_key: eventKey,
    event_type: eventType,
    external_id: String(externalId),
    title: String(title || 'Novidade no catálogo').slice(0, 180),
    release_date: date || null,
    payload: {
      subject: eventType === 'novo_episodio'
        ? 'Novo episódio no catálogo do Maratonei'
        : eventType === 'nova_serie'
          ? 'Nova série no catálogo do Maratonei'
          : 'Novo filme no catálogo do Maratonei',
      message: String(message).slice(0, 900),
      destination
    }
  }
}

async function collectCatalogEvents() {
  const [airingToday, onTheAir, nowPlaying, upcoming] = await Promise.all([
    tmdb('/tv/airing_today', { page: 1 }).catch(() => ({ results: [] })),
    tmdb('/tv/on_the_air', { page: 1 }).catch(() => ({ results: [] })),
    tmdb('/movie/now_playing', { page: 1, region: 'BR' }).catch(() => ({ results: [] })),
    tmdb('/movie/upcoming', { page: 1, region: 'BR' }).catch(() => ({ results: [] }))
  ])

  const events = new Map()
  const shows = new Map()
  for (const show of [...(airingToday.results || []), ...(onTheAir.results || [])]) {
    if (show?.id) shows.set(String(show.id), show)
  }

  const showList = [...shows.values()].slice(0, PAGE_SIZE * 2)
  for (let index = 0; index < showList.length; index += 5) {
    const batch = showList.slice(index, index + 5)
    const details = await Promise.all(batch.map(show =>
      tmdb('/tv/' + show.id).catch(() => null)
    ))

    for (const detail of details) {
      if (!detail?.id) continue
      const seriesTitle = detail.name || detail.original_name || 'Série'

      const premiere = dayDifference(detail.first_air_date)
      if (premiere !== null && premiere >= -7 && premiere <= 0) {
        const event = catalogEvent(
          'nova_serie',
          detail.id,
          'tv:' + detail.id + ':premiere:' + detail.first_air_date,
          seriesTitle,
          detail.first_air_date,
          'A série ' + seriesTitle + ' estreou em ' + detail.first_air_date + '. Confira a página da série no Maratonei.',
          '/serie/' + detail.id
        )
        events.set(event.event_key, event)
      }

      const episode = detail.last_episode_to_air
      const episodeAge = dayDifference(episode?.air_date)
      if (episode?.id && episodeAge !== null && episodeAge >= -2 && episodeAge <= 0) {
        const episodeName = episode.name || ('episódio ' + (episode.episode_number || 'novo'))
        const season = episode.season_number || 1
        const episodeNumber = episode.episode_number || ''
        const event = catalogEvent(
          'novo_episodio',
          episode.id,
          'tv:' + detail.id + ':episode:' + episode.id,
          seriesTitle,
          episode.air_date,
          'Um novo episódio de ' + seriesTitle + ' (' + episodeName + ', T' + season + 'E' + episodeNumber + ') foi lançado em ' + episode.air_date + '.',
          '/serie/' + detail.id
        )
        events.set(event.event_key, event)
      }
    }
  }

  const movies = new Map()
  for (const movie of [...(nowPlaying.results || []), ...(upcoming.results || [])]) {
    if (movie?.id) movies.set(String(movie.id), movie)
  }
  for (const movie of [...movies.values()].slice(0, PAGE_SIZE * 2)) {
    const releaseDate = movie.release_date
    const age = dayDifference(releaseDate)
    if (age === null || age < -45 || age > 7) continue
    const title = movie.title || movie.original_title || 'Filme'
    const event = catalogEvent(
      'novo_filme',
      movie.id,
      'movie:' + movie.id + ':release:' + releaseDate,
      title,
      releaseDate,
      'O filme ' + title + ' tem lançamento previsto ou recente para ' + releaseDate + '. Confira no Maratonei.',
      '/filme/' + movie.id
    )
    events.set(event.event_key, event)
  }

  return [...events.values()]
}

async function loadAllAuthUsers(supabase) {
  const users = []
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new Error('Could not list account emails')
    const batch = data?.users || []
    users.push(...batch)
    if (batch.length < 1000) break
  }
  return users
}

export async function GET(request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || request.headers.get('authorization') !== 'Bearer ' + cronSecret) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const webhookSecret = process.env.SUPABASE_EMAIL_WEBHOOK_SECRET
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://maratoneiapp.com.br'

  if (!supabaseUrl || !serviceRoleKey || !webhookSecret || !TMDB_KEY) {
    return Response.json({ error: 'Catalog email service is not configured' }, { status: 503 })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  try {
    const events = await collectCatalogEvents()
    let insertedEvents = 0
    let queuedEmails = 0

    if (events.length) {
      const newEvents = []
      for (const event of events) {
        const { data, error } = await supabase
          .from('notification_catalog_events')
          .upsert(event, { onConflict: 'event_key', ignoreDuplicates: true })
          .select('event_key')
        if (error) throw new Error('Could not record catalog event')
        if (data?.length) {
          insertedEvents += 1
          newEvents.push(event)
        }
      }

      if (newEvents.length) {
        const { data: preferences, error: preferenceError } = await supabase
          .from('notification_email_preferences')
          .select('user_id')
          .eq('email_novidades_catalogo', true)
        if (preferenceError) throw new Error('Could not load catalog email subscribers')

        const optedIn = new Set((preferences || []).map(item => item.user_id))
        if (optedIn.size) {
          const users = await loadAllAuthUsers(supabase)
          const emailByUserId = new Map(
            users.filter(user => user.email && optedIn.has(user.id)).map(user => [user.id, user.email])
          )
          const rows = []
          for (const event of newEvents) {
            for (const [userId, email] of emailByUserId) {
              rows.push({
                notification_id: null,
                event_key: event.event_key,
                user_id: userId,
                recipient_email: email,
                notification_type: 'catalogo',
                payload: event.payload,
                status: 'pending'
              })
            }
          }

          for (let index = 0; index < rows.length; index += 500) {
            const { error } = await supabase
              .from('notification_email_outbox')
              .upsert(rows.slice(index, index + 500), {
                onConflict: 'user_id,event_key',
                ignoreDuplicates: true
              })
            if (error) throw new Error('Could not queue catalog emails')
            queuedEmails += Math.min(500, rows.length - index)
          }
        }
      }
    }

    const { data: pending, error: pendingError } = await supabase
      .from('notification_email_outbox')
      .select('id')
      .eq('notification_type', 'catalogo')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(SEND_LIMIT)
    if (pendingError) throw new Error('Could not load pending catalog emails')

    let attempted = 0
    let delivered = 0
    for (const item of pending || []) {
      attempted += 1
      try {
        const response = await fetch(new URL('/api/webhooks/notification-email', appUrl), {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + webhookSecret,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'INSERT',
            table: 'notification_email_outbox',
            record: { id: item.id }
          }),
          signal: AbortSignal.timeout(25000)
        })
        if (response.ok) {
          const result = await response.json().catch(() => ({}))
          if (result.sent) delivered += 1
        }
      } catch (error) {
        console.error('Catalog email delivery attempt failed:', String(error?.message || error))
      }
    }

    return Response.json({
      ok: true,
      detected: events.length,
      newEvents: insertedEvents,
      queuedEmails,
      attempted,
      delivered
    })
  } catch (error) {
    console.error('Catalog email cron failed:', String(error?.message || error))
    return Response.json({ error: 'Catalog monitoring failed' }, { status: 500 })
  }
}
