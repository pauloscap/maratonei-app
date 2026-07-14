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

  async function handleClick(serie) {
    // Se já é do nosso banco (tem titulo)
    if (serie.titulo) {
      router.push(`/serie/${serie.id}`)
      return
    }

    // Se veio do TMDB (tem name)
    console.log('Adicionando série TMDB:', serie.name)

    // 1. Verifica se já existe
    const { data: existe } = await supabase.from('series').select('id').eq('tmdb_id', serie.id).single()

    if (existe) {
      console.log('Já existe, indo pra página:', existe.id)
      router.push(`/serie/${existe.id}`)
      return
    }

    // 2. Cria nova
    const { data: nova, error } = await supabase.from('series').insert({
      tmdb_id: serie.id,
      titulo: serie.name,
      sinopse: serie.overview || 'Sem sinopse',
      poster: serie.poster_path,
      nota: serie.vote_average || 0,
      ano: serie.first_air_date?.split('-')[0] || '2024'
    }).select().single()

    if (error) {
      alert('Erro ao adicionar: ' + error.message)
      console.error(error)
      return
    }

    if (nova) {
      console.log('Série criada:', nova.id)
      router.push(`/serie/${nova.id}`)
    }
  }

  if (!user || loading) return <main className="main"><div style={{background:'#1E293B', padding:'20px', borderRadius:'12px'}}>Carregando...</div></main>

  const lista = searchResults.length > 0? searchResults : series
  const tituloSecao = searchResults.length > 0? `Resultados para "${searchTerm}"` : 'Catálogo'

  return (
    <main className="main">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
        <h1 style={{color:'#FACC15', fontSize:'28px', fontWeight:'900'}}>🍿 Maratonei</h1>
        <div style={{display:'flex', gap:'16px'}}>
          <Link href="/stats" style={{color:'#94A3B8', textDecoration:'none'}}>📊 Stats</Link>
          <Link href="/ranking" style={{color:'#94A3B8', textDecoration:'none'}}>🏆 Ranking</Link>
        </div>
      </div>

      <form onSubmit={handleSearch} style={{display:'flex', gap:'8px', marginBottom:'28px'}}>
        <input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Buscar série... ex: Breaking Bad" style={{flex:1, padding:'14px 16px', borderRadius:'10px', border:'1px solid #334155', background:'#1E293B', color:'#fff', fontSize:'16px', outline:'none'}} />
        <button type="submit" style={{background:'#FACC15', color:'#000', border:'none', padding:'0 22px', borderRadius:'10px', fontWeight:'800', cursor:'pointer'}}>Buscar</button>
      </form>

      <h2 style={{color:'#FACC15', fontSize:'18px', marginBottom:'16px'}}>
        {tituloSecao}
        {searchResults.length>0 && <span onClick={()=>{setSearchResults([]); setSearchTerm(''); buscarSeries()}} style={{color:'#94A3B8', fontSize:'14px', cursor:'pointer', marginLeft:'12px'}}>✕ limpar</span>}
      </h2>

      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:'16px'}}>
        {lista.map((s) => {
          const poster = s.poster_path || s.poster
          const nome = s.name || s.titulo
          const nota = s.vote_average || s.nota || 0
          return (
            <button
              key={s.id}
              onClick={() => handleClick(s)}
              style={{
                background:'none', border:'none', padding:0, textAlign:'left', cursor:'pointer', width:'100%'
              }}
            >
              <div className="card" style={{pointerEvents:'none'}}>
                <img src={`https://image.tmdb.org/t/p/w342${poster}`} alt={nome} style={{height:'240px', objectFit:'cover', width:'100%', borderRadius:'12px 12px 0 0'}} />
                <div style={{padding:'10px', background:'#1E293B', borderRadius:'0 0 12px 12px'}}>
                  <p style={{color:'#fff', fontSize:'14px', fontWeight:'600', lineHeight:'1.2', height:'34px', overflow:'hidden', margin:0}}>{nome}</p>
                  <p style={{color:'#94A3B8', fontSize:'12px', marginTop:'6px', margin:0}}>⭐ {Number(nota).toFixed(1)}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </main>
  )
}
