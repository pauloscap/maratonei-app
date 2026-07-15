export const MOCK_RANKING = [
  { nome:"MaratonistaPro", xp:2450, nivel:17, horas:210 },
  { nome:"CinefiloRaiz", xp:1980, nivel:14, horas:165 },
  { nome:"SeriesLover", xp:1720, nivel:12, horas:142 },
  { nome:"VoceAqui", xp:0, nivel:1, horas:0, isYou:true },
  { nome:"BingeMaster", xp:1560, nivel:11, horas:130 },
  { nome:"NoiteEmClaro", xp:1340, nivel:9, horas:110 },
  { nome:"PopcornKing", xp:980, nivel:7, horas:85 },
]

export function ordenarRanking(lista) {
  return [...lista].sort((a,b)=> b.xp - a.xp).map((u,i)=>({...u, pos:i+1}))
}
