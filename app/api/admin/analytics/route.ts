import { createClient } from '@supabase/supabase-js'
export const dynamic = 'force-dynamic'

export async function GET(){
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { count: totalUsuarios } = await supabase.from('profiles').select('*',{count:'exact',head:true})
  const { count: totalWatchlist } = await supabase.from('watchlist').select('*',{count:'exact',head:true})
  const { count: totalSeries } = await supabase.from('series').select('*',{count:'exact',head:true})

  const { data: profiles } = await supabase.from('profiles').select('id,nome,username,avatar_url,criado_em')
  const { data: watch } = await supabase.from('watchlist').select('serie_id, user_id')
  const { data: allSeries } = await supabase.from('series').select('id,id_tmdb,tmdb_id,titulo,generos')
  const { data: filmes } = await supabase.from('user_filmes').select('user_id, titulo, filme_id')
  const { data: seriesU } = await supabase.from('user_series').select('user_id, titulo, serie_id')

  // MAPA QUE ACEITA TUDO: id, id_tmdb, tmdb_id, string e number
  const map = new Map<string, any>()
  allSeries?.forEach((s:any)=>{
    map.set(String(s.id), s)
    map.set(String(s.id_tmdb), s)
    if(s.tmdb_id) map.set(String(s.tmdb_id), s)
    map.set(String(Number(s.id_tmdb)), s)
  })
  const getSerie = (sid:any) => map.get(String(sid))

  // TOP 5
  const countTop:any = {}
  watch?.forEach((w:any)=>{
    const t = getSerie(w.serie_id)?.titulo
    if(t) countTop[t]=(countTop[t]||0)+1
  })
  // fallback se watchlist falhar
  if(Object.keys(countTop).length===0){
    filmes?.forEach((f:any)=> countTop[f.titulo]=(countTop[f.titulo]||0)+1)
    seriesU?.forEach((s:any)=> countTop[s.titulo]=(countTop[s.titulo]||0)+1)
  }
  const topSeries = Object.entries(countTop).map(([titulo,total])=>({titulo,total})).sort((a:any,b:any)=> (b.total as number)-(a.total as number)).slice(0,5)

  // GÊNEROS - AGORA CONTA OS 221
  const gen:any = {}
  watch?.forEach((w:any)=>{
    const generos = getSerie(w.serie_id)?.generos || []
    generos.forEach((g:string)=>{ if(g) gen[g]=(gen[g]||0)+1 })
  })
  const generosMaisVistos = Object.entries(gen).map(([genero,total])=>({genero,total})).sort((a:any,b:any)=> (b.total as number)-(a.total as number)).slice(0,8)

  const countFilmes:any = {}; filmes?.forEach((f:any)=> countFilmes[f.titulo]=(countFilmes[f.titulo]||0)+1)
  const countSeries:any = {}; seriesU?.forEach((s:any)=> countSeries[s.titulo]=(countSeries[s.titulo]||0)+1)
  const topFilmesTodos = Object.entries(countFilmes).map(([titulo,total])=>({titulo,total})).sort((a:any,b:any)=> (b.total as number)-(a.total as number))
  const topSeriesTodos = Object.entries(countSeries).map(([titulo,total])=>({titulo,total})).sort((a:any,b:any)=> (b.total as number)-(a.total as number))

  const usuariosDetalhado = profiles?.map((p:any)=>({
   ...p,
    total_filmes: filmes?.filter((f:any)=>f.user_id===p.id).length||0,
    total_series: seriesU?.filter((s:any)=>s.user_id===p.id).length||0,
  })).map((u:any)=>({...u, total_geral: u.total_filmes+u.total_series})).sort((a:any,b:any)=>b.total_geral-a.total_geral)

  return Response.json({ totalUsuarios, totalWatchlist, totalSeries, topSeries, generosMaisVistos, usuarios: profiles, topFilmesTodos, topSeriesTodos, usuariosDetalhado })
}
