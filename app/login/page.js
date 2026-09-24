export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Maratonei App - Controle suas maratonas de séries e filmes',
  description: 'Organize o que você já assistiu, o que quer ver e acompanhe seu progresso.',
};

export default function LoginPage(){
  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-10 text-center">
        <h1 className="text-5xl font-black mb-4">
          <span className="text-[#f5c518]">Maratonei</span> App
        </h1>
        <h2 className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
          Pare de se perder no que já assistiu. Organize suas séries e filmes em uma watchlist inteligente.
        </h2>
        
        <div className="flex flex-col items-center gap-3">
          <a 
            href="/api/auth/google"
            className="bg-white text-black px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-3 hover:scale-105 transition"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="G"/> Entrar com Google
          </a>
          <p className="text-xs text-slate-500">Grátis, rápido e seguro.</p>
        </div>

        <div className="mt-12 bg-[#151a2d] rounded-2xl p-2 border border-white/10 max-w-3xl mx-auto">
          <div className="bg-[#0a0f1e] rounded-xl p-4 text-left text-sm text-slate-400">
            📊 Hoje: 18 usuários • 221 títulos salvos • Top: Minha Melhor Amiga
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-6">
        <div className="bg-[#151a2d] p-6 rounded-2xl border border-white/5">
          <h3 className="font-bold mb-2">Sua Watchlist em um lugar</h3>
          <p className="text-slate-400 text-sm">Salve filmes e séries que quer assistir.</p>
        </div>
        <div className="bg-[#151a2d] p-6 rounded-2xl border border-white/5">
          <h3 className="font-bold mb-2">Acompanhe seu progresso</h3>
          <p className="text-slate-400 text-sm">Média por usuário e gêneros favoritos.</p>
        </div>
        <div className="bg-[#151a2d] p-6 rounded-2xl border border-white/5">
          <h3 className="font-bold mb-2">Top da galera</h3>
          <p className="text-slate-400 text-sm">O que todo mundo está maratonando.</p>
        </div>
      </div>
    </div>
  )
}
