'use client';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function LimparBugados(){
  const [limpando, setLimpando] = useState(false);
  const [feito, setFeito] = useState(false);

  const forcarLimpeza = async () => {
    if(!confirm('Isso vai remover FORÇADAMENTE as 3 séries bugadas da sua aba Assistindo. Continuar?')) return;
    
    setLimpando(true);
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data: { user } } = await supabase.auth.getUser();
    if(!user){ alert('Você precisa estar logado'); setLimpando(false); return; }

    // 1. Pega tudo que está como 'assistindo'
    const { data: lista } = await supabase
      .from('user_series') // se sua tabela chama 'watchlist' ou 'series_list', troca aqui
      .select('id, tmdb_id, titulo, status')
      .eq('user_id', user.id)
      .eq('status', 'assistindo');

    console.log('Sua lista assistindo:', lista);

    // 2. Esses são os IDs bugados que aparecem nas suas fotos
    // Eles são os IDs das séries que ABREM errado
    const titulosBugados = ['Ever Decreasing Circles', 'MyPam!', '13 de Novembro - Terror em Paris'];

    for (const item of lista) {
      // Se o título salvo for um desses 3, ou se o poster não bate, deleta
      if (titulosBugados.some(t => item.titulo?.includes(t)) || 
          item.titulo?.includes('The Walking Dead') && item.tmdb_id !== 1402) {
        
        await supabase.from('user_series').delete().eq('id', item.id);
        console.log('Removido:', item.titulo);
      }
    }

    // 3. Limpeza extra: limpa o localStorage que faz elas voltarem
    localStorage.removeItem('maratonei_cache');
    localStorage.removeItem('watchlist');
    localStorage.removeItem('assistindo');

    setLimpando(false);
    setFeito(true);
    alert('Limpeza forçada feita! Recarrega a página.');
    window.location.reload();
  };

  if (feito) return <div style={{background:'#22c55e', color:'black', padding:'12px', borderRadius:'8px', fontSize:'13px', fontWeight:'700'}}>✅ Bug removido! Recarregue a página.</div>

  return (
    <button 
      onClick={forcarLimpeza}
      disabled={limpando}
      style={{background:'#ef4444', color:'white', padding:'10px 16px', borderRadius:'8px', border:'none', cursor:'pointer', fontSize:'12px', fontWeight:'700', marginTop:'12px'}}
    >
      {limpando ? 'Limpando...' : '🧹 Forçar saída das 3 séries bugadas (só no meu perfil)'}
    </button>
  )
}
