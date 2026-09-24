import { createClient } from '@supabase/supabase-js'

export async function GET(){
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { count: totalUsuarios } = await supabase.from('profiles').select('*',{count:'exact',head:true})
  const { count: totalWatchlist } = await supabase.from('watchlist').select('*',{count:'exact',head:true})
  const { count: totalSeries } = await supabase.from('series').select('*',{count:'exact',head:true})

  const { data: profiles } = await supabase.from('profiles').select('id,nome,username,avatar_url,criado_em')
  const { data: watch } = await supabase.from('watchlist').select('serie_id, user_id')
  const { data: allSeries } = await supabase.from('series').select('id,id_tmdb,tmdb_id,titulo,generos')
  const { data: filmes } = await supabase.from('user_filmes').select('user_id, titulo')
  const { data: series } = await supabase.from('user_series').select('user_id, titulo')

  // Cria mapa que aceita id, id_tmdb e tmdb_id
  const map = new Map()
  allSeries?.forEach((s:any)=>{
    map.set(s.id, s)
    map.set(String(s.id), s)
    if(s.id_tmdb) { map.set(s.id_tmdb, s); map.set(String(s.id_tmdb), s) }
    if(s.tmdb_id) { map.set(s.tmdb_id, s); map.set(String(s.tmdb_id), s) }
  })

  const getSerie = (sid:any) => map.get(sid) || map.get(String(sid)) || map.get(Number(sid))

  // TOP 5 REAL
  const countTop:any = {}
  watch?.forEach((w:any)=>{
    const titulo = getSerie(w.serie_id)?.titulo || null
    if(titulo) countTop[titulo]=(countTop[titulo]||0)+1
  })
  // Se ainda não achou (caso watchlist vazio), usa user_filmes + user_series
  if(Object.keys(countTop).length===0){
    filmes?.forEach((f:any)=> countTop[f.titulo]=(countTop[f.titulo]||0)+1)
    series?.forEach((s:any)=> countTop[s.titulo]=(countTop[s.titulo]||0)+1)
  }
  const topSeries = Object.entries(countTop).map(([titulo,total])=>({titulo,total})).sort((a:any,b:any)=>b.total-a.total).slice(0,5)

  // GÊNEROS REAIS - vem de series.generos quando existe, senão ignora Sem categoria
  const gen:any = {}
  watch?.forEach((w:any)=>{
    const g = getSerie(w.serie_id)?.generos || []
    g.forEach((gg:string)=>{ if(gg && gg!=='Sem categoria') gen[gg]=(gen[gg]||0)+1 })
  })
  let generosMaisVistos = Object.entries(gen).map(([genero,total])=>({genero,total})).sort((a:any,b:any)=>b.total-a.total)
  if(generosMaisVistos.length===0){
    // fallback mostra o que tem mesmo com Sem categoria
    const fallback:any={}
    allSeries?.forEach((s:any)=> (s.generos||[]).forEach((g:string)=> fallback[g]=(fallback[g]||0)+1))
    generosMaisVistos = Object.entries(fallback).map(([genero,total])=>({genero,total})).sort((a:any,b:any)=>b.total-a.total)
  }

  const countFilmes:any = {}; filmes?.forEach((f:any)=> countFilmes[f.titulo]=(countFilmes[f.titulo]||0)+1)
  const countSeries:any = {}; series?.forEach((s:any)=> countSeries[s.titulo]=(countSeries[s.titulo]||0)+1)
  const topFilmesTodos = Object.entries(countFilmes).map(([titulo,total])=>({titulo,total})).sort((a:any,b:any)=>b.total-a.total)
  const topSeriesTodos = Object.entries(countSeries).map(([titulo,total])=>({titulo,total})).sort((a:any,b:any)=>b.total-a.total)

  const usuariosDetalhado = profiles?.map((p:any)=>({
   ...p,
    total_filmes: filmes?.filter((f:any)=>f.user_id===p.id).length||0,
    total_series: series?.filter((s:any)=>s.user_id===p.id).length||0,
  })).map((u:any)=>({...u, total_geral: u.total_filmes+u.total_series})).sort((a:any,b:any)=>b.total_geral-a.total_geral)

  return Response.json({
    totalUsuarios, totalWatchlist, totalSeries,
    topSeries, generosMaisVistos,
    usuarios: profiles,
    topFilmesTodos, topSeriesTodos, usuariosDetalhado
  })
}
