import type { Metadata } from 'next'
import Link from 'next/link'
import JsonLd from '@/components/JsonLd'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://completando.com.br'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Figurinhas da Alemanha Copa 2026 — Seleção Alemã | Completando',
  description: 'Todas as figurinhas da Seleção Alemã no álbum Copa do Mundo 2026. Veja Müller, Musiala, Havertz e os demais, troque as repetidas e complete a Alemanha no seu álbum Panini com match automático.',
  keywords: [
    'figurinhas alemanha copa 2026', 'figurinha müller copa 2026',
    'trocar figurinhas alemanha', 'figurinha musiala copa 2026',
    'álbum panini alemanha 2026', 'escudo alemanha copa 2026',
  ],
  alternates: { canonical: `${APP_URL}/copa-2026/alemanha` },
  openGraph: {
    title: 'Figurinhas da Alemanha Copa 2026 — Seleção Alemã 🇩🇪 | Completando',
    description: 'Troque as figurinhas repetidas da Seleção Alemã e complete a Alemanha no seu álbum da Copa 2026.',
    url: `${APP_URL}/copa-2026/alemanha`,
    images: [{ url: `${APP_URL}/logo-bg.png`, width: 1200, height: 630 }],
  },
}

const JOGADORES = [
  { pos: 'GOL', nomes: ['Neuer', 'ter Stegen'] },
  { pos: 'DEF', nomes: ['Rüdiger', 'Schlotterbeck', 'Kimmich'] },
  { pos: 'MEI', nomes: ['Kroos', 'Gündogan', 'Wirtz'] },
  { pos: 'ATA', nomes: ['Müller', 'Musiala', 'Havertz', 'Gnabry'] },
]

const FAQS = [
  {
    q: 'Quantas figurinhas da Alemanha tem no álbum da Copa 2026?',
    a: 'A Seleção Alemã tem aproximadamente 22 figurinhas no álbum Panini Copa 2026, incluindo figurinhas normais dos jogadores, o escudo oficial da DFB e figurinhas especiais brilhantes (foil) dos destaques da equipe.',
  },
  {
    q: 'Qual o valor da figurinha do Müller na Copa 2026?',
    a: 'A figurinha do Thomas Müller é uma das mais valorizadas do álbum alemão. Em versão normal vale em torno de R$ 2 a R$ 5, enquanto a versão brilhante (foil) pode atingir R$ 15 a R$ 30 em bancas especializadas. No Completando você pode trocar sem pagar.',
  },
  {
    q: 'A figurinha brilhante do Musiala vale a pena?',
    a: 'Sim! Jamal Musiala é a grande promessa da Seleção Alemã e sua figurinha brilhante é uma das mais disputadas do álbum Copa 2026. Por ser jovem talento e titular absoluto, é muito procurada por colecionadores e pode valer de R$ 20 a R$ 50.',
  },
  {
    q: 'Qual a história da Alemanha na Copa do Mundo?',
    a: 'A Alemanha é uma das maiores seleções da história, com 4 títulos mundiais (1954, 1974, 1990 e 2014). É a segunda seleção com mais títulos, atrás apenas do Brasil. Na Copa 2026 está no Grupo C e é candidata ao título.',
  },
  {
    q: 'Como trocar figurinhas repetidas da Alemanha da Copa 2026?',
    a: 'No Completando você cadastra as figurinhas da Alemanha que estão repetidas e as que faltam. O sistema faz match automático com outros colecionadores. Quando alguém tem o que você precisa e precisa do que você tem, vocês combinam a troca diretamente — sem grupo de WhatsApp.',
  },
]

