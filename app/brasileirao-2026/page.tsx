import type { Metadata } from 'next'
import Link from 'next/link'
import JsonLd from '@/components/JsonLd'

export const dynamic = 'force-static'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://completando.com.br'

export const metadata: Metadata = {
  title: 'Álbum Figurinhas Brasileirão 2026 — Troque e Complete | Completando',
  description: 'Álbum Panini Brasileirão 2026: 512 figurinhas, 20 clubes da Série A, Série B, mascotes e Brasileirão Feminino. Troque suas repetidas com match automático no Completando.',
  keywords: [
    'álbum figurinhas brasileirao 2026',
    'figurinhas brasileirao panini 2026',
    'trocar figurinhas brasileirao',
    'brasileirão feminino figurinhas 2026',
    'figurinhas série a 2026',
    'completar álbum brasileirao',
    'figurinhas repetidas brasileirao 2026',
    'figurinhas flamengo 2026',
    'figurinhas corinthians 2026',
    'figurinhas palmeiras 2026',
  ],
  alternates: { canonical: `${APP_URL}/brasileirao-2026` },
  openGraph: {
    title: 'Álbum Figurinhas Brasileirão 2026 — Troque e Complete | Completando',
    description: 'Tudo sobre o álbum de figurinhas do Brasileirão Série A 2026. Troque suas repetidas com match automático no Completando.',
    url: `${APP_URL}/brasileirao-2026`,
    images: [{ url: `${APP_URL}/logo-bg.png`, width: 1200, height: 630, alt: 'Álbum Figurinhas Brasileirão 2026' }],
    locale: 'pt_BR',
  },
}

const TIMES = [
  'Athletico-PR', 'Atlético-MG', 'Bahia', 'Botafogo',
  'Chapecoense', 'Corinthians', 'Coritiba', 'Cruzeiro',
  'Flamengo', 'Fluminense', 'Grêmio', 'Internacional',
  'Mirassol', 'Palmeiras', 'Red Bull Bragantino', 'Remo',
  'Santos', 'São Paulo', 'Vasco da Gama', 'Vitória',
]

const FAQS = [
  {
    q: 'Quando lança o álbum do Brasileirão 2026?',
    a: 'O álbum oficial da Panini foi lançado em setembro de 2026 e já está nas bancas, lotéricas, Panini Points e no site da Panini. O álbum capa brochura custa R$ 19,90, o capa dura R$ 69,90 e cada envelope R$ 5,00, com 5 figurinhas e 1 card.',
  },
  {
    q: 'Quantas figurinhas tem o álbum do Brasileirão 2026?',
    a: 'São 512 figurinhas: 18 atletas e 1 escudo holográfico para cada um dos 20 clubes da Série A, escudo e foto do time dos 20 clubes da Série B, 20 mascotes, 18 atletas do Brasileirão Feminino e as seções especiais São Eles!, Jogão e Homens-Gol. Além disso, a coleção tem 98 cards colecionáveis, que não são colados no álbum.',
  },
  {
    q: 'O Brasileirão Feminino tem álbum separado?',
    a: 'Não. Em 2026 a Panini colocou o Brasileirão Feminino dentro do mesmo álbum, em uma seção com 18 atletas (figurinhas 401 a 418).',
  },
  {
    q: 'Como trocar figurinhas repetidas do Brasileirão?',
    a: 'No Completando você cadastra suas figurinhas repetidas do Brasileirão e o sistema faz o match automático com outros colecionadores. Quando há compatibilidade dos dois lados, você combina a troca diretamente — sem grupos de WhatsApp lotados.',
  },
  {
    q: 'Tem figurinhas brilhantes no álbum do Brasileirão?',
    a: 'Sim. São 40 figurinhas holográficas (os escudos dos 20 clubes da Série A e dos 20 da Série B) e 20 figurinhas com corte especial, dos mascotes dos clubes da Série A.',
  },
  {
    q: 'Onde comprar figurinhas do Brasileirão 2026?',
    a: 'Você pode comprar pacotinhos em bancas de jornal, papelarias e mercados. Para figurinhas avulsas específicas — especialmente as que faltam para completar o álbum — use o Completando para comprar diretamente de outros colecionadores ou trocar pelas suas repetidas.',
  },
]

