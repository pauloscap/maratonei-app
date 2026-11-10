'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BottomNav } from '../../components/BottomNav'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function Notificacoes() {
  const [user, setUser] = useState(null)
  const [notificacoes, setNotificacoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [filtro, setFiltro] = useState('todas')
  const [salvando, setSalvando] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let ativo = true
    async function iniciar() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!ativo) return
      if (!session) { router.push('/login'); return }
      setUser(session.user)
      await buscarNotificacoes(session.user.id, ativo)
    }
    iniciar()
    return () => { ativo = false }
  }, [router])

  async function buscarNotificacoes(userId, ativo = true) {
    setLoading(true)
    setErro('')
    const { data: notifs, error: notifError } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(60)

    if (!ativo) return
    if (notifError) {
      setErro('Não foi possível carregar suas notificações. Tente novamente.')
      setLoading(false)
      return
    }

    const autorIds = [...new Set((notifs || []).map(n => n.autor_id).filter(Boolean))]
    const seriesIds = [...new Set((notifs || []).map(n => n.serie_id).filter(Boolean))]
    const [{ data: perfis }, { data: series }] = await Promise.all([
      autorIds.length
        ? supabase.from('profiles').select('id,nome,username,avatar_url').in('id', autorIds)
        : Promise.resolve({ data: [] }),
      seriesIds.length
        ? supabase.from('series').select('id,titulo').in('id', seriesIds)
        : Promise.resolve({ data: [] })
    ])
    if (!ativo) return

    const perfisMap = Object.fromEntries((perfis || []).map(p => [p.id, p]))
    const seriesMap = Object.fromEntries((series || []).map(s => [s.id, s]))
    setNotificacoes((notifs || []).map(n => ({
      ...n,
      autor: perfisMap[n.autor_id] || null,
      serie: seriesMap[n.serie_id] || null
    })))
    setLoading(false)
  }

  async function marcarTodasComoLidas() {
    if (!user || salvando || naoLidas === 0) return
    setSalvando(true)
    const { error } = await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('user_id', user.id)
      .eq('lida', false)
    if (error) setErro('Não foi possível atualizar as notificações.')
    else setNotificacoes(lista => lista.map(n => ({ ...n, lida: true })))
    setSalvando(false)
  }

  function tempoAtras(valor) {
    if (!valor) return 'Agora'
    const diff = Math.max(0, Date.now() - new Date(valor).getTime())
    const minutos = Math.floor(diff / 60000)
    const horas = Math.floor(minutos / 60)
    const dias = Math.floor(horas / 24)
    if (dias > 30) return new Date(valor).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    if (dias > 0) return dias === 1 ? 'Ontem' : `${dias} dias atrás`
    if (horas > 0) return `${horas}h atrás`
    if (minutos > 0) return `${minutos} min atrás`
    return 'Agora'
  }

  function detalhes(n) {
    if (n.tipo === 'seguiu') return { texto: 'começou a seguir você', icone: '＋', cor: '#7C9CFF', destino: `/perfil/${n.autor_id}`, acao: 'Ver perfil' }
    if (n.tipo === 'comentou') return {
      texto: `comentou em ${n.serie?.titulo || 'uma série'} · T${n.temporada_numero ?? '?'}E${n.episodio_numero ?? '?'}`,
      icone: '▤', cor: '#C4A5FF', destino: `/serie/${n.serie_id}`, acao: 'Ver conversa'
    }
    return { texto: 'interagiu com você', icone: '✦', cor: '#FFD45A', destino: '/', acao: 'Abrir' }
  }

  const naoLidas = notificacoes.filter(n => !n.lida).length
  const visiveis = useMemo(
    () => filtro === 'nao_lidas' ? notificacoes.filter(n => !n.lida) : notificacoes,
    [notificacoes, filtro]
  )

  if (!user) return <main style={styles.page}><p style={styles.muted}>Preparando suas notificações...</p></main>

  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        <Link href="/" style={styles.back}>‹ <span>Início</span></Link>

        <section style={styles.hero}>
          <div style={styles.heroGlow} />
          <div style={styles.eyebrow}>MARATONEI SOCIAL</div>
          <div style={styles.heroTitleRow}>
            <div>
              <h1 style={styles.title}>Notificações</h1>
              <p style={styles.subtitle}>Tudo o que acontece na sua comunidade.</p>
            </div>
            <div style={styles.bell}><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></svg></div>
          </div>
          <div style={styles.heroFooter}>
            <div>
              <strong style={styles.count}>{naoLidas}</strong>
              <span style={styles.countLabel}> {naoLidas === 1 ? 'não lida' : 'não lidas'}</span>
            </div>
            {naoLidas > 0 && (
              <button onClick={marcarTodasComoLidas} disabled={salvando} style={styles.readAll}>
                {salvando ? 'Atualizando...' : 'Marcar tudo como lido'}
              </button>
            )}
          </div>
        </section>

        <div style={styles.filterRow} role="tablist" aria-label="Filtrar notificações">
          <button role="tab" aria-selected={filtro === 'todas'} onClick={() => setFiltro('todas')} style={filtro === 'todas' ? styles.filterActive : styles.filter}>Todas <span>{notificacoes.length}</span></button>
          <button role="tab" aria-selected={filtro === 'nao_lidas'} onClick={() => setFiltro('nao_lidas')} style={filtro === 'nao_lidas' ? styles.filterActive : styles.filter}>Não lidas <span>{naoLidas}</span></button>
        </div>

        {erro && <div role="alert" style={styles.error}>{erro}</div>}
        {loading ? (
          <div style={styles.empty}><div style={styles.loader}>✦</div><p>Carregando novidades...</p></div>
        ) : visiveis.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>✦</div>
            <h2 style={styles.emptyTitle}>{filtro === 'nao_lidas' ? 'Tudo em dia' : 'Seu próximo episódio começa aqui'}</h2>
            <p style={styles.emptyText}>{filtro === 'nao_lidas' ? 'Você já conferiu todas as novidades.' : 'Quando alguém seguir você ou comentar em uma conversa, a novidade aparece aqui.'}</p>
            <Link href="/feed" style={styles.emptyLink}>Explorar atividade dos amigos <span>→</span></Link>
          </div>
        ) : (
          <section style={styles.list} aria-label="Lista de notificações">
            {visiveis.map(n => {
              const item = detalhes(n)
              const nome = n.autor?.nome || n.autor?.username || 'Um maratoneiro'
              return (
                <Link key={n.id} href={item.destino} style={styles.link}>
                  <article style={{ ...styles.notification, ...(n.lida ? {} : styles.unread) }}>
                    <div style={styles.avatarWrap}>
                      {n.autor?.avatar_url?.startsWith('http')
                        ? <img src={n.autor.avatar_url} alt="" style={styles.avatar} />
                        : <span style={styles.avatarFallback}>{nome.slice(0, 1).toUpperCase()}</span>}
                    </div>
                    <div style={styles.notificationBody}>
                      <div style={styles.notificationText}><strong>{nome}</strong> {item.texto}</div>
                      <div style={styles.meta}><span>{tempoAtras(n.created_at)}</span><span style={styles.dot}>•</span><span style={{ color: item.cor }}>{item.acao}</span></div>
                    </div>
                    <div style={{ ...styles.typeIcon, color: item.cor, borderColor: item.cor + '35', background: item.cor + '12' }}>{item.icone}</div>
                    {!n.lida && <span aria-label="Não lida" style={styles.unreadDot} />}
                  </article>
                </Link>
              )
            })}
          </section>
        )}
      </div>
      <BottomNav />
    </main>
  )
}

