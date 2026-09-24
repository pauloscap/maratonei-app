import { createClient } from '@supabase/supabase-js'

export async function GET(){
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { count: totalUsuarios } = await supabase.from('profiles').select('*',{count:'exact',head:true})
  const { count: totalWatchlist } = await supabase.from('watchlist').select('*',{count:'exact',head:true})
  const { count: totalSeries } = await supabase.from('series').select('*',{count:'exact',head:true})

  const { data: profiles } = await supabase.from('profiles').select('id,nome,username,avatar_url,criado_em').order('criado_em',{ascending:false})
  const { data: watch } = await supabase.from('watchlist').select('serie_id, user_id, series(titulo, generos)')
  const { data: filmes } = await supabase.from('user_filmes').select('user_id, titulo')
  const { data: series } = await supabase.from('user_series').select('user_id, titulo')

  // TOP 5 atual (mantém igual)
  const countTop:any = {}
  watch?.forEach((w:any)=>{ const t = w.series?.titulo || 'Sem título'; countTop[t]=(countTop[t]||0)+1 })
  const topSeries = Object.entries(countTop).map(([titulo,total])=>({titulo,total})).sort((a:any,b:any)=>b.total-a.total).slice(0,5)

  // NOVO: TODOS os filmes e todas as séries separados
  const countFilmes:any = {}; filmes?.forEach((f:any)=> countFilmes[f.titulo]=(countFilmes[f.titulo]||0)+1)
  const countSeries:any = {}; series?.forEach((s:any)=> countSeries[s.titulo]=(countSeries[s.titulo]||0)+1)
  const topFilmesTodos = Object.entries(countFilmes).map(([titulo,total])=>({titulo,total})).sort((a:any,b:any)=>b.total-a.total)
  const topSeriesTodos = Object.entries(countSeries).map(([titulo,total])=>({titulo,total})).sort((a:any,b:any)=>b.total-a.total)

  // Gêneros (mantém igual)
  const gen:any = {}; watch?.forEach((w:any)=> (w.series?.generos||[]).forEach((g:string)=> gen[g]=(gen[g]||0)+1))
  const generosMaisVistos = Object.entries(gen).map(([genero,total])=>({genero,total})).sort((a:any,b:any)=>b.total-a.total)

  // NOVO: Por usuário - quantos filmes e séries cada um tem
  const usuariosDetalhado = profiles?.map((p:any)=>({
   ...p,
    total_filmes: filmes?.filter((f:any)=>f.user_id===p.id).length||0,
    total_series: series?.filter((s:any)=>s.user_id===p.id).length||0,
  })).map((u:any)=>({...u, total_geral: u.total_filmes+u.total_series})).sort((a:any,b:any)=>b.total_geral-a.total_geral)

  return Response.json({
    totalUsuarios, totalWatchlist, totalSeries,
    topSeries, // mantém seu TOP 1 AGORA
    generosMaisVistos,
    usuarios: profiles,
    topFilmesTodos, topSeriesTodos, // NOVO
    usuariosDetalhado // NOVO
  })
}
