import type { Metadata } from 'next'
import Link from 'next/link'
import JsonLd from '@/components/JsonLd'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://completando.com.br'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Figurinhas da Argentina Copa 2026 — Messi e Seleção | Completando',
  description: 'Figurinhas da Argentina no álbum Copa 2026: Messi, Di María e toda a seleção campeã. Troque as repetidas da Argentina e encontre a figurinha do Messi Copa 2026 com match automático.',
  keywords: [
    'figurinhas argentina copa 2026', 'figurinha messi copa 2026',
    'trocar figurinhas argentina', 'álbum panini argentina 2026',
    'figurinha di maria copa 2026', 'figurinhas repetidas argentina copa',
    'escudo argentina copa 2026',
  ],
  alternates: { canonical: `${APP_URL}/copa-2026/argentina` },
  openGraph: {
    title: 'Figurinhas da Argentina Copa 2026 — Messi e Seleção 🇦🇷',
    description: 'Troque as figurinhas repetidas da Argentina e complete o álbum da Copa 2026 com Messi e companhia.',
    url: `${APP_URL}/copa-2026/argentina`,
    images: [{ url: `${APP_URL}/logo-bg.png`, width: 1200, height: 630 }],
  },
}

const JOGADORES = [
  { pos: 'GOL', nomes: ['E. Martínez'] },
  { pos: 'DEF', nomes: ['Romero', 'Otamendi', 'Tagliafico', 'Molina'] },
  { pos: 'MEI', nomes: ['De Paul', 'Mac Allister', 'Enzo Fernández'] },
  { pos: 'ATA', nomes: ['Messi', 'Di María', 'Lautaro Martínez', 'Álvarez', 'Dybala'] },
]

const FAQS = [
  {
    q: 'Quantas figurinhas da Argentina tem no álbum Copa 2026?',
    a: 'A seleção argentina tem em torno de 22 figurinhas no álbum Panini Copa 2026, incluindo jogadores titulares e reservas, o escudo oficial e figurinhas brilhantes (foil) dos principais destaques como Messi e Lautaro Martínez.',
  },
  {
    q: 'Qual o valor da figurinha do Messi na Copa 2026?',
    a: 'A figurinha comum do Messi no álbum Copa 2026 costuma ser negociada entre R$ 2 e R$ 5 em bancas e grupos de troca. Já a versão brilhante (foil) pode chegar de R$ 20 a R$ 50, dependendo da raridade e da procura. No Completando você pode trocá-la sem pagar nada.',
  },
  {
    q: 'Como trocar figurinha repetida do Messi Copa 2026?',
    a: 'No Completando você cadastra as figurinhas da Argentina que estão repetidas — incluindo a do Messi — e o sistema faz match automático com outros colecionadores. Quando alguém tem o que você precisa e precisa do que você tem, vocês combinam a troca diretamente, sem grupo de WhatsApp.',
  },
  {
    q: 'A Argentina é campeã mundial no álbum Copa 2026?',
    a: 'Sim! A Argentina entrou no álbum Copa 2026 com o badge de atual campeã do mundo. O escudo argentino vem com acabamento especial e a seleção está no Grupo B — o mesmo do Brasil, o que torna as figurinhas ainda mais disputadas por colecionadores rivais.',
  },
  {
    q: 'Quais jogadores da Argentina têm figurinha brilhante?',
    a: 'As figurinhas brilhantes (foil) da Argentina na Copa 2026 provavelmente incluem Messi, Lautaro Martínez e Mac Allister, seguindo o padrão da Panini de destacar os grandes astros em versão foil especial. Messi costuma ter mais de uma versão no álbum.',
  },
]

export default function ArgentinaPage() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Figurinhas da Argentina Copa do Mundo 2026 — Guia Completo',
      description: 'Todas as figurinhas da seleção argentina no álbum Panini Copa 2026 e como trocar as repetidas.',
      url: `${APP_URL}/copa-2026/argentina`,
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
        { '@type': 'ListItem', position: 3, name: 'Argentina', item: `${APP_URL}/copa-2026/argentina` },
      ],
    },
  ]

  return (
    <div className="animate-fadein">
      <JsonLd data={jsonLd as Record<string, unknown>[]} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-sky-700 via-sky-800 to-yellow-900 text-white py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-4">🇦🇷</div>
          <div className="inline-flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-xs font-bold px-3 py-1.5 rounded-full mb-5 uppercase tracking-wide">
            🏆 Campeã · Grupo B · Álbum Panini Copa 2026
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight">
            Figurinhas da Argentina
            <span className="block text-yellow-400 mt-1">Copa do Mundo 2026</span>
          </h1>
          <p className="text-slate-300 text-lg mb-4 max-w-2xl mx-auto">
            A figurinha do Messi é a mais buscada do álbum. Troque as repetidas da Argentina e complete a seleção campeã.
          </p>
          <p className="text-slate-400 text-sm mb-8">
            ~22 figurinhas · Escudo + jogadores + especiais brilhantes
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/cadastro" className="bg-yellow-500 hover:bg-yellow-400 text-sky-900 font-black px-8 py-4 rounded-xl text-base transition-colors shadow-lg">
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
            { valor: '1',   label: 'Escudo',      icon: '🛡️' },
            { valor: 'B',   label: 'Grupo',        icon: '🌍' },
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
            Jogadores da Argentina no álbum Copa 2026
          </h2>
          <p className="text-slate-500 text-center text-sm mb-8">
            Convocação ilustrativa — sujeita a confirmação oficial da AFA
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
            * Lista ilustrativa. Consulte a AFA para convocação oficial.
          </p>
        </div>
      </section>

      {/* Figurinhas especiais */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-black text-slate-800 text-center mb-8">
          Figurinhas especiais da Argentina na Copa 2026
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: '🛡️', tipo: 'Escudo AFA', raridade: 'Brilhante', desc: 'O escudo da seleção argentina em acabamento foil metalizado, com destaque de campeã mundial. Uma das mais procuradas para troca.' },
            { icon: '✨', tipo: 'Messi Foil', raridade: 'Brilhante', desc: 'Lionel Messi em versão foil especial — a figurinha mais buscada de todo o álbum Copa 2026. Pode aparecer em mais de uma versão.' },
            { icon: '🏆', tipo: 'Pôster da Seleção', raridade: 'Especial', desc: 'Foto coletiva da Argentina campeã em formato dupla página. Badge de campeã destacado — muito valorizada por colecionadores.' },
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
            Tem figurinhas repetidas da Argentina?
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
          Perguntas sobre figurinhas da Argentina
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
          🇦🇷 Complete a Argentina no seu álbum
        </h2>
        <p className="text-green-100 mb-6 max-w-md mx-auto">
          Troque as repetidas, encontre as que faltam — inclusive a do Messi. Match automático, sem grupo de WhatsApp.
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
          <Link href="/copa-2026/brasil" className="hover:text-white transition-colors">🇧🇷 Brasil</Link>
          <Link href="/copa-2026/como-completar" className="hover:text-white transition-colors">📖 Como completar</Link>
          <Link href="/bancas" className="hover:text-white transition-colors">📍 Bancas</Link>
        </div>
      </div>
    </div>
  )
}
