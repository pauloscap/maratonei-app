'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
)

export default function Exportar() {
  const [user, setUser] = useState(null)
  const [gerando, setGerando] = useState(false)
  const [dadosProntos, setDadosProntos] = useState(null)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
    } else {
      setUser(session.user)
    }
  }

  async function gerarCSV() {
    setGerando(true)

    try {
      // 1. Busca episódios assistidos
      const { data: episodios } = await supabase
     .from('user_episodios')
     .select('serie_id, temporada_numero, episodio_numero, created_at')
     .eq('user_id', user.id)
     .order('created_at', { ascending: false })

      // 2. Busca avaliações
      const { data: avaliacoes } = await supabase
     .from('user_avaliacoes')
     .select('*')
     .eq('user_id', user.id)

      // 3. Busca dados das séries
      const seriesIds = [...new Set(episodios?.map(e => e.serie_id) || [])]
      const { data: series } = await supabase
     .from('series')
     .select('id, titulo, ano, nota')
     .in('id', seriesIds)

      // 4. Monta mapa de avaliações
      const avaliacoesMap = {}
      avaliacoes?.forEach(a => {
        const key = `${a.serie_id}-${a.temporada_numero}-${a.episodio_numero}`
        avaliacoesMap[key] = a
      })

      // 5. Monta mapa de séries
      const seriesMap = {}
      series?.forEach(s => {
        seriesMap[s.id] = s
      })

      // 6. Gera CSV
      const linhas = [
        ['Série', 'Ano', 'Temporada', 'Episódio', 'Assistido em', 'Minha Nota', 'Meu Comentário'].join(',')
      ]

      episodios?.forEach(ep => {
        const serie = seriesMap[ep.serie_id]
        const key = `${ep.serie_id}-${ep.temporada_numero}-${ep.episodio_numero}`
        const avaliacao = avaliacoesMap[key]

        linhas.push([
          `"${serie?.titulo || 'Desconhecida'}"`,
          serie?.ano || '',
          ep.temporada_numero,
          ep.episodio_numero,
          new Date(ep.created_at).toLocaleDateString('pt-BR'),
          avaliacao?.nota || '',
          `"${(avaliacao?.comentario || '').replace(/"/g, '""')}"`
        ].join(','))
      })

      const csv = linhas.join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)

      setDadosProntos({
        url,
        nome: `maratonei_${new Date().toISOString().split('T')[0]}.csv`,
        totalEps: episodios?.length || 0,
        totalSeries: seriesIds.length,
        totalAvaliacoes: avaliacoes?.length || 0
      })

    } catch (err) {
      console.error(err)
      alert('Erro ao gerar CSV')
    }
    setGerando(false)
  }

  if (!user) return <main className="main"><div className="card">Redirecionando...</div></main>

  return (
    <main className="main">
      <Link href="/" style={{color: '#FACC15', textDecoration: 'none', marginBottom: '16px', display: 'block'}}>
        ← Voltar
      </Link>

      <h1 style={{color: '#FACC15', marginBottom: '24px', fontSize: '28px'}}>📊 Exportar Dados</h1>

      <div className="card" style={{marginBottom: '24px'}}>
        <h3 style={{color: '#FACC15', marginBottom: '12px'}}>Baixe seu histórico completo</h3>
        <p style={{color: '#94A3B8', fontSize: '14px', marginBottom: '16px', lineHeight: '1.6'}}>
          Gera um arquivo CSV com todos os episódios que você assistiu, incluindo datas, notas e comentários.
          Perfeito pra backup ou análise no Excel/Google Sheets.
        </p>

        <button
          onClick={gerarCSV}
          disabled={gerando}
          style={{
            width: '100%',
            background: gerando? '#334155' : '#FACC15',
            color: '#000',
            border: 'none',
            padding: '14px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: gerando? 'not-allowed' : 'pointer'
          }}
        >
          {gerando? 'Gerando CSV...' : '📥 Gerar e Baixar CSV'}
        </button>
      </div>

      {dadosProntos && (
        <div className="card" style={{background: '#22C55E20', border: '1px solid #22C55E'}}>
          <h3 style={{color: '#22C55E', marginBottom: '12px'}}>✅ CSV Gerado!</h3>
          <div style={{color: '#94A3B8', fontSize: '14px', marginBottom: '16px'}}>
            <p>📺 {dadosProntos.totalEps} episódios</p>
            <p>🎬 {dadosProntos.totalSeries} séries</p>
            <p>⭐ {dadosProntos.totalAvaliacoes} avaliações</p>
          </div>
          <a
            href={dadosProntos.url}
            download={dadosProntos.nome}
            style={{
              display: 'block',
              background: '#22C55E',
              color: '#fff',
              textAlign: 'center',
              padding: '12px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 'bold'
            }}
          >
            ⬇️ Baixar {dadosProntos.nome}
          </a>
        </div>
      )}

      <div className="card" style={{marginTop: '24px'}}>
        <h3 style={{color: '#FACC15', marginBottom: '12px', fontSize: '16px'}}>💡 Como usar o CSV</h3>
        <ul style={{color: '#94A3B8', fontSize: '14px', lineHeight: '1.8', paddingLeft: '20px'}}>
          <li>Abre no Excel, Google Sheets ou Numbers</li>
          <li>Faz tabela dinâmica pra ver tempo por mês</li>
          <li>Filtra por série pra ver quais você maratonou mais</li>
          <li>Calcula média de notas por série</li>
        </ul>
      </div>
    </main>
  )
}