export default function Brasileirao2026Page() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Álbum de Figurinhas Brasileirão Série A 2026 — Guia Completo',
      description: 'Tudo sobre o álbum de figurinhas Panini do Brasileirão 2026: 512 figurinhas, times, seções especiais, como trocar e completar.',
      url: `${APP_URL}/brasileirao-2026`,
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
        { '@type': 'ListItem', position: 2, name: 'Brasileirão 2026', item: `${APP_URL}/brasileirao-2026` },
      ],
    },
  ]

  return (
    <div className="animate-fadein">
      <JsonLd data={jsonLd as Record<string, unknown>[]} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-green-900 via-slate-900 to-yellow-900 text-white py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/30 text-green-300 text-xs font-bold px-3 py-1.5 rounded-full mb-5 uppercase tracking-wide">
            ⚽🇧🇷 Panini Oficial · Já nas bancas
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight">
            Álbum Figurinhas
            <span className="block text-green-400 mt-1">Brasileirão 2026</span>
          </h1>
          <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
            512 figurinhas · 20 clubes da Série A · Série B e Brasileirão Feminino
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/cadastro" className="bg-green-500 hover:bg-green-400 text-white font-black px-8 py-4 rounded-xl text-base transition-colors shadow-lg shadow-green-500/25">
              Trocar figurinhas grátis 🔁
            </Link>
            <Link href="/bancas" className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-8 py-4 rounded-xl text-base transition-colors">
              📍 Bancas perto de mim
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-4xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { valor: '512', label: 'Figurinhas no álbum', icon: '🖼️' },
            { valor: '20', label: 'Clubes da Série A', icon: '⚽' },
            { valor: '18', label: 'Atletas por clube', icon: '👕' },
            { valor: '40', label: 'Escudos holográficos', icon: '✨' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center">
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="text-3xl font-black text-green-600">{s.valor}</div>
              <div className="text-xs text-slate-500 font-medium mt-1 leading-snug">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Times */}
      <section className="bg-slate-50 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-black text-slate-800 text-center mb-2">
            Os 20 times do álbum Brasileirão 2026
          </h2>
          <p className="text-slate-500 text-center mb-8 text-sm">
            Cada clube da Série A tem 18 atletas e 1 escudo holográfico
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TIMES.map(time => (
              <div key={time} className="bg-white rounded-xl border border-slate-100 p-3 text-center">
                <p className="text-sm font-semibold text-slate-700">⚽ {time}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* O que tem no álbum */}
      <section className="max-w-4xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-black text-slate-800 text-center mb-8">
          O que tem no álbum do Brasileirão 2026?
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            {
              icon: '👕',
              titulo: 'Série A',
              desc: '18 atletas e 1 escudo holográfico para cada um dos 20 clubes, figurinhas de 1 a 360.',
            },
            {
              icon: '🛡️',
              titulo: 'Série B',
              desc: 'Os 20 clubes da Série B, cada um com escudo holográfico e a foto do time formada por 2 figurinhas.',
            },
            {
              icon: '👩',
              titulo: 'Brasileirão Feminino',
              desc: '18 atletas do Brasileirão Feminino 2026, no mesmo álbum (figurinhas 401 a 418).',
            },
            {
              icon: '🦊',
              titulo: 'Mascotes',
              desc: '20 figurinhas com corte especial, com os mascotes dos clubes da Série A.',
            },
            {
              icon: '⭐',
              titulo: 'São Eles!, Jogão e Homens-Gol',
              desc: 'Atletas escolhidos pelos colecionadores, partidas marcantes da temporada e ilustrações exclusivas dos goleadores.',
            },
            {
              icon: '🃏',
              titulo: '98 cards colecionáveis',
              desc: 'Cada envelope traz 5 figurinhas e 1 card. Os cards são uma coleção à parte e não são colados no álbum.',
            },
          ].map(item => (
            <div key={item.titulo} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex gap-4">
              <div className="text-3xl flex-shrink-0">{item.icon}</div>
              <div>
                <h3 className="font-bold text-slate-800 mb-1">{item.titulo}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Como trocar */}
      <section className="bg-slate-50 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-black text-slate-800 text-center mb-2">
            Como trocar figurinhas do Brasileirão no Completando
          </h2>
          <p className="text-slate-500 text-center mb-8 text-sm">
            Sem planilha, sem grupo lotado. Match automático e direto ao ponto.
          </p>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { n: '1', icon: '📖', title: 'Monte seu álbum', desc: 'Marque quais figurinhas do Brasileirão você tem coladas, quais estão repetidas e quais ainda faltam.' },
              { n: '2', icon: '🔁', title: 'Receba matches', desc: 'O sistema cruza suas repetidas com o que outros colecionadores precisam — e vice-versa. Match automático, sem esforço.' },
              { n: '3', icon: '📱', title: 'Combine o encontro', desc: 'Proposta aceita dos dois lados? Vocês recebem o contato um do outro e combinam pessoalmente.' },
            ].map(s => (
              <div key={s.n} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="w-10 h-10 bg-green-500 text-white rounded-xl flex items-center justify-center font-black text-lg mb-4">{s.n}</div>
                <div className="text-2xl mb-2">{s.icon}</div>
                <h3 className="font-bold text-slate-800 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-black text-slate-800 text-center mb-8">
          Perguntas frequentes sobre o álbum do Brasileirão 2026
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
          Complete seu álbum do Brasileirão 2026
        </h2>
        <p className="text-green-100 mb-6 max-w-md mx-auto">
          Cadastre-se grátis, marque suas figurinhas e receba matches automáticos com colecionadores perto de você.
        </p>
        <Link href="/cadastro" className="inline-block bg-white text-green-600 font-black px-8 py-4 rounded-xl text-base hover:bg-green-50 transition-colors shadow-lg">
          Criar conta grátis →
        </Link>
      </section>

      {/* Footer */}
      <div className="bg-slate-900 text-slate-400 py-6 px-4">
        <div className="max-w-4xl mx-auto flex flex-wrap gap-4 justify-center text-xs">
          <Link href="/" className="hover:text-white transition-colors">Início</Link>
          <Link href="/copa-2026" className="hover:text-white transition-colors">🏆 Copa 2026</Link>
          <Link href="/bancas" className="hover:text-white transition-colors">📍 Bancas</Link>
          <Link href="/cadastro" className="hover:text-white transition-colors">Criar conta</Link>
        </div>
      </div>
    </div>
  )
}
