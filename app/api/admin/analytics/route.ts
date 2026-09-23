import { createClient } from '@supabase/supabase-js'

function parseGeneros(raw: any): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) {
    const flat: string[] = []
    raw.forEach((item: any) => {
      if (typeof item === 'string' && item.trim().startsWith('[')) {
        try { flat.push(...JSON.parse(item)) } catch { flat.push(item) }
      } else flat.push(item)
    })
    return flat
  }
  if (typeof raw === 'string') { try { return JSON.parse(raw) } catch { return [raw] } }
  return []
}

export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: series } = await supabase.from('series').select('id, id_tmdb, titulo, generos')
  const { data: watchlist } = await supabase.from('watchlist').select('serie_id')
  const { data: profiles } = await supabase.from('profiles').select('id, nome, username, avatar_url, criado_em').order('criado_em', {ascending:false}).limit(50)

  const serieMap: Record<string, any> = {}
  series?.forEach((s: any) => { serieMap[String(s.id)] = s; if (s.id_tmdb) serieMap[String(s.id_tmdb)] = s })

  const topMap: Record<string, number> = {}
  watchlist?.forEach((w: any) => { const sid = String(w.serie_id); topMap[sid] = (topMap[sid] || 0) + 1 })

  // GÊNEROS REAIS = conta todos os 8 títulos do catálogo (base real)
  const generoCount: Record<string, number> = {}
  series?.forEach((s: any) => {
    parseGeneros(s.generos).forEach(g => {
      const nome = g?.toString().trim()
      if (nome) generoCount[nome] = (generoCount[nome] || 0) + 1
    })
  })

  return Response.json({
    generosMaisVistos: Object.entries(generoCount).map(([genero, total])=>({genero, total})).sort((a:any,b:any)=>b.total-a.total),
    topSeries: Object.entries(topMap).map(([id,total])=>({titulo: serieMap[id]?.titulo || `ID ${id}`, total})).sort((a:any,b:any)=>b.total-a.total).slice(0,5),
    totalSeries: series?.length || 0,
    totalWatchlist: watchlist?.length || 0,
    usuarios: profiles || [],
    totalUsuarios: profiles?.length || 0
  })
}
