"use client"
import { useEffect, useState } from "react"
import { BottomNav } from "../../components/BottomNav"
import { MOCK_RANKING, ordenarRanking } from "../../lib/rankingLogic"

export default function Ranking(){
const [rank,setRank]=useState([])
useEffect(()=>{const nome=localStorage.getItem("perfil-nome")||"Você";let xp=0,hr=0,m=0;for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k?.includes("status-")&&localStorage.getItem(k)=="ja_assisti")m++;if(k?.startsWith("progress-")){try{hr+=JSON.parse(localStorage.getItem(k)||"[]").length*0.7}catch{}}}const c=JSON.parse(localStorage.getItem("checkins")||"[]");xp=m*100+Math.floor(hr*5)+c.length*15;const nivel=Math.max(1,Math.floor(xp/150)+1);const lista=MOCK_RANKING.map(u=>u.isYou?{...u,nome,xp,nivel,horas:Math.round(hr)}:u);setRank(ordenarRanking(lista))},[])
const top3=rank.slice(0,3)
const resto=rank.slice(3)
const eu=rank.find(r=>r.nome===(localStorage.getItem("perfil-nome")||"Você"))
return(<div className="min-h-screen bg-[#080B1F] text-white pb-24"><header className="h-14 flex items-center px-4 border-b border-white/10 sticky top-0 bg-[#080B1F] z-10 font-bold">🏆 Ranking Global</header><main className="max-w- mx-auto p-3.5 flex flex-col gap-3">
<div className="bg-gradient-to-br from-[#1A2142] to-[#12182F] border border-yellow-400/20 rounded-2xl p-4"><div className="text- opacity-60">TOP 3 MARATONISTAS DA SEMANA</div><div className="grid grid-cols-3 gap-2 mt-3 items-end">{top3.map((u,i)=><div key={u.nome} className={`text-center ${i==1?"order-2":""} ${i==0?"order-1 translate-y-2":""} ${i==2?"order-3 translate-y-3":""}`}><div className={`mx-auto w-14 h-14 rounded-full grid place-items-center font-black text-black border-2 ${i==1?"bg-yellow-400 border-yellow-400 w-16 h-16":""} ${i==0?"bg-zinc-300 border-zinc-300":""} ${i==2?"bg-orange-400 border-orange-400":""}`}>{u.nome[0]}</div><div className="text- font-bold mt-1.5 truncate">{u.nome}</div><div className="text- opacity-50">{u.xp} XP</div><div className="text- mt-1">{i==1?"🥇":i==0?"🥈":"🥉"}</div></div>)}</div></div>
<div className="bg-[#12182F] border border-white/10 rounded-2xl p-2">{resto.map(u=><div key={u.nome} className={`flex items-center justify-between p-3 rounded-xl ${u.nome===eu?.nome?"bg-yellow-400/10 border border-yellow-400/30":"border border-transparent"}`}><div className="flex items-center gap-3"><div className="w-6 text- font-black opacity-40">#{u.pos}</div><div className="w-8 h-8 rounded-full bg-white/10 grid place-items-center font-bold text-xs">{u.nome[0]}</div><div><div className="text- font-bold">{u.nome} {u.nome===eu?.nome&&<span className="text- bg-yellow-400 text-black px-1.5 py-0.5 rounded-full ml-1">VOCÊ</span>}</div><div className="text- opacity-40">Nv {u.nivel} • {u.horas}h</div></div></div><div className="text- font-black">{u.xp} XP</div></div>)}</div>
{eu&&<div className="bg-[#12182F] border border-yellow-400/30 rounded-2xl p-3.5 flex items-center justify-between"><div><div className="text-xs opacity-50">Sua posição</div><div className="font-black">#{eu.pos} • Nível {eu.nivel} • {eu.xp} XP</div><div className="text- opacity-40 mt-1">Falta {150-(eu.xp%150)} XP pro próximo nível</div></div><div className="text-2xl">🔥</div></div>}
<div className="text- opacity-30 text-center mt-2">Ranking atualiza toda segunda. Faça check-ins pra subir!</div>
</main><BottomNav/></div>)}
