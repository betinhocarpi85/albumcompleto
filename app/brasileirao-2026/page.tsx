import type { Metadata } from 'next'
import Link from 'next/link'
import JsonLd from '@/components/JsonLd'

export const dynamic = 'force-static'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://completando.com.br'

export const metadata: Metadata = {
  title: 'Álbum Figurinhas Brasileirão 2026 — Troque e Complete | Completando',
  description: 'Tudo sobre o álbum de figurinhas do Brasileirão Série A 2026. Troque suas repetidas, complete os times e jogadores com match automático no Completando.',
  keywords: [
    'álbum figurinhas brasileirao 2026',
    'figurinhas brasileirao panini 2026',
    'trocar figurinhas brasileirao',
    'álbum show de bola 2026',
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
  'Flamengo', 'Palmeiras', 'Corinthians', 'São Paulo',
  'Grêmio', 'Internacional', 'Atlético Mineiro', 'Cruzeiro',
  'Fluminense', 'Botafogo', 'Vasco', 'Santos',
  'Bahia', 'Fortaleza', 'Athletico Paranaense', 'Bragantino',
  'Cuiabá', 'Juventude', 'Vitória', 'Criciúma',
]

const FAQS = [
  {
    q: 'Quando lança o álbum do Brasileirão 2026?',
    a: 'O álbum de figurinhas do Brasileirão Série A costuma ser lançado entre março e abril, acompanhando o início do campeonato. Fique de olho no Completando para ser notificado assim que estiver disponível.',
  },
  {
    q: 'Quantas figurinhas tem o álbum do Brasileirão 2026?',
    a: 'O álbum do Brasileirão Série A 2026 tem em torno de 440 a 480 figurinhas, cobrindo os 20 times da primeira divisão com jogadores titulares, técnico, escudo e foto do estádio de cada clube.',
  },
  {
    q: 'Como trocar figurinhas repetidas do Brasileirão?',
    a: 'No Completando você cadastra suas figurinhas repetidas do Brasileirão e o sistema faz o match automático com outros colecionadores. Quando há compatibilidade dos dois lados, você combina a troca diretamente — sem grupos de WhatsApp lotados.',
  },
  {
    q: 'Tem figurinhas brilhantes no álbum do Brasileirão?',
    a: 'Sim! O álbum do Brasileirão inclui figurinhas brilhantes (foil) dos principais jogadores de cada time — os craques de cada clube têm versão especial com acabamento metalizado, as mais disputadas entre os colecionadores.',
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
      description: 'Tudo sobre o álbum de figurinhas do Brasileirão Série A 2026: times, jogadores, como trocar e completar.',
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
            ⚽🇧🇷 Série A · Panini Oficial 2026
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight">
            Álbum Figurinhas
            <span className="block text-green-400 mt-1">Brasileirão 2026</span>
          </h1>
          <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
            20 times · Série A completa
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
            { valor: '~440', label: 'Figurinhas no álbum', icon: '🖼️' },
            { valor: '20', label: 'Times da Série A', icon: '⚽' },
            { valor: '11+', label: 'Titulares por time', icon: '👕' },
            { valor: '1', label: 'Técnico por clube', icon: '🧢' },
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
            Todos os clubes da Série A com figurinhas de jogadores, técnico, emblema e estádio
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TIMES.map(time => (
              <div key={time} className="bg-white rounded-xl border border-slate-100 p-3 text-center">
                <p className="text-sm font-semibold text-slate-700">⚽ {time}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 text-center mt-4">
            * Lista ilustrativa para a temporada 2026. Sujeita à composição oficial da Série A.
          </p>
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
              titulo: 'Jogadores titulares',
              desc: 'Os 11 titulares mais utilizados por cada clube ao longo da temporada, com foto e nome oficial.',
            },
            {
              icon: '🧢',
              titulo: 'Técnico do time',
              desc: 'Uma figurinha exclusiva do treinador de cada clube, com foto e identificação do cargo.',
            },
            {
              icon: '🛡️',
              titulo: 'Escudo e emblema',
              desc: 'Figurinha oficial do escudo de cada time, geralmente em versão foil metalizado para destacar.',
            },
            {
              icon: '🏟️',
              titulo: 'Foto do estádio',
              desc: 'Uma figurinha panorâmica do estádio principal de cada clube — uma das mais bonitas do álbum.',
            },
            {
              icon: '✨',
              titulo: 'Figurinhas brilhantes',
              desc: 'Os craques de cada time ganham versão especial foil (brilhante), as mais cobiçadas e valorizadas do álbum.',
            },
            {
              icon: '📖',
              titulo: 'Páginas especiais',
              desc: 'Seções introdutórias do campeonato, troféu do Brasileirão e outras páginas temáticas com figurinhas específicas.',
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