export default function AlemanhaPage() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Figurinhas da Alemanha Copa do Mundo 2026 — Guia Completo',
      description: 'Todas as figurinhas da Seleção Alemã no álbum Panini Copa 2026 e como trocar as repetidas.',
      url: `${APP_URL}/copa-2026/alemanha`,
      publisher: {
        '@type': 'Organization',
        name: 'Completando',
        logo: { '@type': 'ImageObject', url: `${APP_URL}/icon-512.png` },
      },
      datePublished: '2026-01-01',
      dateModified: new Date().toISOString().split('T')[0],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQS.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Início', item: APP_URL },
        { '@type': 'ListItem', position: 2, name: 'Copa do Mundo 2026', item: `${APP_URL}/copa-2026` },
        { '@type': 'ListItem', position: 3, name: 'Figurinhas da Alemanha', item: `${APP_URL}/copa-2026/alemanha` },
      ],
    },
  ]

  return (
    <div className="animate-fadein">
      <JsonLd data={jsonLd as Record<string, unknown>[]} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-red-900 to-yellow-900 text-white py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-4">🇩🇪</div>
          <div className="inline-flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-xs font-bold px-3 py-1.5 rounded-full mb-5 uppercase tracking-wide">
            🏆 Grupo C · Álbum Panini Copa 2026
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight">
            Figurinhas da Alemanha
            <span className="block text-yellow-400 mt-1">Copa do Mundo 2026</span>
          </h1>
          <p className="text-slate-300 text-lg mb-4 max-w-2xl mx-auto">
            Troque as repetidas da Seleção Alemã, complete o escudo e os jogadores destaque no seu álbum Panini.
          </p>
          <p className="text-slate-400 text-sm mb-8">
            ~22 figurinhas · Escudo + jogadores + especiais brilhantes
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/cadastro" className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-black px-8 py-4 rounded-xl text-base transition-colors shadow-lg">
              Trocar figurinhas grátis 🚀
            </Link>
            <Link href="/copa-2026" className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-8 py-4 rounded-xl text-base transition-colors">
              🏆 Ver álbum completo
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-4xl mx-auto px-4 py-10">
        <div className="grid grid-cols-3 gap-4">
          {[
            { valor: '~22', label: 'Figurinhas', icon: '🖼️' },
            { valor: '1',   label: 'Escudo DFB',  icon: '🛡️' },
            { valor: 'C',   label: 'Grupo',        icon: '🌍' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center">
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="text-3xl font-black text-green-600">{s.valor}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Jogadores */}
      <section className="bg-slate-50 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-black text-slate-800 text-center mb-2">
            Jogadores da Alemanha no álbum Copa 2026
          </h2>
          <p className="text-slate-500 text-center text-sm mb-8">
            Convocação ilustrativa — sujeita a confirmação oficial da DFB
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {JOGADORES.map(p => (
              <div key={p.pos} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <p className="text-xs font-black text-green-600 uppercase tracking-wide mb-3">{p.pos}</p>
                <ul className="space-y-2">
                  {p.nomes.map(n => (
                    <li key={n} className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="text-base">⚽</span> {n}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 text-center mt-4">
            * Lista ilustrativa. Consulte a DFB para convocação oficial.
          </p>
        </div>
      </section>

      {/* Figurinhas especiais */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-black text-slate-800 text-center mb-8">
          Figurinhas especiais da Alemanha na Copa 2026
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: '🛡️', tipo: 'Escudo DFB', raridade: 'Brilhante', desc: 'O escudo da Seleção Alemã em acabamento foil metalizado. Uma das mais procuradas pelos colecionadores.' },
            { icon: '✨', tipo: 'Jogadores Destaque', raridade: 'Brilhante', desc: 'Musiala, Wirtz e outros craques em versão foil especial — as mais raras e valorizadas do álbum alemão.' },
            { icon: '🏆', tipo: 'Pôster da Seleção', raridade: 'Especial', desc: 'Foto coletiva do grupo alemão em formato dupla página. Muito valorizada por fãs e colecionadores.' },
          ].map(t => (
            <div key={t.tipo} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="text-3xl mb-3">{t.icon}</div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-slate-800">{t.tipo}</h3>
                <span className="text-xs bg-yellow-100 text-yellow-700 font-semibold px-2 py-0.5 rounded-full">{t.raridade}</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Como trocar */}
      <section className="bg-green-50 py-10 px-4 border-y border-green-100">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-black text-slate-800 mb-2">
            Tem figurinhas repetidas da Alemanha?
          </h2>
          <p className="text-slate-600 mb-6 max-w-xl mx-auto">
            Cadastre no Completando e encontre automaticamente alguém que tem o que você precisa — e precisa do que você tem.
          </p>
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {[
              { n: '1', desc: 'Marque quais tem e quais faltam' },
              { n: '2', desc: 'Receba match automático' },
              { n: '3', desc: 'Combine o encontro' },
            ].map(s => (
              <div key={s.n} className="bg-white rounded-xl p-4 shadow-sm border border-green-100 flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 text-white rounded-lg flex items-center justify-center font-black shrink-0">{s.n}</div>
                <p className="text-sm text-slate-700 text-left">{s.desc}</p>
              </div>
            ))}
          </div>
          <Link href="/cadastro" className="inline-block bg-green-500 hover:bg-green-400 text-white font-black px-8 py-4 rounded-xl text-base transition-colors shadow-lg shadow-green-500/25">
            Começar grátis — é 0 custo 🚀
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-black text-slate-800 text-center mb-8">
          Perguntas sobre figurinhas da Alemanha
        </h2>
        <div className="space-y-4">
          {FAQS.map(f => (
            <div key={f.q} className="bg-white rounded-2xl border border-slate-100 p-5">
              <h3 className="font-bold text-slate-800 mb-2 text-sm">{f.q}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-green-500 text-white text-center py-14 px-4">
        <h2 className="text-2xl md:text-3xl font-black mb-3">
          🇩🇪 Complete a Alemanha no seu álbum
        </h2>
        <p className="text-green-100 mb-6 max-w-md mx-auto">
          Troque as repetidas, encontre as que faltam. Match automático, sem grupo de WhatsApp.
        </p>
        <Link href="/cadastro" className="inline-block bg-white text-green-600 font-black px-8 py-4 rounded-xl text-base hover:bg-green-50 transition-colors shadow-lg">
          Criar conta grátis →
        </Link>
      </section>

      {/* Footer links */}
      <div className="bg-slate-900 text-slate-400 py-6 px-4">
        <div className="max-w-4xl mx-auto flex flex-wrap gap-4 justify-center text-xs">
          <Link href="/" className="hover:text-white transition-colors">Início</Link>
          <Link href="/copa-2026" className="hover:text-white transition-colors">🏆 Copa 2026</Link>
          <Link href="/copa-2026/como-completar" className="hover:text-white transition-colors">📖 Como completar</Link>
          <Link href="/bancas" className="hover:text-white transition-colors">📍 Bancas</Link>
          <Link href="/cadastro" className="hover:text-white transition-colors">Criar conta</Link>
        </div>
      </div>
    </div>
  )
}
