import type { Metadata } from 'next'
import Link from 'next/link'
import JsonLd from '@/components/JsonLd'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://completando.com.br'

export const metadata: Metadata = {
  title: 'Como Completar o Álbum da Copa 2026 — Quantos Pacotinhos Precisa?',
  description: 'Descubra quantos pacotinhos são necessários para completar o álbum da Copa do Mundo 2026. Dicas para economizar, trocar figurinhas e completar mais rápido com o Completando.',
  keywords: [
    'como completar álbum copa 2026', 'quantos pacotinhos para completar álbum copa 2026',
    'quantas figurinhas copa 2026', 'dicas álbum copa 2026', 'completar álbum copa do mundo',
    'custo completar álbum copa 2026', 'trocar figurinhas repetidas copa 2026',
    'quantos pacotinhos álbum panini', 'figurinhas repetidas copa 2026',
    'economizar figurinhas copa 2026', 'estratégia completar álbum',
  ],
  alternates: { canonical: `${APP_URL}/copa-2026/como-completar` },
  openGraph: {
    title: 'Como Completar o Álbum da Copa 2026 — Guia Completo',
    description: 'Quantos pacotinhos precisa? Como economizar? Tudo sobre completar o álbum Panini Copa 2026.',
    url: `${APP_URL}/copa-2026/como-completar`,
    images: [{ url: `${APP_URL}/logo-bg.png`, width: 1200, height: 630 }],
  },
}

const FAQS = [
  {
    q: 'Quantos pacotinhos são necessários para completar o álbum da Copa 2026?',
    a: 'Comprando pacotinhos sozinho, a média estatística é de 3.500 a 4.500 pacotinhos para completar as 980 figurinhas — pelo problema matemático do colecionador (coupon collector\'s problem). Com trocas ativas no Completando, esse número cai para 800 a 1.200 pacotinhos, uma economia de até 75%.',
  },
  {
    q: 'Quanto custa completar o álbum da Copa 2026?',
    a: 'Comprando só pacotinhos: entre R$ 3.500 e R$ 6.000 em média, dependendo do preço unitário. Com trocas via Completando: entre R$ 800 e R$ 1.500 — economizando até 75% do valor total.',
  },
  {
    q: 'Como trocar figurinhas repetidas da Copa 2026?',
    a: 'No Completando você cadastra suas figurinhas repetidas e as que faltam. O sistema faz match automático com outros colecionadores. Quando há compatibilidade dos dois lados, vocês combinam o encontro diretamente.',
  },
  {
    q: 'Qual a melhor estratégia para completar o álbum mais rápido?',
    a: 'Compre pacotinhos regularmente (sem exagerar), cadastre imediatamente no Completando as repetidas e as que faltam, ative as notificações para saber na hora que aparecer um match, e combine trocas presenciais. Grupos grandes de troca aceleram muito.',
  },
  {
    q: 'As figurinhas brilhantes (foil) são mais difíceis de conseguir?',
    a: 'Sim. Figurinhas brilhantes e especiais aparecem em menor proporção nos pacotinhos — estima-se 1 a cada 5 pacotinhos. Por isso são as últimas a serem completadas e as mais valiosas para troca.',
  },
  {
    q: 'Posso vender figurinhas repetidas da Copa 2026?',
    a: 'Sim! No Completando você pode anunciar figurinhas avulsas para venda. Muitos colecionadores preferem comprar figurinhas específicas que faltam em vez de abrir pacotinhos na sorte.',
  },
]

