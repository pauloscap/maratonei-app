export const hojeISO=()=>new Date().toISOString().slice(0,10)
export function calcXP(mar,horas,fTotal,checks){return mar*100+Math.floor(horas*5)+fTotal*30+checks*15}
export function getDias(){return Array.from({length:30},(_,i)=>{const d=new Date();d.setDate(new Date().getDate()-(29-i));return d.toISOString().slice(0,10)})}