const styles = {
  page: { minHeight: '100vh', background: '#070B18', color: '#F7F8FC', paddingBottom: 112, fontFamily: 'Inter,system-ui,sans-serif' },
  shell: { maxWidth: 760, margin: '0 auto', padding: '20px 16px 32px' },
  back: { display: 'inline-flex', alignItems: 'center', gap: 7, color: '#9BA8C7', textDecoration: 'none', fontSize: 13, marginBottom: 18 },
  hero: { position: 'relative', overflow: 'hidden', padding: '23px 21px 18px', borderRadius: 24, border: '1px solid #ffffff16', background: 'linear-gradient(135deg,#17213C 0%,#111A31 54%,#17162E 100%)', boxShadow: '0 18px 55px #00000035' },
  heroGlow: { position: 'absolute', width: 190, height: 190, borderRadius: '50%', right: -70, top: -110, background: '#FFD45A20', filter: 'blur(12px)', pointerEvents: 'none' },
  eyebrow: { position: 'relative', color: '#FFD45A', fontSize: 9, fontWeight: 900, letterSpacing: 2.2, marginBottom: 12 },
  heroTitleRow: { position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { fontSize: 'clamp(26px,6vw,34px)', lineHeight: 1.1, letterSpacing: -1.2, fontWeight: 900, margin: 0 },
  subtitle: { color: '#A9B4CC', fontSize: 12, margin: '8px 0 0' },
  bell: { width: 52, height: 52, flexShrink: 0, borderRadius: 17, display: 'grid', placeItems: 'center', background: 'linear-gradient(145deg,#FFD45A,#D7A52E)', color: '#111827', fontSize: 26, boxShadow: '0 8px 24px #FFD45A25' },
  heroFooter: { position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 24, paddingTop: 15, borderTop: '1px solid #ffffff14' },
  count: { fontSize: 23, color: '#FFD45A', fontWeight: 900, fontVariantNumeric: 'tabular-nums' },
  countLabel: { color: '#A9B4CC', fontSize: 11 },
  readAll: { border: '1px solid #FFD45A55', background: '#FFD45A12', color: '#FFE29A', padding: '9px 12px', borderRadius: 999, fontSize: 10, fontWeight: 800, cursor: 'pointer' },
  filterRow: { display: 'flex', gap: 8, margin: '18px 0 14px', padding: 4, borderRadius: 14, background: '#10182B', border: '1px solid #ffffff0d' },
  filter: { flex: 1, border: 0, borderRadius: 10, padding: '11px 10px', background: 'transparent', color: '#9AA7C3', fontSize: 11, fontWeight: 800, cursor: 'pointer' },
  filterActive: { flex: 1, border: 0, borderRadius: 10, padding: '11px 10px', background: '#273451', color: '#FFFFFF', fontSize: 11, fontWeight: 900, cursor: 'pointer', boxShadow: 'inset 0 0 0 1px #ffffff12' },
  list: { display: 'grid', gap: 9 },
  link: { textDecoration: 'none', color: 'inherit' },
  notification: { position: 'relative', display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 17, background: 'linear-gradient(110deg,#111A2D,#0E1628)', border: '1px solid #ffffff0e', transition: 'border-color .2s, transform .2s' },
  unread: { background: 'linear-gradient(110deg,#182440,#111A2D)', border: '1px solid #FFD45A35' },
  avatarWrap: { width: 44, height: 44, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', display: 'grid', placeItems: 'center', background: '#263451', border: '1px solid #ffffff20' },
  avatar: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarFallback: { color: '#FFD45A', fontWeight: 900, fontSize: 17 },
  notificationBody: { flex: 1, minWidth: 0 },
  notificationText: { color: '#DDE4F2', fontSize: 12, lineHeight: 1.55 },
  meta: { display: 'flex', alignItems: 'center', gap: 7, color: '#7F8CA8', fontSize: 10, marginTop: 6 },
  dot: { color: '#53617E' },
  typeIcon: { width: 34, height: 34, borderRadius: 11, border: '1px solid', display: 'grid', placeItems: 'center', fontSize: 16, flexShrink: 0 },
  unreadDot: { width: 7, height: 7, borderRadius: '50%', background: '#FFD45A', position: 'absolute', top: 11, right: 11, boxShadow: '0 0 12px #FFD45A88' },
  empty: { marginTop: 12, padding: '42px 22px', textAlign: 'center', borderRadius: 22, background: 'radial-gradient(circle at 50% 0%,#1A2746,#10182B 65%)', border: '1px solid #ffffff12' },
  loader: { color: '#FFD45A', fontSize: 26, marginBottom: 10 },
  emptyIcon: { width: 58, height: 58, margin: '0 auto 15px', borderRadius: 19, display: 'grid', placeItems: 'center', background: '#FFD45A15', color: '#FFD45A', fontSize: 28 },
  emptyTitle: { fontSize: 17, fontWeight: 900, margin: '0 0 8px' },
  emptyText: { maxWidth: 310, margin: '0 auto', color: '#95A2BF', fontSize: 12, lineHeight: 1.7 },
  emptyLink: { display: 'inline-flex', gap: 8, alignItems: 'center', marginTop: 18, color: '#FFD45A', textDecoration: 'none', fontSize: 11, fontWeight: 900 },
  error: { padding: 13, marginBottom: 12, borderRadius: 12, background: '#4A1F2B', color: '#FFC4C9', fontSize: 12 },
  muted: { color: '#A9B4CC', textAlign: 'center', padding: 30 }
}
