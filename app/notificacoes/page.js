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
        <header style={styles.topbar}>
          <Link href="/" style={styles.back}><span style={styles.backArrow}>‹</span> Início</Link>
          <span style={styles.topBrand}>MARATONEI <i> SOCIAL</i></span>
        </header>

        <section style={styles.hero}>
          <div style={styles.heroGlow} />
          <div style={styles.heroTopline}><span style={styles.liveMark} /> SUA CENTRAL DE ATIVIDADES</div>
          <div style={styles.heroTitleRow}>
            <div>
              <h1 style={styles.title}>Notificações<span style={styles.titleDot}>.</span></h1>
              <p style={styles.subtitle}>As novidades da sua comunidade, em um só lugar.</p>
            </div>
            <div style={styles.bell}><svg viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></svg></div>
          </div>
          <div style={styles.heroFooter}>
            <div style={styles.unreadSummary}>
              <strong style={styles.count}>{naoLidas.toString().padStart(2,'0')}</strong>
              <span style={styles.countLabel}>{naoLidas === 1 ? 'NOVIDADE NÃO LIDA' : 'NOVIDADES NÃO LIDAS'}</span>
            </div>
            {naoLidas > 0 && (
              <button onClick={marcarTodasComoLidas} disabled={salvando} style={styles.readAll}>
                {salvando ? 'Atualizando...' : 'Marcar todas como lidas'} <span>↗</span>
              </button>
            )}
          </div>
        </section>

        <div style={styles.filterRow} role="tablist" aria-label="Filtrar notificações">
          <button role="tab" aria-selected={filtro === 'todas'} onClick={() => setFiltro('todas')} style={filtro === 'todas' ? styles.filterActive : styles.filter}>Todas <span>{notificacoes.length}</span></button>
          <button role="tab" aria-selected={filtro === 'nao_lidas'} onClick={() => setFiltro('nao_lidas')} style={filtro === 'nao_lidas' ? styles.filterActive : styles.filter}>Não lidas <span>{naoLidas}</span></button>
          <span style={styles.filterCaption}>ATUALIZAÇÕES</span>
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
  page: { minHeight: '100vh', background: '#05070D', color: '#F5F6FA', paddingBottom: 112, fontFamily: 'Inter,system-ui,sans-serif' },
  shell: { maxWidth: 820, margin: '0 auto', padding: '17px 18px 40px' },
  topbar: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px 2px 18px', marginBottom:22, borderBottom:'1px solid #FFFFFF12' },
  back: { display:'inline-flex', alignItems:'center', gap:8, color:'#AAB2C3', textDecoration:'none', fontSize:12, fontWeight:650 },
  backArrow: { fontSize:22, lineHeight:1, color:'#E8C66A' },
  topBrand: { color:'#E7EAF1', fontSize:9, letterSpacing:2.2, fontWeight:900 },
  hero: { position:'relative', overflow:'hidden', padding:'30px 27px 21px', borderRadius:25, border:'1px solid #FFFFFF1A', background:'linear-gradient(125deg,#171B25 0%,#10141D 52%,#181713 100%)', boxShadow:'0 24px 70px #00000055' },
  heroGlow: { position:'absolute', width:260, height:260, borderRadius:'50%', right:-100, top:-160, background:'#D9B65A1C', filter:'blur(24px)', pointerEvents:'none' },
  heroTopline: { position:'relative', display:'flex', alignItems:'center', gap:8, color:'#B8A16A', fontSize:9, fontWeight:850, letterSpacing:2.1, marginBottom:17 },
  liveMark: { width:6, height:6, borderRadius:'50%', background:'#D9B65A', boxShadow:'0 0 12px #D9B65A99' },
  heroTitleRow: { position:'relative', display:'flex', alignItems:'center', justifyContent:'space-between', gap:14 },
  title: { fontSize:'clamp(30px,7vw,43px)', lineHeight:1.03, letterSpacing:-1.8, fontWeight:760, margin:0 },
  titleDot: { color:'#D9B65A' },
  subtitle: { color:'#A6ADBA', fontSize:12, lineHeight:1.6, margin:'10px 0 0', maxWidth:350 },
  bell: { width:58, height:58, flexShrink:0, borderRadius:19, display:'grid', placeItems:'center', background:'linear-gradient(145deg,#E8D39B,#B9954B)', color:'#17140D', boxShadow:'0 10px 32px #D9B65A24' },
  heroFooter: { position:'relative', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginTop:25, paddingTop:17, borderTop:'1px solid #FFFFFF17' },
  unreadSummary: { display:'flex', alignItems:'center', gap:10 },
  count: { fontSize:25, color:'#E5C77A', fontWeight:800, fontVariantNumeric:'tabular-nums', letterSpacing:-1 },
  countLabel: { color:'#8E96A5', fontSize:8, letterSpacing:1.2, fontWeight:800, maxWidth:95, lineHeight:1.4 },
  readAll: { border:'1px solid #D9B65A55', background:'#D9B65A12', color:'#E9D49D', padding:'10px 13px', borderRadius:999, fontSize:9, fontWeight:800, cursor:'pointer' },
  filterRow: { display:'flex', alignItems:'center', gap:7, margin:'21px 0 15px', padding:'5px 5px 5px 6px', borderRadius:999, background:'#0D1119', border:'1px solid #FFFFFF12' },
  filter: { border:0, borderRadius:999, padding:'10px 15px', background:'transparent', color:'#858E9E', fontSize:10, fontWeight:750, cursor:'pointer' },
  filterActive: { border:0, borderRadius:999, padding:'10px 16px', background:'linear-gradient(135deg,#E8D39B,#C4A45D)', color:'#17140D', fontSize:10, fontWeight:900, cursor:'pointer', boxShadow:'0 3px 14px #D9B65A20' },
  filterCaption: { marginLeft:'auto', marginRight:10, color:'#596273', fontSize:8, letterSpacing:1.4, fontWeight:800 },
  list: { display:'grid', gap:8 },
  link: { textDecoration:'none', color:'inherit' },
  notification: { position:'relative', display:'flex', alignItems:'center', gap:14, padding:'16px 15px', borderRadius:17, background:'linear-gradient(110deg,#10151F,#0B0F17)', border:'1px solid #FFFFFF0D', transition:'border-color .2s, transform .2s' },
  unread: { background:'linear-gradient(110deg,#171B25,#10141C)', border:'1px solid #D9B65A45', boxShadow:'inset 3px 0 0 #D9B65A' },
  avatarWrap: { width:45, height:45, borderRadius:'50%', flexShrink:0, overflow:'hidden', display:'grid', placeItems:'center', background:'#252A35', border:'1px solid #FFFFFF20' },
  avatar: { width:'100%', height:'100%', objectFit:'cover' },
  avatarFallback: { color:'#E4C779', fontWeight:850, fontSize:16 },
  notificationBody: { flex:1, minWidth:0 },
  notificationText: { color:'#DDE1E9', fontSize:12, lineHeight:1.6 },
  meta: { display:'flex', alignItems:'center', gap:7, color:'#727B8B', fontSize:9, marginTop:6, letterSpacing:.2 },
  dot: { color:'#596273' },
  typeIcon: { width:34, height:34, borderRadius:12, border:'1px solid', display:'grid', placeItems:'center', fontSize:15, flexShrink:0 },
  unreadDot: { width:6, height:6, borderRadius:'50%', background:'#E3C477', position:'absolute', top:12, right:12, boxShadow:'0 0 10px #E3C47788' },
  empty: { marginTop:14, padding:'54px 24px', textAlign:'center', borderRadius:22, background:'radial-gradient(circle at 50% 0%,#1A1D25,#0C1018 70%)', border:'1px solid #FFFFFF12' },
  loader: { color:'#D9B65A', fontSize:26, marginBottom:10 },
  emptyIcon: { width:60, height:60, margin:'0 auto 17px', borderRadius:20, display:'grid', placeItems:'center', background:'#D9B65A16', color:'#E4C779', fontSize:27 },
  emptyTitle: { fontSize:18, fontWeight:800, letterSpacing:-.4, margin:'0 0 8px' },
  emptyText: { maxWidth:330, margin:'0 auto', color:'#929BAA', fontSize:11, lineHeight:1.8 },
  emptyLink: { display:'inline-flex', gap:8, alignItems:'center', marginTop:20, color:'#E3C477', textDecoration:'none', fontSize:10, fontWeight:850, letterSpacing:.2 },
  error: { padding:13, marginBottom:12, borderRadius:12, background:'#351D24', color:'#FFC4C9', fontSize:12 },
  muted: { color:'#A9B4CC', textAlign:'center', padding:30 }
}
