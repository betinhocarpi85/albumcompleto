import type { Metadata } from 'next'
import Link from 'next/link'
import JsonLd from '@/components/JsonLd'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://completando.com.br'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Figurinhas de Portugal Copa 2026 — Ronaldo e Seleção | Completando',
  description: 'Figurinhas de Portugal no álbum Copa 2026: Cristiano Ronaldo, Bruno Fernandes e toda a seleção. Troque as repetidas e encontre a figurinha do CR7 Copa 2026 com match automático.',
  keywords: [
    'figurinhas portugal copa 2026', 'figurinha ronaldo copa 2026',
    'figurinha cr7 copa 2026', 'trocar figurinhas portugal',
    'álbum panini portugal 2026', 'figurinha bruno fernandes copa 2026',
    'escudo portugal copa 2026',
  ],
  alternates: { canonical: `${APP_URL}/copa-2026/portugal` },
  openGraph: {
    title: 'Figurinhas de Portugal Copa 2026 — Ronaldo e Seleção 🇵🇹',
    description: 'Troque as figurinhas repetidas de Portugal e complete o álbum da Copa 2026 com CR7 e companhia.',
    url: `${APP_URL}/copa-2026/portugal`,
    images: [{ url: `${APP_URL}/logo-bg.png`, width: 1200, height: 630 }],
  },
}

const JOGADORES = [
  { pos: 'GOL', nomes: ['Rui Patrício', 'Diogo Costa'] },
  { pos: 'DEF', nomes: ['Rúben Dias', 'Pepe', 'Cancelo', 'Mendes'] },
  { pos: 'MEI', nomes: ['Bruno Fernandes', 'Vitinha', 'Bernardo Silva'] },
  { pos: 'ATA', nomes: ['Cristiano Ronaldo', 'Rafael Leão', 'Gonçalo Ramos', 'João Félix'] },
]

const FAQS = [
  {
    q: 'Quantas figurinhas de Portugal tem no álbum Copa 2026?',
    a: 'A seleção portuguesa tem em torno de 22 figurinhas no álbum Panini Copa 2026, incluindo jogadores titulares e reservas, o escudo oficial e figurinhas brilhantes (foil) dos principais destaques como Cristiano Ronaldo e Bruno Fernandes.',
  },
  {
    q: 'Qual o valor da figurinha do Cristiano Ronaldo Copa 2026?',
    a: 'A figurinha comum do Cristiano Ronaldo no álbum Copa 2026 costuma ser negociada entre R$ 3 e R$ 8. Já a versão brilhante (foil) do CR7 pode chegar de R$ 30 a R$ 80, dependendo da raridade e da procura — é uma das figurinhas mais caras do álbum. No Completando você troca sem pagar.',
  },
  {
    q: 'A figurinha do CR7 é brilhante no álbum 2026?',
    a: 'Sim! Cristiano Ronaldo sempre recebe versão foil especial nos álbuns da Panini. Na Copa 2026, como capitão e principal estrela de Portugal, o CR7 provavelmente terá pelo menos uma figurinha brilhante de destaque, sendo uma das mais disputadas por colecionadores do mundo todo.',
  },
  {
    q: 'Como conseguir figurinha do Ronaldo Copa 2026?',
    a: 'No Completando você cadastra as figurinhas de Portugal que faltam — incluindo a do Ronaldo — e o sistema faz match automático com colecionadores que têm exatamente o que você precisa. Quando o match acontece, vocês combinam a troca diretamente, sem intermediários e sem custo.',
  },
  {
    q: 'Portugal vai bem na Copa 2026?',
    a: 'Portugal é uma das grandes favoritas da Copa 2026. Com Cristiano Ronaldo liderando o time — possivelmente sua última Copa do Mundo — e um elenco jovem e talentoso como Bruno Fernandes, Rafael Leão e Gonçalo Ramos, a seleção portuguesa chega com grandes ambições ao torneio.',
  },
]

export default function PortugalPage() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Figurinhas de Portugal Copa do Mundo 2026 — Guia Completo',
      description: 'Todas as figurinhas da seleção portuguesa no álbum Panini Copa 2026 e como trocar as repetidas.',
      url: `${APP_URL}/copa-2026/portugal`,
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
        { '@type': 'ListItem', position: 3, name: 'Portugal', item: `${APP_URL}/copa-2026/portugal` },
      ],
    },
  ]

  return (
    <div className="animate-fadein">
      <JsonLd data={jsonLd as Record<string, unknown>[]} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-red-700 via-red-800 to-green-900 text-white py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-4">🇵🇹</div>
          <div className="inline-flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-xs font-bold px-3 py-1.5 rounded-full mb-5 uppercase tracking-wide">
            ⭐ Favorita · Grupo C · Álbum Panini Copa 2026
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight">
            Figurinhas de Portugal
            <span className="block text-yellow-400 mt-1">Copa do Mundo 2026</span>
          </h1>
          <p className="text-slate-300 text-lg mb-4 max-w-2xl mx-auto">
            A figurinha do CR7 pode ser a última de Ronaldo numa Copa. Troque as repetidas de Portugal e complete a seleção das Quinas.
          </p>
          <p className="text-slate-400 text-sm mb-8">
            ~22 figurinhas · Escudo + jogadores + especiais brilhantes
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/cadastro" className="bg-yellow-500 hover:bg-yellow-400 text-red-900 font-black px-8 py-4 rounded-xl text-base transition-colors shadow-lg">
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
            Jogadores de Portugal no álbum Copa 2026
          </h2>
          <p className="text-slate-500 text-center text-sm mb-8">
            Convocação ilustrativa — sujeita a confirmação oficial da FPF
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
            * Lista ilustrativa. Consulte a FPF para convocação oficial.
          </p>
        </div>
      </section>

      {/* Figurinhas especiais */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-black text-slate-800 text-center mb-8">
          Figurinhas especiais de Portugal na Copa 2026
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: '🛡️', tipo: 'Escudo FPF', raridade: 'Brilhante', desc: 'O escudo da seleção portuguesa em acabamento foil metalizado. Uma das figurinhas mais procuradas por colecionadores de Portugal no Brasil.' },
            { icon: '✨', tipo: 'CR7 Foil', raridade: 'Brilhante', desc: 'Cristiano Ronaldo em versão foil especial — possivelmente a figurinha individual mais valiosa de todo o álbum Copa 2026. Muito disputada para troca.' },
            { icon: '🏆', tipo: 'Pôster da Seleção', raridade: 'Especial', desc: 'Foto coletiva de Portugal em formato dupla página. Com Ronaldo em destaque, é peça obrigatória para quem coleciona as Quinas.' },
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
            Tem figurinhas repetidas de Portugal?
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
          Perguntas sobre figurinhas de Portugal
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
          🇵🇹 Complete Portugal no seu álbum
        </h2>
        <p className="text-green-100 mb-6 max-w-md mx-auto">
          Troque as repetidas, encontre as que faltam — inclusive a do Ronaldo. Match automático, sem grupo de WhatsApp.
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
