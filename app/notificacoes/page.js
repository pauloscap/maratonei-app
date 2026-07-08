'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
)

export default function Notificacoes() {
  const [user, setUser] = useState(null)
  const [notificacoes, setNotificacoes] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) buscarNotificacoes()
  }, [user])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
    } else {
      setUser(session.user)
    }
  }

  async function buscarNotificacoes() {
    // Busca notificações
    const { data: notifs } = await supabase
.from('notificacoes')
.select('*')
.eq('user_id', user.id)
.order('created_at', { ascending: false })
.limit(50)

    // Busca perfis dos autores
    const autorIds = [...new Set(notifs?.map(n => n.autor_id) || [])]
    const { data: perfis } = await supabase
.from('profiles')
.select('id, nome, avatar_url')
.in('id', autorIds)

    // Busca séries
    const seriesIds = [...new Set(notifs?.filter(n => n.serie_id).map(n => n.serie_id) || [])]
    const { data: series } = await supabase
.from('series')
.select('id, titulo')
.in('id', seriesIds)

    const perfisMap = {}
    perfis?.forEach(p => { perfisMap[p.id] = p })

    const seriesMap = {}
    series?.forEach(s => { seriesMap[s.id] = s })

    const notifsCompletas = notifs?.map(n => ({
  ...n,
      autor: perfisMap[n.autor_id],
      serie: seriesMap[n.serie_id]
    })) || []

    setNotificacoes(notifsCompletas)
    setLoading(false)

    // Marca todas como lidas
    if (notifsCompletas.length > 0) {
      await supabase
  .from('notificacoes')
  .update({ lida: true })
  .eq('user_id', user.id)
  .eq('lida', false)
    }
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

  function textoNotificacao(n) {
    if (n.tipo === 'seguiu') {
      return ' começou a seguir você'
    }
    if (n.tipo === 'comentou') {
      return ` comentou em ${n.serie?.titulo} T${n.temporada_numero}E${n.episodio_numero}`
    }
    return ''
  }

  function linkNotificacao(n) {
    if (n.tipo === 'seguiu') return `/perfil/${n.autor_id}`
    if (n.tipo === 'comentou') return `/serie/${n.serie_id}`
    return '/'
  }

  if (!user) return <main className="main"><div className="card">Redirecionando...</div></main>
  if (loading) return <main className="main"><div className="card">Carregando...</div></main>

  return (
    <main className="main">
      <Link href="/" style={{color: '#FACC15', textDecoration: 'none', marginBottom: '16px', display: 'block'}}>
        ← Voltar
      </Link>

      <h1 style={{color: '#FACC15', marginBottom: '24px', fontSize: '28px'}}>🔔 Notificações</h1>

      {notificacoes.length === 0? (
        <div className="card" style={{textAlign: 'center', color: '#64748B'}}>
          Nenhuma notificação ainda
        </div>
      ) : (
        notificacoes.map((n) => (
          <Link key={n.id} href={linkNotificacao(n)} style={{textDecoration: 'none'}}>
            <div className="card" style={{
              marginBottom: '12px',
              background: n.lida? '#1E293B' : '#334155',
              cursor: 'pointer'
            }}>
              <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
                <img
                  src={n.autor?.avatar_url || 'https://via.placeholder.com/40'}
                  alt={n.autor?.nome}
                  style={{width: '40px', height: '40px', borderRadius: '50%'}}
                />
                <div style={{flex: 1}}>
                  <p style={{color: '#fff', fontSize: '14px'}}>
                    <span style={{color: '#FACC15', fontWeight: 'bold'}}>{n.autor?.nome || 'Alguém'}</span>
                    {textoNotificacao(n)}
                  </p>
                  <p style={{color: '#94A3B8', fontSize: '12px'}}>
                    {tempoAtras(n.created_at)}
                  </p>
                </div>
                {!n.lida && (
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#FACC15'
                  }} />
                )}
              </div>
            </div>
          </Link>
        ))
      )}
    </main>
  )
}
