'use client' // ← IMPORTANTE: isso faz o JavaScript rodar no navegador
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
)

export default function Home() {
  const [aba, setAba] = useState('series')
  const [view, setView] = useState('grade')
  const [series, setSeries] = useState([])
  const [filmes, setFilmes] = useState([])

  useEffect(() => {
    async function buscarDados() {
      const { data } = await supabase
        .from('series')
        .select('*')
        .order('nota', { ascending: false })
      
      if (data) {
        setSeries(data.filter(s => s.tipo !== 'filme'))
        setFilmes(data.filter(s => s.tipo === 'filme'))
      }
    }
    buscarDados()
  }, [])

  function trocarAba(novaAba) {
    setAba(novaAba)
    // Muda a cor do menu lá embaixo
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.remove('active')
      el.classList.add('inactive')
    })
    document.querySelector(`[data-tab="${novaAba}"]`).classList.add('