export default function ComoCompletarPage() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Como Completar o Álbum da Copa do Mundo 2026 — Guia Completo',
      description: 'Quantos pacotinhos precisam para completar, quanto custa e como economizar trocando figurinhas.',
      url: `${APP_URL}/copa-2026/como-completar`,
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
        { '@type': 'ListItem', position: 3, name: 'Como Completar', item: `${APP_URL}/copa-2026/como-completar` },
      ],
    },
  ]

  return (
    <div className="animate-fadein">
      <JsonLd data={jsonLd as Record<string, unknown>[]} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-green-900 via-slate-900 to-blue-900 text-white py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-xs font-bold px-3 py-1.5 rounded-full mb-5 uppercase tracking-wide">
            🏆 Guia Oficial · Álbum Panini Copa 2026
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight">
            Como Completar o Álbum
            <span className="block text-green-400 mt-1">da Copa do Mundo 2026</span>
          </h1>
          <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
            Quantos pacotinhos precisa? Quanto vai custar? Como economizar até 75%? Tudo aqui.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/cadastro" className="bg-green-500 hover:bg-green-400 text-white font-black px-8 py-4 rounded-xl text-base transition-colors shadow-lg shadow-green-500/25">
              Começar grátis 🚀
            </Link>
            <Link href="/copa-2026" className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-8 py-4 rounded-xl text-base transition-colors">
              🏆 Ver álbum completo
            </Link>
          </div>
        </div>
      </section>

      {/* Calculadora visual */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-black text-slate-800 text-center mb-3">
          Quantos pacotinhos para completar?
        </h2>
        <p className="text-slate-500 text-center mb-8 text-sm">
          A matemática do álbum — e como as trocas mudam tudo
        </p>
        <div className="grid md:grid-cols-2 gap-5">
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
            <div className="text-4xl mb-3">😰</div>
            <h3 className="font-black text-slate-800 text-lg mb-1">Comprando sozinho</h3>
            <p className="text-sm text-slate-500 mb-4">Sem trocas, abrindo pacotinhos na sorte</p>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Pacotinhos estimados</span>
                <span className="font-black text-red-600 text-lg">~4.000</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Custo médio</span>
                <span className="font-black text-red-600 text-lg">R$ 4.000+</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Figurinhas repetidas</span>
                <span className="font-black text-red-600 text-lg">~19.000</span>
              </div>
            </div>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-2xl p-6 relative">
            <div className="absolute -top-3 -right-3 bg-green-500 text-white text-xs font-black px-3 py-1 rounded-full">ECONOMIA DE 75%</div>
            <div className="text-4xl mb-3">😎</div>
            <h3 className="font-black text-slate-800 text-lg mb-1">Com trocas no Completando</h3>
            <p className="text-sm text-slate-500 mb-4">Match automático com outros colecionadores</p>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Pacotinhos estimados</span>
                <span className="font-black text-green-600 text-lg">~1.000</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Custo médio</span>
                <span className="font-black text-green-600 text-lg">R$ 1.000+</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Repetidas trocadas</span>
                <span className="font-black text-green-600 text-lg">Todas!</span>
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-400 text-center mt-4">
          * Estimativas baseadas no problema matemático do colecionador (coupon collector's problem) com 980 figurinhas únicas.
        </p>
      </section>

      {/* Passo a passo */}
      <section className="bg-slate-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-black text-slate-800 text-center mb-2">
            Estratégia para completar mais rápido
          </h2>
          <p className="text-slate-500 text-center mb-8 text-sm">
            Seguindo esses passos você economiza tempo e dinheiro
          </p>
          <div className="space-y-4">
            {[
              { n: '1', icon: '📦', title: 'Compre pacotinhos com moderação', desc: 'Abra pacotinhos aos poucos — comprar tudo de uma vez gera mais repetidas do que o necessário. O ideal é comprar em lotes de 20-30 por semana.' },
              { n: '2', icon: '📱', title: 'Cadastre tudo no Completando', desc: 'Assim que abrir, marque no app quais você colou e quais sobraram. Quanto mais rápido cadastrar, mais rápido aparecem os matches.' },
              { n: '3', icon: '🔔', title: 'Ative as notificações', desc: 'Quando aparecer um match com outro colecionador, você recebe alerta na hora. Matches "frescos" são respondidos mais rápido.' },
              { n: '4', icon: '🤝', title: 'Troque em blocos', desc: 'Se você tem 15 repetidas do adversário e ele tem 15 das suas, vale a pena combinar um encontro e trocar tudo de uma vez. Mais eficiente que troca por troca.' },
              { n: '5', icon: '💰', title: 'Venda as sobrando', desc: 'Figurinhas que você não consegue trocar podem ser vendidas no Completando. Use o dinheiro para comprar pacotinhos das que faltam.' },
            ].map(s => (
              <div key={s.n} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex gap-4">
                <div className="w-10 h-10 bg-green-500 text-white rounded-xl flex items-center justify-center font-black text-lg shrink-0">{s.n}</div>
                <div>
                  <div className="text-xl mb-1">{s.icon}</div>
                  <h3 className="font-bold text-slate-800 mb-1">{s.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* A matemática */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-black text-slate-800 text-center mb-8">
          Por que sozinho é tão caro?
        </h2>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <p className="text-slate-600 leading-relaxed mb-4">
            O <strong>problema do colecionador</strong> é um fenômeno matemático: quanto mais próximo de completar, mais difícil fica encontrar as que faltam. Quando você tem 900 figurinhas coladas e faltam 80, a chance de um pacotinho ter exatamente uma das que você precisa é de apenas 8%.
          </p>
          <p className="text-slate-600 leading-relaxed mb-4">
            Isso significa que para as <strong>últimas 80 figurinhas</strong>, você precisaria estatisticamente de <strong>mais de 600 pacotinhos</strong> — quase R$ 3.000 só para fechar o álbum.
          </p>
          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
            <p className="text-green-800 font-semibold text-sm">
              💡 É exatamente aqui que o Completando resolve: você troca suas repetidas com quem tem as que faltam — e vice-versa. O match automático encontra a combinação perfeita entre os dois lados.
            </p>
          </div>
        </div>
      </section>

      {/* Tipos de figurinhas raras */}
      <section className="bg-slate-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-black text-slate-800 text-center mb-8">
            Figurinhas difíceis de conseguir na Copa 2026
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: '✨', tipo: 'Brilhantes (Foil)', raridade: 'Rara', desc: '~1 em cada 5 pacotinhos. Jogadores destaque e escudos especiais. As mais disputadas nas trocas.' },
              { icon: '🏅', tipo: 'Escudos Especiais', raridade: 'Muito rara', desc: 'Edições com acabamento diferenciado. Aparecem em menor frequência e são muito valorizadas.' },
              { icon: '⭐', tipo: 'Edição Limitada', raridade: 'Raríssima', desc: 'Figurinhas de edição especial com numeração. Praticamente impossíveis de encontrar em pacotinhos.' },
            ].map(t => (
              <div key={t.tipo} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className="text-3xl mb-3">{t.icon}</div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-slate-800">{t.tipo}</h3>
                  <span className="text-xs bg-orange-100 text-orange-700 font-semibold px-2 py-0.5 rounded-full">{t.raridade}</span>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-black text-slate-800 text-center mb-8">
          Perguntas frequentes
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
          Complete seu álbum gastando muito menos
        </h2>
        <p className="text-green-100 mb-6 max-w-md mx-auto">
          Cadastro grátis. Marque suas figurinhas e receba matches automáticos com colecionadores perto de você.
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
          <Link href="/copa-2026/brasil" className="hover:text-white transition-colors">🇧🇷 Figurinhas do Brasil</Link>
          <Link href="/bancas" className="hover:text-white transition-colors">📍 Bancas</Link>
          <Link href="/cadastro" className="hover:text-white transition-colors">Criar conta</Link>
        </div>
      </div>
    </div>
  )
}
