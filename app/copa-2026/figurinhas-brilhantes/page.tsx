import type { Metadata } from 'next'
import Link from 'next/link'
import JsonLd from '@/components/JsonLd'

export const dynamic = 'force-static'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://completando.com.br'

export const metadata: Metadata = {
  title: 'Figurinhas Brilhantes Copa 2026 — Foil e Especiais Panini | Completando',
  description: 'Guia completo das figurinhas brilhantes (foil) do álbum Copa do Mundo 2026. Quais são raras, quanto valem e como conseguir por troca no Completando.',
  keywords: [
    'figurinhas brilhantes copa 2026',
    'foil copa 2026',
    'figurinhas raras copa 2026',
    'figurinhas especiais panini 2026',
    'figurinha dourada copa 2026',
    'figurinhas metalicas copa 2026',
    'como conseguir figurinhas brilhantes copa',
    'valor figurinhas brilhantes copa 2026',
  ],
  alternates: { canonical: `${APP_URL}/copa-2026/figurinhas-brilhantes` },
  openGraph: {
    title: 'Figurinhas Brilhantes Copa 2026 — Foil e Especiais Panini | Completando',
    description: 'Guia completo das figurinhas brilhantes (foil) do álbum Copa do Mundo 2026. Quais são raras, quanto valem e como conseguir.',
    url: `${APP_URL}/copa-2026/figurinhas-brilhantes`,
    images: [{ url: `${APP_URL}/logo-bg.png`, width: 1200, height: 630, alt: 'Figurinhas Brilhantes Copa 2026' }],
    locale: 'pt_BR',
  },
}

const TIPOS = [
  {
    icon: '🛡️',
    tipo: 'Escudos Foil',
    desc: 'Escudos de todas as 48 seleções participantes em acabamento metalizado. Uma figurinha foil por seleção, com reflexo característico ao luz.',
    dica: '48 figurinhas · 1 por seleção',
  },
  {
    icon: '⭐',
    tipo: 'Jogadores Destaque',
    desc: 'Os maiores craques do mundo — Messi, Ronaldo, Mbappé, Vinicius Jr. e outros — em versão foil exclusiva, com tratamento diferenciado na impressão.',
    dica: 'Os mais cobiçados do álbum',
  },
  {
    icon: '🏆',
    tipo: 'Edição Especial',
    desc: 'Figurinhas de pôster, bandeiras e torcida em versão premium foil. Completam seções específicas do álbum com visual diferenciado.',
    dica: 'Raras e muito valorizadas',
  },
]

const RANKING = [
  { pos: 1, nome: 'Lionel Messi', seleção: 'Argentina', valor: 'R$ 60 – R$ 80' },
  { pos: 2, nome: 'Cristiano Ronaldo', seleção: 'Portugal', valor: 'R$ 50 – R$ 70' },
  { pos: 3, nome: 'Kylian Mbappé', seleção: 'França', valor: 'R$ 40 – R$ 60' },
  { pos: 4, nome: 'Vinicius Jr.', seleção: 'Brasil', valor: 'R$ 35 – R$ 55' },
  { pos: 5, nome: 'Jude Bellingham', seleção: 'Inglaterra', valor: 'R$ 25 – R$ 40' },
  { pos: 6, nome: 'Rodrygo', seleção: 'Brasil', valor: 'R$ 20 – R$ 35' },
  { pos: 7, nome: 'Lamine Yamal', seleção: 'Espanha', valor: 'R$ 20 – R$ 35' },
  { pos: 8, nome: 'Pedri', seleção: 'Espanha', valor: 'R$ 15 – R$ 30' },
]

const FAQS = [
  {
    q: 'O que são figurinhas brilhantes no álbum Copa 2026?',
    a: 'As figurinhas brilhantes são edições especiais com acabamento foil (metalizado), que refletem a luz e brilham ao serem movidas. No álbum da Copa do Mundo 2026, elas identificam os principais jogadores e escudos das seleções, com aparência visivelmente diferente das figurinhas comuns.',
  },
  {
    q: 'Quantas figurinhas brilhantes tem no álbum Copa 2026?',
    a: 'O álbum da Copa do Mundo FIFA 2026 contém aproximadamente 150 figurinhas brilhantes (foil), entre escudos, jogadores destaque e edições especiais. A proporção é de cerca de 1 figurinha brilhante a cada 5 pacotinhos abertos.',
  },
  {
    q: 'Quanto vale uma figurinha brilhante da Copa 2026?',
    a: 'O valor de uma figurinha brilhante da Copa 2026 varia bastante: as mais comuns ficam entre R$ 5 e R$ 15, enquanto as de jogadores famosos como Messi e Mbappé podem chegar a R$ 80 ou mais em trocas e vendas entre colecionadores.',
  },
  {
    q: 'Como conseguir figurinhas brilhantes da Copa 2026?',
    a: 'Você pode conseguir figurinhas brilhantes abrindo pacotinhos — com sorte, uma brilhante a cada 5 packs. Mas a forma mais eficiente é trocar ou comprar diretamente com outros colecionadores no Completando, onde o match automático conecta você com quem tem exatamente a figurinha que falta.',
  },
  {
    q: 'As figurinhas brilhantes são numeradas?',
    a: 'Algumas edições especiais do álbum Copa 2026 possuem numeração própria ou prefixo diferenciado (ex.: "SP" para Special). Os escudos foil seguem a numeração padrão do álbum, mas as figurinhas de pôster e edição especial podem ter identificação própria.',
  },
]

