'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
)

export default function PerfilPublico() {
  const params = useParams()
  const router = useRouter()
  const profileId = params.id

  const [user, setUser] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [seguindo, setSeguindo] = useState(false)
  const [seguidores, setSeguidores] = useState(0)
  const [seguindoCount, setSeguindoCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [savingFollow, setSavingFollow] = useState(false)
  const [error, setError] = useState('')

  const carregarRelacoes = useCallback(async (viewerId) => {
    const [{ count: followers, error: followersError }, { count: following, error: followingError }] = await Promise.all([
      supabase.from('seguidores').select('id', { count: 'exact', head: true }).eq('seguindo_id', profileId),
      supabase.from('seguidores').select('id', { count: 'exact', head: true }).eq('seguidor_id', profileId)
    ])

    if (!followersError) setSeguidores(followers || 0)
    if (!followingError) setSeguindoCount(following || 0)

    if (viewerId && viewerId !== profileId) {
      const { data } = await supabase
        .from('seguidores')
        .select('id')
        .eq('seguidor_id', viewerId)
        .eq('seguindo_id', profileId)
        .maybeSingle()
      setSeguindo(!!data)
    } else {
      setSeguindo(false)
    }
  }, [profileId])

  useEffect(() => {
    let ativo = true

    async function carregar() {
      setLoading(true)
      setError('')

      const [{ data: sessionData }, { data: profileData, error: profileError }] = await Promise.all([
        supabase.auth.getSession(),
        supabase.from('profiles')
          .select('id, username, nome, avatar_url, bio, criado_em')
          .eq('id', profileId)
          .maybeSingle()
      ])

      if (!ativo) return
      const viewer = sessionData?.session?.user || null
      setUser(viewer)

      if (profileError || !profileData) {
        setError('Não foi possível encontrar este perfil.')
        setLoading(false)
        return
      }

      setPerfil(profileData)
      await carregarRelacoes(viewer?.id)
      if (ativo) setLoading(false)
    }

    if (profileId) carregar()
    return () => { ativo = false }
  }, [profileId, carregarRelacoes])

  async function toggleSeguir() {
    if (!user) {
      router.push('/login')
      return
    }
    if (!perfil || user.id === profileId || savingFollow) return

    setSavingFollow(true)
    setError('')

    if (seguindo) {
      const { error: deleteError } = await supabase
        .from('seguidores')
        .delete()
        .eq('seguidor_id', user.id)
        .eq('seguindo_id', profileId)

      if (deleteError) {
        setError('Não foi possível deixar de seguir. Tente novamente.')
      } else {
        setSeguindo(false)
        setSeguidores(value => Math.max(0, value - 1))
      }
    } else {
      const { error: insertError } = await supabase
        .from('seguidores')
        .insert({ seguidor_id: user.id, seguindo_id: profileId })

      if (insertError && insertError.code !== '23505') {
        setError('Não foi possível seguir este perfil. Tente novamente.')
      } else {
        setSeguindo(true)
        if (!insertError) setSeguidores(value => value + 1)
      }
    }

    setSavingFollow(false)
  }

  if (loading) {
    return <main className="main"><div className="card" style={{padding:24,color:'#CBD5E1'}}>Carregando perfil...</div></main>
  }

  if (!perfil) {
    return (
      <main className="main">
        <div className="card" style={{padding:24}}>
          <p style={{color:'#F8FAFC',marginBottom:16}}>{error || 'Perfil não encontrado.'}</p>
          <Link href="/feed" style={{color:'#FFD400',textDecoration:'none'}}>Voltar para Amigos</Link>
        </div>
      </main>
    )
  }

  const nome = perfil.nome || 'Maratoneiro'
  const avatar = perfil.avatar_url?.startsWith('http') ? perfil.avatar_url : ''

  return (
    <main className="main" style={{maxWidth:720,paddingBottom:100}}>
      <Link href="/feed" style={{color:'#FFD400',textDecoration:'none',display:'inline-block',marginBottom:18}}>
        ← Voltar para Amigos
      </Link>

      <section style={{background:'linear-gradient(145deg,#171F3D,#10162D)',border:'1px solid #ffffff14',borderRadius:22,padding:22}}>
        <div style={{display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
          <div style={{width:88,height:88,borderRadius:'50%',overflow:'hidden',background:'#26304F',border:'2px solid #FFD400',display:'grid',placeItems:'center',flexShrink:0}}>
            {avatar
              ? <img src={avatar} alt={nome} style={{width:'100%',height:'100%',objectFit:'cover'}} />
              : <span style={{fontSize:32,fontWeight:800,color:'#FFD400'}}>{nome.slice(0,1).toUpperCase()}</span>}
          </div>

          <div style={{flex:1,minWidth:180}}>
            <h1 style={{fontSize:25,color:'#fff',fontWeight:900,marginBottom:4}}>{nome}</h1>
            {perfil.username && <p style={{fontSize:13,color:'#AAB4CE'}}>@{perfil.username}</p>}
            {perfil.bio && <p style={{fontSize:14,color:'#CBD5E1',lineHeight:1.6,marginTop:10}}>{perfil.bio}</p>}
          </div>

          {user?.id !== profileId && (
            <button
              onClick={toggleSeguir}
              disabled={savingFollow}
              style={{
                border: seguindo ? '1px solid #FFD400' : 'none',
                borderRadius:999,
                padding:'11px 22px',
                background: seguindo ? '#202A49' : '#FFD400',
                color: seguindo ? '#FFD400' : '#080B1F',
                fontWeight:900,
                cursor:savingFollow?'wait':'pointer',
                opacity:savingFollow?0.7:1
              }}
            >
              {savingFollow ? 'Aguarde...' : seguindo ? 'Seguindo ✓' : 'Seguir +'}
            </button>
          )}
        </div>

        <div style={{display:'flex',gap:30,marginTop:24,borderTop:'1px solid #ffffff12',paddingTop:18}}>
          <div>
            <strong style={{display:'block',fontSize:22,color:'#FFD400'}}>{seguidores}</strong>
            <span style={{fontSize:12,color:'#AAB4CE'}}>Seguidores</span>
          </div>
          <div>
            <strong style={{display:'block',fontSize:22,color:'#FFD400'}}>{seguindoCount}</strong>
            <span style={{fontSize:12,color:'#AAB4CE'}}>Seguindo</span>
          </div>
        </div>
        {error && <p role="alert" style={{color:'#FCA5A5',fontSize:13,marginTop:14}}>{error}</p>}
      </section>

      <section style={{marginTop:18,background:'#111831',border:'1px solid #ffffff12',borderRadius:18,padding:20}}>
        <h2 style={{fontSize:16,color:'#fff',marginBottom:8}}>Atividade no Maratonei</h2>
        <p style={{fontSize:13,color:'#AAB4CE',lineHeight:1.6}}>
          O histórico público de filmes, séries e episódios será exibido aqui conforme as próximas etapas do Maratonei Social forem ativadas.
        </p>
      </section>
    </main>
  )
}
