'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
)

export default function Feed() {
  const [user, setUser] = useState(null)
  const [atividades, setAtividades] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) buscarFeed()
  }, [user])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
    } else {
      setUser(session.user)
    }
  }

  async function buscarFeed() {
    // 1. Busca últimos 50 episódios assistidos
    const { data: episodios } = await supabase
  .from('user_episodios')
  .select('user_id, serie_id, temporada_numero, episodio_numero, created_at')
  .order('created_at', { ascending: false })
  .limit(50)

    // 2. Busca últimas 50 avaliações
    const { data: avaliacoes } = await supabase
  .from('user_avaliacoes')
  .select('user_id, serie_id, temporada_numero, episodio_numero, nota, comentario, created_at')
  .order('created_at', { ascending: false })
  .limit(50)

    // 3. Busca perfis e séries
    const userIds = [...new Set([...episodios?.map(e => e.user_id) || [],...avaliacoes?.map(a => a.user_id) || []])]
    const seriesIds = [...new Set([...episodios?.map(e => e.serie_id) || [],...avaliacoes?.map(a => a.serie_id) || []])]

    const { data: perfis } = await supabase
  .from('profiles')
  .select('id, nome, avatar_url, username')
  .in('id', userIds)

    const { data: series } = await supabase
  .from('series')
  .select('id, titulo, poster')
  .in('id', seriesIds)

    // 4. Monta mapa
    const perfisMap = {}
    perfis?.forEach(p => { perfisMap[p.id] = p })

    const seriesMap = {}
    series?.forEach(s => { seriesMap[s.id] = s })

    // 5. Combina atividades
    const feed = []

    episodios?.forEach(ep => {
      feed.push({
        tipo: 'assistiu',
        user: perfisMap[ep.user_id],
        serie: seriesMap[ep.serie_id],
        temporada: ep.temporada_numero,
        episodio: ep.episodio_numero,
        created_at: ep.created_at
      })
    })

    avaliacoes?.forEach(av => {
      feed.push({
        tipo: 'avaliou',
        user: perfisMap[av.user_id],
        serie: seriesMap[av.serie_id],
        temporada: av.temporada_numero,
        episodio: av.episodio_numero,
        nota: av.nota,
        comentario: av.comentario,
        created_at: av.created_at
      })
    })

    // 6. Ordena por data
    feed.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    setAtividades(feed.slice(0, 30))
    setLoading(false)
  }

  function tempoAtras(data) {
    const agora = new Date()
    const diff = agora - new Date(data)
    const minutos = Math.floor(diff / 60000)
    const horas = Math.floor(minutos / 60)
    const dias = Math.floor(horas / 24)

    if (dias > 0) return `${dias}d atrás`
    if (horas > 0) return `${horas}h atrás`
    if (minutos > 0) return `${minutos}min atrás`
    return 'agora'
  }

  if (!user) return <main className="main"><div className="card">Redirecionando...</div></main>
  if (loading) return <main className="main"><div className="card">Carregando feed...</div></main>

  return (
    <main className="main">
      <Link href="/" style={{color: '#FACC15', textDecoration: 'none', marginBottom: '16px', display: 'block'}}>
        ← Voltar
      </Link>

      <h1 style={{color: '#FACC15', marginBottom: '24px', fontSize: '28px'}}>📱 Feed</h1>

      {atividades.length === 0? (
        <div className="card" style={{textAlign: 'center', color: '#64748B'}}>
          Ninguém assistiu nada ainda. Seja o primeiro!
        </div>
      ) : (
        atividades.map((atv, index) => (
          <div key={index} className="card" style={{marginBottom: '16px'}}>
            <div style={{display: 'flex', gap: '12px', marginBottom: '12px'}}>
              <Link href={`/perfil/${atv.user?.id}`}>
                <img
                  src={atv.user?.avatar_url || 'https://via.placeholder.com/40'}
                  alt={atv.user?.nome}
                  style={{width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer'}}
                />
              </Link>
              <div style={{flex: 1}}>
                <p style={{color: '#fff', fontSize: '14px', marginBottom: '2px'}}>
                  <Link href={`/perfil/${atv.user?.id}`} style={{color: '#FACC15', textDecoration: 'none', fontWeight: 'bold'}}>
                    {atv.user?.nome || 'Anônimo'}
                  </Link>
                  {atv.tipo === 'assistiu'? ' assistiu ' : ' avaliou '}
                  <Link href={`/serie/${atv.serie?.id}`} style={{color: '#FACC15', textDecoration: 'none'}}>
                    {atv.serie?.titulo}
                  </Link>
                </p>
                <p style={{color: '#94A3B8', fontSize: '12px'}}>
                  T{atv.temporada}E{atv.episodio} • {tempoAtras(atv.created_at)}
                </p>
              </div>
            </div>

            {atv.tipo === 'avaliou' && (
              <div style={{background: '#1E293B', padding: '12px', borderRadius: '8px'}}>
                <div style={{marginBottom: '8px'}}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} style={{color: i < atv.nota? '#FACC15' : '#334155', fontSize: '16px'}}>
                      ⭐
                    </span>
                  ))}
                </div>
                {atv.comentario && (
                  <p style={{color: '#94A3B8', fontSize: '14px', lineHeight: '1.5'}}>
                    "{atv.comentario}"
                  </p>
                )}
              </div>
            )}

            {atv.serie?.poster && (
              <Link href={`/serie/${atv.serie?.id}`}>
                <img
                  src={`https://image.tmdb.org/t/p/w200${atv.serie.poster}`}
                  alt={atv.serie.titulo}
                  style={{
                    width: '100%',
                    height: '120px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    marginTop: '12px',
                    cursor: 'pointer'
                  }}
                />
              </Link>
            )}
          </div>
        ))
      )}
    </main>
  )
}
