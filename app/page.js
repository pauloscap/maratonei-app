'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
)

export default function Home() {
  const [aba, setAba] = useState('series')
  const [view, setView] = useState('grade')
  const [series, setSeries] = useState([])
  const [filmes, setFilmes] = useState([])

  useEffect(() => {
    async function buscarDados() {
      const { data, error } = await supabase
        .from('series')
        .select('*')
        .order('nota', { ascending: false })
      
      if (data) {
        setSeries(data.filter(s => s.tipo !== 'filme'))
        setFilmes(data.filter(s => s.tipo === 'filme'))
      }
      if (error) console.log('Erro Supabase:', error)
    }
    buscarDados()
  }, [])

  return (
    <>
      {aba === 'series' && (
        <main className="main active">
          <div className="tab-header">
            <h2>Séries</h2>
            <div className="view-toggle">
              <button className={view === 'grade' ? 'active' : ''} onClick={() => setView('grade')}>
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              </button>
              <button className={view === 'lista' ? 'active' : ''} onClick={() => setView('lista')}>
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line></svg>
              </button>
            </div>
          </div>

          {view === 'grade' ? (
            <div className="grid">
              {series.map(serie => (
                <Link key={serie.id} href={`/serie/${serie.id}`} className="poster">
  <img src={`https://image.tmdb.org/t/p/w500${serie.poster}`} alt={serie.titulo} ... />
</Link>
              ))}
            </div>
          ) : (
            <div>
              {series.map(serie => (
                <div key={serie.id} className="card episode-card">
                  <img src={`https://image.tmdb.org/t/p/w200${serie.poster}`} className="poster" alt={serie.titulo} />
                  <div>
                    <strong style={{color:'#FACC15'}}>{serie.titulo}</strong><br/>
                    <span style={{color:'#64748B'}}>⭐ {serie.nota?.toFixed(1)} • {serie.ano}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {aba === 'filmes' && (
        <main className="main active">
          <div className="tab-header"><h2>Filmes</h2></div>
          <div className="grid">
            {filmes.map(filme => (
              <div key={filme.id} className="poster">
                <img src={`https://image.tmdb.org/t/p/w500${filme.poster}`} alt={filme.titulo} style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px'}} />
              </div>
            ))}
          </div>
        </main>
      )}

      {aba === 'localizar' && <main className="main active"><h2 style={{color:'#FACC15',marginBottom:'16px'}}>Localizar</h2><input className="input" placeholder="Buscar filmes, séries, pessoas..." /></main>}
      {aba === 'agenda' && <main className="main active"><h2 style={{color:'#FACC15',marginBottom:'16px'}}>Agenda</h2><div className="card"><h3>Em breve...</h3></div></main>}
      {aba === 'perfil' && <main className="main active"><h2 style={{color:'#FACC15',marginBottom:'16px'}}>Perfil</h2><div className="card"><h3>Em breve...</h3></div></main>}

      <nav className="bottom-nav">
        <div className={`nav-item ${aba === 'series' ? 'active' : 'inactive'}`} onClick={() => setAba('series')}>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line></svg>
          <span>Séries</span>
        </div>
        <div className={`nav-item ${aba === 'filmes' ? 'active' : 'inactive'}`} onClick={() => setAba('filmes')}>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line></svg>
          <span>Filmes</span>
        </div>
        <div className={`nav-item ${aba === 'localizar' ? 'active' : 'inactive'}`} onClick={() => setAba('localizar')}>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>
          <span>Localizar</span>
        </div>
        <div className={`nav-item ${aba === 'agenda' ? 'active' : 'inactive'}`} onClick={() => setAba('agenda')}>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <span>Agenda</span>
        </div>
        <div className={`nav-item ${aba === 'perfil' ? 'active' : 'inactive'}`} onClick={() => setAba('perfil')}>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          <span>Perfil</span>
        </div>
      </nav>
    </>
  )
}
