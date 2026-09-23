"use client"
import { useEffect, useState } from "react"
export default function AdminPage(){
  const [users,setUsers]=useState<any[]>([])
  useEffect(()=>{
    fetch("/api/admin/users").then(r=>r.json()).then(j=>setUsers(j.users||[]))
  },[])
  return <div style={{background:"#0a0a0a",color:"white",padding:20}}>
    <h1>TESTE - {users.length} usuarios</h1>
    {users.map(u=> <div key={u.id}>{u.nome} - {u.criado_em}</div>)}
  </div>
}
