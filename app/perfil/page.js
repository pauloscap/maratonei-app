"use client"
import { useEffect, useState, useMemo } from "react"
import { getSupa } from "../../lib/supabase";
import { BottomNav } from "../../components/BottomNav"

const supabase = getSupa();}
          <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginTop:12}}>
            {CONQUISTAS.map(c=>{ const desbloq = streak>=c.min &&!streakQuebrado; return (
              <div key={c.id} onClick={()=> desbloq && abrirShareSelo(c)} style={{background: desbloq? "#FFD40014" : "#ffffff06", border: desbloq? "1px solid #FFD40044" : "1px solid #ffffff10", borderRadius:12, padding:10, textAlign:"center", opacity: desbloq? 1 : 0.35, cursor: desbloq? "pointer" : "default"}}>
                <div style={{fontSize:22}}>{c.emoji}</div>
                <div style={{fontSize:10, fontWeight:800, marginTop:4}}>{c.nome}</div>
                {desbloq && <div style={{fontSize:8, color:"#FFD400", marginTop:4, fontWeight:800}}>COMPARTILHAR</div>}
              </div>
            )})}
          </div>
          <div onClick={()=>setShowPuzzle(true)} style={{marginTop:12, background:"#FFD400", color:"#000", borderRadius:10, padding:"8px 10px", fontSize:11, textAlign:"center", fontWeight:900, cursor:"pointer"}}>🧩 Ver quebra-cabeça • {pecasDesbloqueadas}/30 peças</div>
        </div>

        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
          <div style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:16, padding:14}}><div style={{fontSize:11, opacity:0.5}}>📺 Séries</div><div style={{fontSize:22, fontWeight:900}}>{stats.seriesTotal}</div><div style={{fontSize:11, opacity:0.6}}>{stats.seriesMaratonadas} maratonadas • {stats.horasSeries}h</div></div>
          <div style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:16, padding:14}}><div style={{fontSize:11, opacity:0.5}}>🎬 Filmes</div><div style={{fontSize:22, fontWeight:900}}>{stats.filmesTotal}</div><div style={{fontSize:11, opacity:0.6}}>{stats.filmesVistos} assistidos • {stats.horasFilmes}h</div></div>
        </div>

        <div style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:18, padding:14}}>
          <div style={{fontWeight:800,fontSize:13,marginBottom:10,display:"flex",justifyContent:"space-between"}}><span>Calendário • {calendario.mesNome} {calendario.ano}</span><span style={{fontSize:11,opacity:.4}}>{cks.length} check-ins</span></div>
          <div style={{display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, marginBottom:6}}>{["D","S","T","Q","Q","S","S"].map((d,i)=><div key={i} style={{textAlign:"center", fontSize:10, opacity:0.4, fontWeight:700}}>{d}</div>)}</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6}}>
            {calendario.dias.map((d,i)=>{ if(!d) return <div key={i}/>; const iso=d.toISOString().slice(0,10); const ok=cks.includes(iso); const hoje=iso===hojeISO(); return <div key={i} style={{aspectRatio:"1",borderRadius:8,background:ok?"#FFD400":hoje?"#ffffff22":"#ffffff0e",display:"grid",placeItems:"center",fontSize:12,fontWeight:ok?800:400,color:ok?"#000":"#ffffff88", border: hoje &&!ok? "1px dashed #FFD40088" : "0"}}>{ok? "✓" : d.getDate()}</div> })}
          </div>
        </div>
      </main>

      {showShare && shareData && (
        <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.9)", backdropFilter:"blur(12px)", zIndex:10002, padding:14, display:"grid", placeItems:"center"}}>
          <div style={{width:"100%", maxWidth:400, background:"#12182F", border:"1px solid #ffffff18", borderRadius:20, padding:18}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14}}>
              <b>Compartilhar conquista</b>
              <button onClick={()=>setShowShare(false)} style={{width:32,height:32,borderRadius:999,background:"#ffffff12",border:"1px solid #ffffff15",color:"#fff"}}>✕</button>
            </div>
            <div style={{background: "#1A2142", border:`1px solid ${shareData.cor}44`, borderRadius:16, padding:20, textAlign:"center"}}>
              <div style={{fontSize:64}}>{shareData.emoji}</div>
              <div style={{fontSize:18, fontWeight:900, marginTop:8}}>{shareData.titulo}</div>
              <div style={{fontSize:12, opacity:0.6, marginTop:4}}>{shareData.subtexto}</div>
              <div style={{marginTop:12, fontSize:11, background:"#ffffff10", padding:"8px", borderRadius:8}}>{shareData.texto}</div>
            </div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:14}}>
              <button onClick={()=>compartilhar('whatsapp')} style={{background:"#25D366", color:"#fff", border:0, borderRadius:999, padding:"12px", fontWeight:800, fontSize:12}}>WhatsApp</button>
              <button onClick={()=>compartilhar('twitter')} style={{background:"#fff", color:"#000", border:0, borderRadius:999, padding:"12px", fontWeight:800, fontSize:12}}>X / Twitter</button>
              <button onClick={()=>compartilhar('copiar')} style={{background:"#ffffff12", color:"#fff", border:"1px solid #ffffff20", borderRadius:999, padding:"12px", fontWeight:800, fontSize:12}}>🔗 Copiar</button>
              <button onClick={baixarImagemShare} style={{background:"#FFD400", color:"#000", border:0, borderRadius:999, padding:"12px", fontWeight:900, fontSize:12}}>⬇ Imagem</button>
            </div>
          </div>
        </div>
      )}

      {showFoto && (
        <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", backdropFilter:"blur(8px)", zIndex:10000, padding:14, overflowY:"auto"}}>
          <div style={{maxWidth:560, margin:"0 auto", background:"#12182F", border:"1px solid #ffffff18", borderRadius:18, padding:14}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
              <b>Escolha seu personagem</b>
              <button onClick={()=>setShowFoto(false)} style={{width:32,height:32,borderRadius:999,background:"#ffffff12",border:"1px solid #ffffff15",color:"#fff"}}>✕</button>
            </div>
            <button onClick={()=>{ setAvatarEmoji(null); setFoto(fotoOriginal); setShowFoto(false); localStorage.removeItem(user.id+":avatar_emoji"); supabase.from("perfis").upsert({ user_id:user.id, avatar_url:fotoOriginal, nome }, {onConflict:"user_id"}) }} style={{width:"100%", padding:12, borderRadius:12, background:"#ffffff10", border:"1px solid #ffffff15", color:"#fff", fontSize:13, fontWeight:700, marginBottom:14}}>Foto do Gmail</button>
            <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10}}>
              {PERSONAGENS_EMOJI.map(p=>(
                <div key={p.nome} onClick={()=>escolherEmoji(p)} style={{cursor:"pointer", aspectRatio:"1", borderRadius:14, overflow:"hidden", background:p.cor, border:"1px solid #ffffff15", display:"grid", placeItems:"center", fontSize:36}}>
                  {p.emoji}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showPuzzle && (
        <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.9)", backdropFilter:"blur(10px)", zIndex:10001, padding:14, overflowY:"auto"}}>
          <div style={{maxWidth:560, margin:"0 auto"}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
              <b style={{fontSize:16}}>Desafio de outubro</b>
              <button onClick={()=>setShowPuzzle(false)} style={{width:32,height:32,borderRadius:999,background:"#ffffff12",border:"1px solid #ffffff15",color:"#fff"}}>✕</button>
            </div>
            <div style={{background:"#12182F", border:"1px solid #FFD40033", borderRadius:16, padding:12, marginBottom:12}}>
              <div style={{fontSize:12, lineHeight:1.5, fontWeight:700}}>Desafio de outubro</div>
              <div style={{fontSize:12, lineHeight:1.5, marginTop:4}}>Série do mês: Os Anéis de Poder - 3ª temporada. Complete os check-ins diários para liberar as peças. Cada check-in = 1 peça.</div>
              <div style={{marginTop:10, display:"flex", gap:8, alignItems:"center"}}>
                <img src={posterOutubro} alt="Os Anéis de Poder - 3ª temporada" style={{width:56, height:84, borderRadius:8, objectFit:"cover", border:"1px solid #ffffff15"}} />
                <div style={{flex:1}}>
                  <div style={{fontSize:13, fontWeight:900}}>Os Anéis de Poder • 3ª temporada</div>
                  <div style={{fontSize:11, opacity:0.6, marginTop:2}}>Série do mês de outubro • 30 peças para liberar</div>
                  <div style={{marginTop:8, height:6, background:"#ffffff14", borderRadius:99, overflow:"hidden"}}><div style={{width:`${(pecasDesbloqueadas/30)*100}%`, height:"100%", background:"#FFD400"}}/></div>
                  <div style={{fontSize:10, opacity:0.5, marginTop:4}}>{pecasDesbloqueadas}/30 peças</div>
                </div>
              </div>
              {pecasDesbloqueadas===30 && <button onClick={abrirShareBanner} style={{width:"100%", marginTop:10, background:"#22c55e", color:"#fff", border:0, borderRadius:10, padding:"10px", fontWeight:900, fontSize:12}}>↗ Compartilhar Desafio Completo</button>}
            </div>
            <div style={{background:"#000", borderRadius:16, overflow:"hidden", border:"1px solid #ffffff15"}}>
              <div style={{display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:2, background:"#000", padding:2}}>
                {Array.from({length:30}).map((_,i)=>{
                  const liberada = i < pecasDesbloqueadas
                  const col = i % 5
                  const row = Math.floor(i / 5)
                  return (
                    <div key={i} style={{
                      aspectRatio:"3/4",
                      position:"relative",
                      overflow:"hidden",
                      background:"#111",
                      borderRadius:4,
                      backgroundImage:`url(${posterOutubro})`,
                      backgroundSize:"500% 600%",
                      backgroundPosition:`${col * 25}% ${row * 20}%`,
                      filter: liberada? "none" : "blur(12px) brightness(0.25)"
                    }}>
                      {!liberada && <div style={{position:"absolute", inset:0, display:"grid", placeItems:"center", fontSize:16, background:"rgba(0,0,0,0.45)"}}>🔒</div>}
                    </div>
                  )
                })}
              </div>
            </div>
            {pecasDesbloqueadas===30 && <div style={{marginTop:12, background:"#22c55e", color:"#fff", borderRadius:12, padding:"12px", textAlign:"center", fontWeight:900}}>🎉 Você completou o cartaz de Os Anéis de Poder! Desafio de Outubro concluído!</div>}
          </div>
        </div>
      )}

      <BottomNav/>
    </div>
  )
}
