'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)
const EMOJIS = {
  Barbie:{emoji:'💖',cor:'#ff69b4'}, Naruto:{emoji:'🍥',cor:'#ff8c00'}, Stitch:{emoji:'👽',cor:'#2a7fff'},
  Wandinha:{emoji:'🖤',cor:'#1a1a1a'}, 'Harry Potter':{emoji:'⚡',cor:'#7a0000'},
  'Homem-Aranha':{emoji:'🕷',cor:'#b00000'}, Luffy:{emoji:'👒',cor:'#d00000'},
  Pikachu:{emoji:'⚡',cor:'#ffcc00'}, Batman:{emoji:'🦇',cor:'#111111'},
  Deadpool:{emoji:'🗡',cor:'#a00000'}, Grogu:{emoji:'👶',cor:'#7ab000'}, Eleven:{emoji:'🧇',cor:'#e00000'}
}

export default function PerfilPublico() {
  const params = useParams()
  const router = useRouter()
  const profileId = params.id
  const [user,setUser] = useState(null)
  const [perfil,setPerfil] = useState(null)
  const [seguindo,setSeguindo] = useState(false)
  const [seguidores,setSeguidores] = useState(0)
  const [seguindoCount,setSeguindoCount] = useState(0)
  const [loading,setLoading] = useState(true)
  const [savingFollow,setSavingFollow] = useState(false)
  const [error,setError] = useState('')
  const [stats,setStats] = useState({filmes:0,series:0,horasFilmes:0,horasSeries:0})
  const [ultimosFilmes,setUltimosFilmes] = useState([])
  const [ultimasSeries,setUltimasSeries] = useState([])
  const [abaAtiva,setAbaAtiva] = useState('filmes')

  const carregarRelacoes = useCallback(async(viewerId) => {
    const [{count:followers,error:followersError},{count:following,error:followingError}] = await Promise.all([
      supabase.from('seguidores').select('id',{count:'exact',head:true}).eq('seguindo_id',profileId),
      supabase.from('seguidores').select('id',{count:'exact',head:true}).eq('seguidor_id',profileId)
    ])
    if(!followersError) setSeguidores(followers||0)
    if(!followingError) setSeguindoCount(following||0)
    if(viewerId && viewerId!==profileId){
      const {data} = await supabase.from('seguidores').select('id').eq('seguidor_id',viewerId).eq('seguindo_id',profileId).maybeSingle()
      setSeguindo(!!data)
    } else setSeguindo(false)
  },[profileId])

  useEffect(()=>{
    let ativo=true
    async function carregar(){
      setLoading(true); setError('')
      const [{data:sessionData},{data:profileData,error:profileError},{data:legacyData}] = await Promise.all([
        supabase.auth.getSession(),
        supabase.from('profiles').select('id,username,nome,avatar_url,bio,criado_em').eq('id',profileId).maybeSingle(),
        supabase.from('perfis').select('user_id,nome,avatar_url,moldura,xp').eq('user_id',profileId).maybeSingle()
      ])
      if(!ativo) return
      const viewer=sessionData?.session?.user||null
      setUser(viewer)
      if(profileError || (!profileData && !legacyData)){
        setError('Não foi possível encontrar este perfil.'); setLoading(false); return
      }
      const avatarRaw=legacyData?.avatar_url||profileData?.avatar_url||''
      const emojiNome=avatarRaw.startsWith('emoji:')?avatarRaw.slice(6):''
      setPerfil({
        id:profileId,
        nome:profileData?.nome||legacyData?.nome||'Maratoneiro',
        username:profileData?.username||null,
        bio:profileData?.bio||'',
        avatarUrl:avatarRaw.startsWith('http')?avatarRaw:'',
        avatarEmoji:EMOJIS[emojiNome]||null,
        xp:legacyData?.xp||0,
        moldura:legacyData?.moldura||'padrao'
      })
      const [{data:filmesData,error:filmesError},{data:seriesData,error:seriesError}] = await Promise.all([
        supabase.from('user_filmes').select('id,titulo,img,status,runtime,updated_at,data_assistido').eq('user_id',profileId).order('data_assistido',{ascending:false,nullsFirst:false}).order('updated_at',{ascending:false}).limit(100),
        supabase.from('user_series').select('id,titulo,img,status,eps_vistos,updated_at').eq('user_id',profileId).order('updated_at',{ascending:false}).limit(100)
      ])
      if(ativo){
        const filmes = filmesError ? [] : (filmesData||[])
        const series = seriesError ? [] : (seriesData||[])
        const vistos = filmes.filter(f=>f.status==='ja_assisti')
        const seriesComProgresso = series.filter(x=>x.status==='maratonei' || (Array.isArray(x.eps_vistos) ? x.eps_vistos.length>0 : false))
        const horasFilmes = vistos.reduce((total,f)=>total+((Number(f.runtime)||120)/60),0)
        const horasSeries = series.reduce((total,x)=>total+(Array.isArray(x.eps_vistos)?x.eps_vistos.length:0)*0.75,0)
        setStats({filmes:vistos.length,series:seriesComProgresso.length,horasFilmes:Math.round(horasFilmes),horasSeries:Math.round(horasSeries)})
        setUltimosFilmes(vistos.slice(0,12))
        setUltimasSeries(seriesComProgresso.slice(0,12))
      }
      await carregarRelacoes(viewer?.id)
      if(ativo) setLoading(false)
    }
    if(profileId) carregar()
    return ()=>{ativo=false}
  },[profileId,carregarRelacoes])

  async function toggleSeguir(){
    if(!user){router.push('/login');return}
    if(!perfil||user.id===profileId||savingFollow)return
    setSavingFollow(true);setError('')
    if(seguindo){
      const {error:deleteError}=await supabase.from('seguidores').delete().eq('seguidor_id',user.id).eq('seguindo_id',profileId)
      if(deleteError) setError('Não foi possível deixar de seguir. Tente novamente.')
      else {setSeguindo(false);setSeguidores(v=>Math.max(0,v-1))}
    }else{
      const {error:insertError}=await supabase.from('seguidores').insert({seguidor_id:user.id,seguindo_id:profileId})
      if(insertError && insertError.code!=='23505') setError('Não foi possível seguir este perfil. Tente novamente.')
      else {setSeguindo(true);if(!insertError)setSeguidores(v=>v+1)}
    }
    setSavingFollow(false)
  }

  if(loading) return <main className="main"><div className="card" style={{padding:24,color:'#CBD5E1'}}>Carregando perfil...</div></main>
  if(!perfil) return <main className="main"><div className="card" style={{padding:24}}><p style={{color:'#F8FAFC',marginBottom:16}}>{error||'Perfil não encontrado.'}</p><Link href="/feed" style={{color:'#FFD400',textDecoration:'none'}}>Voltar para Amigos</Link></div></main>

  return (
    <main className="main" style={{maxWidth:720,paddingBottom:100}}>
      <Link href="/feed" style={{color:'#FFD400',textDecoration:'none',display:'inline-block',marginBottom:18}}>← Voltar para Amigos</Link>
      <section style={{background:'linear-gradient(145deg,#171F3D,#10162D)',border:'1px solid #ffffff14',borderRadius:22,padding:22}}>
        <div style={{display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
          <div style={{width:88,height:88,borderRadius:'50%',overflow:'hidden',background:perfil.avatarEmoji?.cor||'#26304F',border:'2px solid #FFD400',display:'grid',placeItems:'center',flexShrink:0}}>
            {perfil.avatarUrl?<img src={perfil.avatarUrl} alt={perfil.nome} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<span style={{fontSize:perfil.avatarEmoji?38:32,fontWeight:800,color:'#FFD400'}}>{perfil.avatarEmoji?.emoji||perfil.nome.slice(0,1).toUpperCase()}</span>}
          </div>
          <div style={{flex:1,minWidth:180}}>
            <h1 style={{fontSize:25,color:'#fff',fontWeight:900,marginBottom:4}}>{perfil.nome}</h1>
            {perfil.username&&<p style={{fontSize:13,color:'#AAB4CE'}}>@{perfil.username}</p>}
            {perfil.bio&&<p style={{fontSize:14,color:'#CBD5E1',lineHeight:1.6,marginTop:10}}>{perfil.bio}</p>}
            <p style={{fontSize:11,color:'#8793B2',marginTop:8}}>Nível de maratona: {Math.max(1,Math.floor(perfil.xp/250)+1)}</p>
          </div>
          {user?.id!==profileId&&<button onClick={toggleSeguir} disabled={savingFollow} style={{border:seguindo?'1px solid #FFD400':'none',borderRadius:999,padding:'11px 22px',background:seguindo?'#202A49':'#FFD400',color:seguindo?'#FFD400':'#080B1F',fontWeight:900,cursor:savingFollow?'wait':'pointer',opacity:savingFollow?0.7:1}}>{savingFollow?'Aguarde...':seguindo?'Seguindo ✓':'Seguir +'}</button>}
        </div>
        <div style={{display:'flex',gap:30,marginTop:24,borderTop:'1px solid #ffffff12',paddingTop:18}}>
          <div><strong style={{display:'block',fontSize:22,color:'#FFD400'}}>{seguidores}</strong><span style={{fontSize:12,color:'#AAB4CE'}}>Seguidores</span></div>
          <div><strong style={{display:'block',fontSize:22,color:'#FFD400'}}>{seguindoCount}</strong><span style={{fontSize:12,color:'#AAB4CE'}}>Seguindo</span></div>
        </div>
        {error&&<p role="alert" style={{color:'#FCA5A5',fontSize:13,marginTop:14}}>{error}</p>}
      </section>
      <section style={{marginTop:18,display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:10}}>
        <div style={{background:'linear-gradient(145deg,#1B2747,#111831)',border:'1px solid #ffffff12',borderRadius:16,padding:16}}>
          <div style={{fontSize:11,color:'#AAB4CE'}}>🎬 Filmes assistidos</div>
          <strong style={{display:'block',fontSize:27,color:'#FFD400',marginTop:5}}>{stats.filmes}</strong>
          <span style={{fontSize:12,color:'#AAB4CE'}}>{stats.horasFilmes} horas de filmes</span>
        </div>
        <div style={{background:'linear-gradient(145deg,#1B2747,#111831)',border:'1px solid #ffffff12',borderRadius:16,padding:16}}>
          <div style={{fontSize:11,color:'#AAB4CE'}}>📺 Séries acompanhadas</div>
          <strong style={{display:'block',fontSize:27,color:'#FFD400',marginTop:5}}>{stats.series}</strong>
          <span style={{fontSize:12,color:'#AAB4CE'}}>{stats.horasSeries} horas de séries</span>
        </div>
      </section>
      <section style={{marginTop:18,background:'#111831',border:'1px solid #ffffff12',borderRadius:18,padding:16}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,marginBottom:14}}>
          <div>
            <h2 style={{fontSize:17,color:'#fff',fontWeight:900}}>O que anda assistindo</h2>
            <p style={{fontSize:12,color:'#8793B2',marginTop:3}}>Últimas atualizações deste perfil</p>
          </div>
          <span style={{fontSize:10,color:'#FFD400',fontWeight:800,letterSpacing:1}}>MARATONEI</span>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:16}}>
          <button onClick={()=>setAbaAtiva('filmes')} style={{padding:'11px 8px',borderRadius:12,border:abaAtiva==='filmes'?'1px solid #FFD400':'1px solid #ffffff14',background:abaAtiva==='filmes'?'#FFD40018':'#ffffff06',color:abaAtiva==='filmes'?'#FFD400':'#AAB4CE',fontWeight:900,cursor:'pointer'}}>🎬 Últimos filmes</button>
          <button onClick={()=>setAbaAtiva('series')} style={{padding:'11px 8px',borderRadius:12,border:abaAtiva==='series'?'1px solid #FFD400':'1px solid #ffffff14',background:abaAtiva==='series'?'#FFD40018':'#ffffff06',color:abaAtiva==='series'?'#FFD400':'#AAB4CE',fontWeight:900,cursor:'pointer'}}>📺 Últimas séries</button>
        </div>
        {abaAtiva==='filmes' ? (
          ultimosFilmes.length ? <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:10}}>
            {ultimosFilmes.map(f=><div key={f.id} style={{minWidth:0}}>
              <div style={{aspectRatio:'2/3',borderRadius:10,overflow:'hidden',background:'#202A49',border:'1px solid #ffffff12'}}>
                {f.img?<img src={f.img} alt={f.titulo||'Filme'} loading="lazy" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<div style={{height:'100%',display:'grid',placeItems:'center',fontSize:28}}>🎬</div>}
              </div>
              <div style={{fontSize:12,color:'#F8FAFC',fontWeight:800,lineHeight:1.35,marginTop:7,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{f.titulo||'Filme'}</div>
              <div style={{fontSize:10,color:'#8793B2',marginTop:3}}>Assistido</div>
            </div>)}
          </div> : <p style={{fontSize:13,color:'#AAB4CE',textAlign:'center',padding:'24px 8px'}}>Ainda não há filmes assistidos por aqui.</p>
        ) : (
          ultimasSeries.length ? <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:10}}>
            {ultimasSeries.map(x=><div key={x.id} style={{minWidth:0}}>
              <div style={{aspectRatio:'2/3',borderRadius:10,overflow:'hidden',background:'#202A49',border:'1px solid #ffffff12'}}>
                {x.img?<img src={x.img} alt={x.titulo||'Série'} loading="lazy" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<div style={{height:'100%',display:'grid',placeItems:'center',fontSize:28}}>📺</div>}
              </div>
              <div style={{fontSize:12,color:'#F8FAFC',fontWeight:800,lineHeight:1.35,marginTop:7,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{x.titulo||'Série'}</div>
              <div style={{fontSize:10,color:'#8793B2',marginTop:3}}>{Array.isArray(x.eps_vistos)?x.eps_vistos.length:0} episódios vistos</div>
            </div>)}
          </div> : <p style={{fontSize:13,color:'#AAB4CE',textAlign:'center',padding:'24px 8px'}}>Ainda não há séries com progresso registrado.</p>
        )}
      </section>
    </main>
  )
}
