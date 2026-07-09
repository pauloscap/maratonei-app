'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
)

export default function Home() {
  const [user, setUser] = useState(null)
  const [series, setSeries] = useState([])
  const [seriesFiltradas, setSeriesFiltradas] = useState([])
  const [continuarAssistindo, setContinuarAssistindo] = useState([])
  const [watchlistSeries, setWatchlistSeries] = useState([])
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('todas')
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      buscarDados()
      buscarNotificacoes()
      buscarWatchlist()
    }
  }, [user])

  useEffect(() => {
    aplicarFiltros()
  }, [busca, filtro, series])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
    } else {
      setUser(session.user)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function buscarNotificacoes() {
    const { count } = await supabase
.from('notificacoes')
.select('*', { count: 'exact', head: true })
.eq('user_id', user.id)
.eq('lida', false)

    setNotificacoesNaoLidas(count || 0)
  }

  async function buscarWatchlist() {
    const { data: watchlistData } = await supabase
.from('watchlist')
.select('serie_id')
.eq('user_id', user.id)

    const serieIds = watchlistData?.map(w => w.serie_id) || []

    if (serieIds.length === 0) {
      setWatchlistSeries([])
      return
    }

    // Busca detalhes das séries na watchlist
    const { data: seriesData } = await supabase
.from('series')
.select('*')
.in('id', serieIds)

    setWatchlistSeries(seriesData || [])
  }

  async function buscarDados() {
    const { data: seriesData } = await supabase.from('series').select('*')
    if (seriesData) {
      const progressoArray = []

      for (const serie of seriesData) {
        const { data: temps } = await supabase
 .from('temporadas')
 .select('episodios')
 .eq('serie_id', serie.id)

        const totalEps = temps?.reduce((acc, t) => acc + t.episodios, 0) || 0

        const { data: assistidos } = await supabase
 .from('user_episodios')
 .select('id, created_at')
 .eq('serie_id', serie.id)
 .order('created_at', { ascending: false })

        const assistidosCount = assistidos?.length || 0
        const percentual = totalEps > 0? Math.round((assistidosCount / totalEps) * 100) : 0
        const ultimoAssistido = assistidos?.[0]?.created_at || null

        progressoArray.push({
 ...serie,
          totalEps,
          assistidosCount,
          percentual,
          ultimoAssistido
        })
      }

      const emAndamento = progressoArray
.filter(s => s.percentual > 0 && s.percentual < 100)
.sort((a, b) => new Date(b.ultimoAssistido) - new Date(a.ultimoAssistido))

      setContinuarAssistindo(emAndamento)
      setSeries(progressoArray)
      setSeriesFiltradas(progressoArray)
    }
    setLoading(false)
  }

  function aplicarFiltros() {
    let resultado = [...series]

    if (busca) {
      resultado = resultado.filter(s =>
        s.titulo.toLowerCase().includes(busca.toLowerCase())
      )
    }

    if (filtro === 'andamento') {
      resultado = resultado.filter(s => s.percentual > 0 && s.percentual < 100)
    } else if (filtro === 'concluidas') {
      resultado = resultado.filter(s => s.percentual === 100)
    } else if (filtro === 'nao_iniciadas') {
      resultado = resultado.filter(s => s.percentual === 0)
    } else if (filtro === 'watchlist') {
      resultado = watchlistSeries.map(w => ({
       ...w,
        totalEps: 0,
        assistidosCount: 0,
        percentual: 0
      }))
    }

    setSeriesFiltradas(resultado)
  }

  if (!user) return <main className="main"><div className="card">Redirecionando...</div></main>
  if (loading) return <main className="main"><div className="card">Carregando...</div></main>

  const CardSerie = ({ serie }) => (
    <Link key={serie.id} href={`/serie/${serie.id}`} style={{textDecoration: 'none'}}>
      <div className="card" style={{marginBottom: '16px'}}>
        <img
          src={`https://image.tmdb.org/t/p/w500${serie.poster}`}
          alt={serie.titulo}
          style={{
            width: '100%',
            height: '180px',
            objectFit: 'cover',
            borderRadius: '8px',
            marginBottom: '12px'
          }}
        />
        <h3 style={{color: '#FACC15', marginBottom: '4px'}}>{serie.titulo}</h3>
        <div style={{color: '#94A3B8', fontSize: '14px', marginBottom: '12px'}}>
          <span>⭐ {serie.nota?.toFixed(1)}</span>
          <span style={{margin: '0 8px'}}>•</span>
          <span>{serie.ano}</span>
        </div>

        {serie.totalEps > 0 && (
          <div>
            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94A3B8', marginBottom: '6px'}}>
              <span>{serie.assistidosCount}/{serie.totalEps} episódios</span>
              <span style={{color: '#FACC15', fontWeight: 'bold'}}>{serie.percentual}%</span>
            </div>
            <div style={{width: '100%', height: '6px', background: '#1E293B', borderRadius: '3px', overflow: 'hidden'}}>
              <div style={{
                width: `${serie.percentual}%`,
                height: '100%',
                background: '#FACC15',
                transition: 'width 0.3s'
              }} />
            </div>
          </div>
        )}

        {filtro === 'watchlist' && (
          <div style={{marginTop: '8px'}}>
            <span style={{
              background: '#FACC15',
              color: '#000',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              📌 Quero Assistir
            </span>
          </div>
        )}
      </div>
    </Link>
  )

  const BotaoFiltro = ({ valor, texto }) => (
    <button
      onClick={() => setFiltro(valor)}
      style={{
        background: filtro === valor? '#FACC15' : '#1E293B',
        color: filtro === valor? '#000' : '#94A3B8',
        border: 'none',
        padding: '8px 14px',
        borderRadius: '20px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: filtro === valor? 'bold' : 'normal',
        marginRight: '8px',
        marginBottom: '8px'
      }}
    >
      {texto}
    </button>
  )

  return (
    <main className="main">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
        <h1 style={{color: '#FACC15', fontSize: '28px', margin: 0}}>Maratonei</h1>
        <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
          <img
            src={user.user_metadata?.avatar_url}
            alt="Avatar"
            style={{width: '32px', height: '32px', borderRadius: '50%'}}
          />
          <Link href="/adicionar" style={{textDecoration: 'none'}}>
            <div style={{
              background: '#22C55E',
              padding: '8px 14px',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              +
            </div>
          </Link>
          <Link href="/ranking" style={{textDecoration: 'none'}}>
            <div style={{
              background: '#1E293B',
              padding: '8px 14px',
              borderRadius: '8px',
              color: '#FACC15',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              🏆
            </div>
          </Link>
          <Link href="/feed" style={{textDecoration: 'none'}}>
            <div style={{
              background: '#1E293B',
              padding: '8px 14px',
              borderRadius: '8px',
              color: '#FACC15',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              📱
            </div>
          </Link>
          <Link href="/notificacoes" style={{textDecoration: 'none', position: 'relative'}}>
            <div style={{
              background: '#1E293B',
              padding: '8px 14px',
              borderRadius: '8px',
              color: '#FACC15',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              🔔
              {notificacoesNaoLidas > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#EF4444',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  minWidth: '16px',
                  textAlign: 'center'
                }}>
                  {notificacoesNaoLidas}
                </div>
              )}
            </div>
          </Link>
          <Link href="/stats" style={{textDecoration: 'none'}}>
            <div style={{
              background: '#1E293B',
              padding: '8px 14px',
              borderRadius: '8px',
              color: '#FACC15',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              📊
            </div>
          </Link>
          <Link href="/exportar" style={{textDecoration: 'none'}}>
            <div style={{
              background: '#1E293B',
              padding: '8px 14px',
              borderRadius: '8px',
              color: '#FACC15',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              📥
            </div>
          </Link>
          <button
            onClick={signOut}
            style={{
              background: '#1E293B',
              padding: '8px 14px',
              borderRadius: '8px',
              color: '#EF4444',
              fontSize: '14px',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Sair
          </button>
        </div>
      </div>

      <input
        type="text"
        placeholder="Buscar série..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        style={{
          width: '100%',
          background: '#1E293B',
          border: '1px solid #334155',
          color: '#fff',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '16px',
          marginBottom: '16px',
          outline: 'none'
        }}
      />

      <div style={{marginBottom: '24px'}}>
        <BotaoFiltro valor="todas" texto="Todas" />
        <BotaoFiltro valor="andamento" texto="Em andamento" />
        <BotaoFiltro valor="concluidas" texto="Concluídas" />
        <BotaoFiltro valor="nao_iniciadas" texto="Não iniciadas" />
        <BotaoFiltro valor="watchlist" texto={`📌 Quero Assistir (${watchlistSeries.length})`} />
      </div>

      {!busca && filtro === 'todas' && continuarAssistindo.length > 0 && (
        <div style={{marginBottom: '32px'}}>
          <h2 style={{color: '#FACC15', fontSize: '20px', marginBottom: '16px'}}>Continuar Assistindo</h2>
          {continuarAssistindo.map(serie => <CardSerie key={serie.id} serie={serie} />)}
        </div>
      )}

      <h2 style={{color: '#94A3B8', fontSize: '18px', marginBottom: '16px'}}>
        {busca || filtro!== 'todas'? `Resultados (${seriesFiltradas.length})` : 'Todas as Séries'}
      </h2>

      {seriesFiltradas.length === 0? (
        <div className="card" style={{textAlign: 'center', color: '#64748B'}}>
          {filtro === 'watchlist'? 'Sua lista de desejos está vazia' : 'Nenhuma série encontrada'}
        </div>
      ) : (
        seriesFiltradas.map(serie => <CardSerie key={serie.id} serie={serie} />)
      )}
    </main>
  )
}
