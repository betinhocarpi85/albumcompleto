import Link from 'next/link'
import StickerSquare from '@/components/StickerSquare'
import HomeCTA from '@/components/HomeCTA'

const DEMO_STICKERS = [
  { number: 17,  status: 'venda'  as const, type: 'brilhante' as const },
  { number: 29,  status: 'troca'  as const, type: 'brilhante' as const },
  { number: 16,  status: 'troca'  as const, type: 'escudo'    as const },
  { number: 28,  status: 'doacao' as const, type: 'escudo'    as const },
  { number: 52,  status: 'venda'  as const, type: 'escudo'    as const },
  { number: 22,  status: 'troca'  as const, type: 'normal'    as const },
  { number: 33,  status: 'doacao' as const, type: 'normal'    as const },
  { number: 67,  status: 'venda'  as const, type: 'normal'    as const },
  { number: 89,  status: 'troca'  as const, type: 'brilhante' as const },
  { number: 41,  status: 'colada' as const, type: 'brilhante' as const },
  { number: 45,  status: 'colada' as const, type: 'normal'    as const },
  { number: 99,  status: 'colada' as const, type: 'normal'    as const },
]

const STATS = [
  { value: '12.847', label: 'Colecionadores' },
  { value: '94.320', label: 'Figurinhas anunciadas' },
  { value: '31.550', label: 'Trocas concluídas' },
  { value: '4.210',  label: 'Doações realizadas' },
]

const STEPS = [
  { icon: '📋', title: 'Monte seu álbum', desc: 'Marque as figurinhas que você tem e as que ainda precisa para completar sua coleção.' },
  { icon: '🔁', title: 'Receba matches',  desc: 'O sistema encontra automaticamente quem tem o que você precisa e precisa do que você tem.' },
  { icon: '📦', title: 'Troque com segurança', desc: 'Nas vendas o pagamento fica retido até você confirmar o recebimento. Sem golpes.' },
]

const FEATURES = [
  { icon: '🟢', color: 'bg-green-500',  title: 'Venda',  desc: 'Defina seu preço e venda figurinhas repetidas com pagamento protegido.' },
  { icon: '🔵', color: 'bg-blue-500',   title: 'Troca',  desc: 'Proponha trocas justas. O sistema equilibra a quantidade automaticamente.' },
  { icon: '🟣', color: 'bg-purple-500', title: 'Doação', desc: 'Doe figurinhas para quem precisa e ganhe badges exclusivos.' },
  { icon: '✅', color: 'bg-green-700',  title: 'Colada', desc: 'Marque o que já tem no álbum. O que não estiver marcado é faltando.' },
]

