export const MOLDURAS = [
  { id:"padrao", nome:"Padrão", nivel:1, borda:"border-white/10", preview:"#ffffff20" },
  { id:"bronze", nome:"Bronze", nivel:2, borda:"border-orange-400", preview:"#fb923c" },
  { id:"prata", nome:"Prata", nivel:5, borda:"border-zinc-300", preview:"#d4d4d8" },
  { id:"ouro", nome:"Ouro", nivel:8, borda:"border-yellow-400", preview:"#facc15" },
  { id:"neon", nome:"Neon Roxa", nivel:12, borda:"border-fuchsia-500 shadow-[0_0_15px_#d946ef]", preview:"#d946ef" },
  { id:"fogo", nome:"Chama Lendária", nivel:20, borda:"border-red-500 shadow-[0_0_20px_#ef4444] animate-pulse", preview:"#ef4444" },
]

export function getDesbloqueadas(nivel) {
  return MOLDURAS.filter(m => nivel >= m.nivel)
}
export function getMoldura(id) {
  return MOLDURAS.find(m => m.id === id) || MOLDURAS[0]
}
