'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
)

export default function Home() {
  const [user, setUser] = useState(null)
  const [series, setSeries] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => { checkUser() }, [])
  useEffect(() => { if (user) buscarSeries() }, [user])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) router.push('/login')
    else setUser(session.user)
  }

  async function buscarSeries() {
    const { data } = await supabase.from('series').select('*').order('id', { ascending: false }).limit(24)
    setSeries(data || [])
    setLoading(false)
  }

  async function handleSearch(e) {
    e.preventDefault()
    if (!searchTerm.trim()) { setSearchResults([]); buscarSeries(); return }
    const res = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${process.env.NEXT_PUBLIC_TMDB_KEY}&language=pt-BR&query=${encodeURIComponent(searchTerm)}`)
    const data = await res.json()
    setSearchResults(data.results?.filter(r => r.poster_path) || [])
  }

  async function adicionarSerie(s) {
    const { data: ex } = await supabase.from('series').select('id').eq('tmdb_id', s.id).single()
    if (ex) { router.push(`/serie/${ex.id}`); return }
    const { data: nova } = await supabase.from('series').insert({
      tmdb_id: s.id, titulo: s.name, sinopse: s.overview, poster: s.poster_path, nota: s.vote_average, ano: s.first_air_date?.split('-')[0] || null
    }).select().single()
    if (nova) router.push(`/serie/${nova.id}`)
  }

  if (!user || loading) return <main className="main"><div style={{background:'#1E293B', padding:'20px', borderRadius:'12px'}}>Carregando...</div></main>

  const lista = searchResults.length > 0? searchResults : series
  const titulo = searchResults.length > 0? `Resultados para "${searchTerm}"` : 'Catálogo'

  return (
    <main className="main">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', flexWrap:'wrap', gap:'12px'}}>
        <h1 style={{color:'#FACC15', fontSize:'28px', fontWeight:'900'}}>🍿 Maratonei</h1>
        <div style={{display:'flex', gap:'16px'}}>
          <Link href="/stats" style={{color:'#94A3B8', textDecoration:'none'}}>📊 Stats</Link>
          <Link href="/ranking" style={{color:'#94A3B8', textDecoration:'none'}}>🏆 Ranking</Link>
          <button onClick={async()=>{await supabase.auth.signOut(); router.push('/login')}} style={{background:'none', border:'none', color:'#94A3B8', cursor:'pointer'}}>Sair</button>
        </div>
      </div>

      <form onSubmit={handleSearch} style={{display:'flex', gap:'8px', marginBottom:'28px'}}>
        <input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Buscar série... ex: Breaking Bad" style={{flex:1, padding:'14px 16px', borderRadius:'10px', border:'1px solid #334155', background:'#1E293B', color:'#fff', fontSize:'16px', outline:'none'}} />
        <button type="submit" style={{background:'#FACC15', color:'#000', border:'none', padding:'0 22px', borderRadius:'10px', fontWeight:'800', cursor:'pointer'}}>Buscar</button>
      </form>

      <h2 style={{color:'#FACC15', fontSize:'18px', marginBottom:'16px'}}>{titulo} {searchResults.length>0 && <span onClick={()=>{setSearchResults([]); setSearchTerm(''); buscarSeries()}} style={{color:'#94A3B8', fontSize:'14px', cursor:'pointer', marginLeft:'12px'}}>✕ limpar</span>}</h2>

      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:'16px'}}>
        {lista.map((s) => {
          const isTMDB =!!s.name
          const poster = s.poster_path || s.poster
          const tituloCard = s.name || s.titulo
          return (
            <div key={isTMDB? s.id : `db-${s.id}`} onClick={()=> isTMDB? adicionarSerie(s) : router.push(`/serie/${s.id}`)} style={{cursor:'pointer'}}>
              <div className="card">
                <img src={`https://image.tmdb.org/t/p/w342${poster}`} alt={tituloCard} style={{height:'240px', objectFit:'cover'}} />
                <div style={{padding:'10px'}}>
                  <p style={{color:'#fff', fontSize:'14px', fontWeight:'600', lineHeight:'1.2', height:'34px', overflow:'hidden'}}>{tituloCard}</p>
                  <p style={{color:'#94A3B8', fontSize:'12px', marginTop:'4px'}}>⭐ { (s.vote_average || s.nota || 0).toFixed(1) }</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}