export default function Home() {
  return (
    <div className="animate-fadein">

      {/* ── HERO ── */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-green-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="grid grid-cols-12 gap-2 p-4 h-full">
            {Array.from({ length: 144 }).map((_, i) => (
              <div key={i} className="bg-white rounded aspect-square" />
            ))}
          </div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-14 md:py-24">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
                🏆 Copa do Mundo FIFA 2026 — já disponível!
              </div>
              <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4">
                Complete seu álbum{' '}
                <span className="text-green-400">sem estresse</span>
              </h1>
              <p className="text-slate-300 text-lg mb-8 max-w-md mx-auto md:mx-0">
                Troque, venda e doe figurinhas com segurança.
                Match automático, pagamento protegido, sem golpes.
              </p>
              <HomeCTA />
            </div>

            {/* Demo grid */}
            <div className="flex-shrink-0">
              <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5 shadow-2xl">
                <p className="text-[11px] text-slate-400 font-medium mb-3 text-center uppercase tracking-wide">🇧🇷 Brasil · 🇦🇷 Argentina · 🇫🇷 França</p>
                <div className="grid grid-cols-6 gap-2">
                  {DEMO_STICKERS.map((s) => (
                    <StickerSquare key={s.number} number={s.number} status={s.status} stickerType={s.type} size="md" />
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-1.5">
                  {[
                    { color: 'bg-green-500',  label: 'Venda' },
                    { color: 'bg-blue-500',   label: 'Troca' },
                    { color: 'bg-purple-500', label: 'Doação' },
                    { color: 'bg-red-500',    label: 'Preciso' },
                  ].map((l) => (
                    <div key={l.label} className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${l.color} flex-shrink-0`} />
                      <span className="text-xs text-slate-300">{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl md:text-3xl font-black text-slate-800">{s.value}</div>
                <div className="text-xs md:text-sm text-slate-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-black text-slate-800">Como funciona</h2>
          <p className="text-slate-500 mt-2">Simples, rápido e seguro</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {STEPS.map((step, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-4xl mb-4">{step.icon}</div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-black flex items-center justify-center">{i + 1}</span>
                <h3 className="font-bold text-slate-800">{step.title}</h3>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4 TIPOS ── */}
      <section className="bg-slate-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-black">4 formas de completar seu álbum</h2>
            <p className="text-slate-400 mt-2">Você escolhe como quer participar</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-5 transition-colors">
                <div className={`w-8 h-8 rounded-lg ${f.color} flex items-center justify-center mb-3`}>
                  <span className="w-3 h-3 rounded-full bg-white/50" />
                </div>
                <h3 className="font-bold text-base mb-1">{f.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ECONOMIA ── */}
      <section className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-black text-slate-800">
            Completar comprando pacotes custa uma fortuna 💸
          </h2>
          <p className="text-slate-500 mt-2 max-w-xl mx-auto">
            Professores e matemáticos de instituições como FGV, UFMG e Bradesco calcularam o custo real.
            O resultado assusta.
          </p>
        </div>

        {/* Citações de especialistas */}
        <div className="grid md:grid-cols-3 gap-3 mb-8">
          {[
            {
              quote: '"A mediana foi estimada em cerca de R$ 7.098 apenas comprando pacotes — e metade dos colecionadores tende a gastar ainda mais."',
              author: 'Prof. Osvaldo Assunção',
              role: 'FGV-EESP e Bradesco',
              source: 'https://www.cnnbrasil.com.br/economia/macroeconomia/copa-2026-completar-album-de-figurinhas-pode-custar-mais-de-r-7-mil/',
              outlet: 'CNN Brasil',
            },
            {
              quote: '"Completar um álbum somente comprando os pacotes é uma tarefa muito difícil, gerando uma despesa na casa dos milhares de reais."',
              author: 'Camila Lutfi',
              role: 'Análise InfoMoney',
              source: 'https://www.infomoney.com.br/consumo/quanto-custa-completar-album-figurinhas-copa-mundo-2026/',
              outlet: 'InfoMoney',
            },
            {
              quote: '"O custo médio pode chegar a R$ 980 apenas se houver um grande número de pessoas trocando figurinhas entre si."',
              author: 'Prof. Gilcione Nonato Costa',
              role: 'UFMG',
              source: 'https://exame.com/esporte/quanto-custa-completar-o-album-da-copa-2026-matematico-estima-gastos/',
              outlet: 'Exame',
            },
          ].map((item) => (
            <div key={item.author} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col">
              <span className="text-3xl text-slate-200 font-serif leading-none mb-2">"</span>
              <p className="text-sm text-slate-600 italic leading-relaxed flex-1">{item.quote}</p>
              <div className="mt-4 pt-3 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-800">{item.author}</p>
                <p className="text-xs text-slate-400">{item.role}</p>
                <a href={item.source} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-green-600 hover:text-green-700 font-medium mt-1 inline-block">
                  Ver matéria — {item.outlet} ↗
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Comparação */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {/* Sem troca */}
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">😱</span>
              <span className="font-black text-red-700 text-lg">Só comprando pacotes</span>
            </div>
            <div className="text-5xl font-black text-red-600 mb-1">R$ 7.098</div>
            <p className="text-red-500 text-sm font-medium mb-1">mediana calculada pelo Prof. Osvaldo Assunção (FGV)</p>
            <p className="text-red-400 text-xs mb-4">Pode chegar a <strong>R$ 18.000</strong> no pior cenário</p>
            <div className="space-y-2 text-sm text-red-700">
              <div className="flex items-start gap-2"><span>❌</span><span>~1.043 pacotes comprados no total</span></div>
              <div className="flex items-start gap-2"><span>❌</span><span>Pacote de 7 figurinhas a R$ 7 — R$ 1 por figurinha</span></div>
              <div className="flex items-start gap-2"><span>❌</span><span>Centenas de figurinhas repetidas desperdiçadas</span></div>
              <div className="flex items-start gap-2"><span>❌</span><span>Sem garantia de completar o álbum</span></div>
            </div>
          </div>

          {/* Com álbum completo */}
          <div className="bg-green-50 border-2 border-green-400 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-black px-2 py-1 rounded-full">
              RECOMENDADO
            </div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🚀</span>
              <span className="font-black text-green-700 text-lg">Com álbum completo</span>
            </div>
            <div className="text-5xl font-black text-green-600 mb-1">≈ R$ 1.040</div>
            <p className="text-green-600 text-sm font-medium mb-1">com rede grande de trocas (Prof. Gilcione Costa, UFMG)</p>
            <p className="text-green-500 text-xs mb-4">Pode ser <strong>muito menos</strong> com doações e trocas diretas</p>
            <div className="space-y-2 text-sm text-green-700">
              <div className="flex items-start gap-2"><span>✅</span><span>Troque repetidas por exatamente o que falta</span></div>
              <div className="flex items-start gap-2"><span>✅</span><span>Compre figurinhas avulsas por R$ 1 a R$ 30</span></div>
              <div className="flex items-start gap-2"><span>✅</span><span>Receba doações de colecionadores generosos</span></div>
              <div className="flex items-start gap-2"><span>✅</span><span>Match automático — zero esforço pra encontrar</span></div>
            </div>
          </div>
        </div>

        {/* Barra de economia */}
        <div className="bg-slate-800 rounded-2xl p-6 md:p-8 text-white text-center">
          <p className="text-slate-400 text-sm mb-1">Economia média usando o álbum completo</p>
          <div className="text-4xl md:text-5xl font-black text-green-400 mb-4">até 85% mais barato</div>

          {/* Barra visual */}
          <div className="max-w-lg mx-auto mb-2">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>álbumcompleto.com.br ≈ R$ 1.040</span>
              <span>Só pacotes ≈ R$ 7.098</span>
            </div>
            <div className="bg-slate-700 rounded-full h-5 overflow-hidden flex">
              <div className="h-5 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-end pr-2" style={{ width: '15%' }}>
                <span className="text-[9px] text-white font-black">você</span>
              </div>
            </div>
          </div>

          <p className="text-slate-500 text-xs mb-5">Baseado em estudos dos Profs. Osvaldo Assunção (FGV) e Gilcione Costa (UFMG)</p>

          <Link
            href="/cadastro"
            className="inline-block bg-green-500 hover:bg-green-400 text-white font-black px-8 py-3.5 rounded-xl text-sm transition-colors shadow-lg shadow-green-500/20"
          >
            Quero economizar agora →
          </Link>
        </div>

        {/* Fontes */}
        <div className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-1">
          {[
            { label: 'CNN Brasil', url: 'https://www.cnnbrasil.com.br/economia/macroeconomia/copa-2026-completar-album-de-figurinhas-pode-custar-mais-de-r-7-mil/' },
            { label: 'Exame', url: 'https://exame.com/esporte/quanto-custa-completar-o-album-da-copa-2026-matematico-estima-gastos/' },
            { label: 'InfoMoney', url: 'https://www.infomoney.com.br/consumo/quanto-custa-completar-album-figurinhas-copa-mundo-2026/' },
          ].map(s => (
            <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer"
              className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2 transition-colors">
              Fonte: {s.label} ↗
            </a>
          ))}
        </div>
      </section>

      {/* ── SEGURANÇA ── */}
      <section className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-100 rounded-2xl p-6 md:p-10">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="text-6xl">🛡️</div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-800 mb-2">
                Compra e venda com total segurança
              </h2>
              <p className="text-slate-600 leading-relaxed max-w-xl">
                Nas vendas, o pagamento fica <strong>retido na plataforma</strong> até você confirmar o recebimento.
                O vendedor só recebe depois que você aprovar. Em caso de problema, nossa equipe resolve em até 15 dias úteis.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {['Pagamento protegido', 'Rastreio obrigatório', 'Sistema de reputação', 'Mediação de disputas'].map((item) => (
                  <span key={item} className="flex items-center gap-1.5 text-sm text-green-700 bg-green-100 px-3 py-1 rounded-full font-medium">
                    ✓ {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-green-500 text-white text-center py-14 px-4">
        <h2 className="text-2xl md:text-3xl font-black mb-3">
          Pronto para completar seu álbum da Copa 2026?
        </h2>
        <p className="text-green-100 mb-6 text-base max-w-md mx-auto">
          Cadastre-se grátis, marque suas figurinhas e comece a trocar agora.
        </p>
        <Link href="/cadastro" className="inline-block bg-white text-green-600 font-black px-8 py-4 rounded-xl text-base hover:bg-green-50 transition-colors shadow-lg">
          Criar conta grátis →
        </Link>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-900 text-slate-400 text-center py-6 text-xs">
        <p>© 2026 albumcompleto.com.br · Todos os direitos reservados</p>
        <p className="mt-1">Feito com ❤️ para colecionadores brasileiros</p>
      </footer>
    </div>
  )
}
