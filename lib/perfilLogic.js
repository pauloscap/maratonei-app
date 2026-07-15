export const hojeISO = () => new Date().toISOString().slice(0,10)

export function calcXP(maratonadas, horas, filmes, checkins) {
  return maratonadas * 100 + Math.floor(horas * 5) + filmes * 30 + checkins * 15
}

export function getDias30() {
  const arr = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    arr.push(d.toISOString().slice(0,10))
  }
  return arr
}

// alias pra não quebrar quem chama getDias
export const getDias = getDias30

export function calcStreak(checkins) {
  let seq = 0
  const hoje = new Date()
  for (let i = 0; i < 30; i++) {
    const d = new Date()
    d.setDate(hoje.getDate() - i)
    const iso = d.toISOString().slice(0,10)
    if (checkins.includes(iso)) seq++
    else if (i > 0) break
  }
  return seq
}
