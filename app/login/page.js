import { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Maratonei App - Controle suas maratonas de séries e filmes',
  description: 'Organize o que você já assistiu, o que quer ver e acompanhe seu progresso. O melhor app para maratonar séries com 18+ usuários ativos.',
  keywords: ['maratonei app', 'maratonei', 'controle de séries', 'watchlist', 'app de séries'],
  openGraph: {
    title: 'Maratonei App - Sua maratona organizada',
    description: 'Controle suas maratonas de séries e filmes de forma simples e rápida.',
    url: 'https://www.maratoneiapp.com.br',
    type: 'website',
  }
}

export default function LoginPage(){
  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      {/* HERO */}
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-10 text-center">
        <h1 className="text-5xl font-black mb-4 tracking-tight">
          <span className="text-[#f5c518]">Maratonei</span> App
        </h1>
        <h2 className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto mb-8">
          Pare de se perder no que já assistiu. Organize suas séries e filmes em uma watchlist inteligente.
        </h2>
        
        <div className="flex flex-col items-center gap-3">
          <button className="bg-white text-black px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-3 hover:scale-105 transition">
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5"/> Entrar com Google
          </button>
          <p className="text-xs text-slate-500">Grátis, rápido e seguro. Seus dados salvos na nuvem.</p>
        </div>

        <div className="mt-12 bg-[#151a2d] rounded-2xl p-2 border border-white/10 shadow-2xl">
          <div className="bg-[#0a0f1e] rounded-xl p-4 text-left text-sm text-slate-400">
            📊 Hoje: 18 usuários • 221 títulos salvos • Top: Minha Melhor Amiga
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-6">
        {[
          {t:'Sua Watchlist em um lugar', d:'Salve filmes e séries que quer assistir, marque como visto e nunca mais esqueça.'},
          {t:'Acompanhe seu progresso', d:'Veja quantos filmes por pessoa, média por usuário e seus gêneros favoritos.'},
          {t:'Top da galera', d:'Descubra o que todo mundo está maratonando agora no Maratonei.'},
        ].map(f=>(
          <div key={f.t} className="bg-[#151a2d] p-6 rounded-2xl border border-white/5">
            <h3 className="font-bold text-lg mb-2">{f.t}</h3>
            <p className="text-slate-400 text-sm">{f.d}</p>
          </div>
        ))}
      </div>

      {/* SEO TEXT - ISSO FAZ O GOOGLE TE ACHAR */}
      <div className="max-w-3xl mx-auto px-6 py-10 text-center text-slate-400 text-sm leading-relaxed">
        <h3 className="text-white font-bold mb-3">O que é o Maratonei App?</h3>
        <p>O Maratonei App é a ferramenta definitiva para quem ama maratonar séries e filmes. Cansado de esquecer onde parou ou o que queria ver? Com o Maratonei você cria sua lista pessoal, organiza por filmes e séries e tem um painel admin com estatísticas reais do que está bombando.</p>
      </div>
    </div>
  )
}