export default function FigurinhasBrilhantesPage() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Figurinhas Brilhantes Copa 2026 — Guia Completo Foil e Especiais',
      description: 'Guia completo das figurinhas brilhantes (foil) do álbum Copa do Mundo 2026. Quais são raras, quanto valem e como conseguir por troca.',
      url: `${APP_URL}/copa-2026/figurinhas-brilhantes`,
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
        { '@type': 'ListItem', position: 2, name: 'Copa 2026', item: `${APP_URL}/copa-2026` },
        { '@type': 'ListItem', position: 3, name: 'Figurinhas Brilhantes', item: `${APP_URL}/copa-2026/figurinhas-brilhantes` },
      ],
    },
  ]

  return (
    <div className="animate-fadein">
      <JsonLd data={jsonLd as Record<string, unknown>[]} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-yellow-900 via-slate-900 to-green-900 text-white py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-xs font-bold px-3 py-1.5 rounded-full mb-5 uppercase tracking-wide">
            ✨ Foil · Metalizado · Especial
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight">
            Figurinhas Brilhantes
            <span className="block text-yellow-400 mt-1">Copa 2026</span>
          </h1>
          <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
            As mais raras, as mais disputadas — guia completo
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/cadastro" className="bg-green-500 hover:bg-green-400 text-white font-black px-8 py-4 rounded-xl text-base transition-colors shadow-lg shadow-green-500/25">
              Trocar figurinhas brilhantes →
            </Link>
            <Link href="/copa-2026" className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-8 py-4 rounded-xl text-base transition-colors">
              🏆 Ver álbum completo
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-4xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { valor: '~150', label: 'Figurinhas brilhantes no álbum', icon: '✨' },
            { valor: '1 em 5', label: 'Pacotinhos contém uma brilhante', icon: '📦' },
            { valor: 'até 20x', label: 'Mais valiosas que as comuns', icon: '💰' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center">
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="text-3xl font-black text-green-600">{s.valor}</div>
              <div className="text-xs text-slate-500 font-medium mt-1 leading-snug">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Tipos */}
      <section className="bg-slate-50 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-black text-slate-800 text-center mb-2">
            Tipos de figurinhas especiais na Copa 2026
          </h2>
          <p className="text-slate-500 text-center mb-8 text-sm">
            Três categorias de figurinhas com acabamento foil no álbum oficial Panini
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {TIPOS.map(t => (
              <div key={t.tipo} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className="text-3xl mb-3">{t.icon}</div>
                <h3 className="font-bold text-slate-800 mb-1">{t.tipo}</h3>
                <p className="text-sm text-slate-500 mb-3 leading-relaxed">{t.desc}</p>
                <span className="inline-block text-xs bg-yellow-50 text-yellow-700 font-semibold px-2.5 py-1 rounded-full">{t.dica}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como identificar */}
      <section className="max-w-4xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-black text-slate-800 text-center mb-8">
          Como identificar uma figurinha brilhante
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            {
              icon: '💡',
              titulo: 'Reflexo à luz',
              desc: 'A superfície foil reflete a luz de forma diferente da figurinha comum. Ao inclinar sob uma fonte de luz, ela brilha com efeito metálico ou arco-íris.',
            },
            {
              icon: '🖐️',
              titulo: 'Toque diferente',
              desc: 'A textura é levemente diferente das figurinhas normais — mais lisa e com sensação de revestimento superficial ao toque.',
            },
            {
              icon: '🔢',
              titulo: 'Prefixo no número',
              desc: 'Algumas figurinhas especiais têm prefixo próprio (como "SP", "FO" ou similar) antes do número, indicando que são edição foil ou especial.',
            },
            {
              icon: '🎨',
              titulo: 'Fundo diferenciado',
              desc: 'O fundo ou bordas da figurinha têm acabamento brilhante ou padrão dourado/prateado visível, destacando-se claramente das figurinhas comuns.',
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

      {/* Ranking */}
      <section className="bg-slate-50 py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-black text-slate-800 text-center mb-2">
            Ranking das figurinhas brilhantes mais valiosas
          </h2>
          <p className="text-slate-500 text-center mb-8 text-sm">
            Valor estimado em trocas e compras entre colecionadores · Copa 2026
          </p>
          <div className="space-y-3">
            {RANKING.map(r => (
              <div key={r.nome} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${
                  r.pos === 1 ? 'bg-yellow-400 text-white' :
                  r.pos === 2 ? 'bg-slate-300 text-slate-700' :
                  r.pos === 3 ? 'bg-amber-600 text-white' :
                  'bg-slate-100 text-slate-500'
                }`}>
                  {r.pos}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm">{r.nome}</p>
                  <p className="text-xs text-slate-400">{r.seleção}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-black text-green-600 text-sm">{r.valor}</p>
                  <p className="text-[10px] text-slate-400">em trocas</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 text-center mt-4">
            * Valores estimados com base em negociações entre colecionadores. Podem variar conforme oferta e demanda.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-black text-slate-800 text-center mb-8">
          Perguntas frequentes sobre figurinhas brilhantes
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
          Troque suas figurinhas brilhantes
        </h2>
        <p className="text-green-100 mb-6 max-w-md mx-auto">
          Cadastre-se grátis, marque suas brilhantes repetidas e encontre quem tem as que faltam com match automático.
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
          <Link href="/copa-2026/como-completar" className="hover:text-white transition-colors">Como Completar</Link>
          <Link href="/copa-2026/brasil" className="hover:text-white transition-colors">🇧🇷 Brasil</Link>
          <Link href="/bancas" className="hover:text-white transition-colors">📍 Bancas</Link>
        </div>
      </div>
    </div>
  )
}
