import type { Metadata } from 'next'
import Link from 'next/link'
import JsonLd from '@/components/JsonLd'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://completando.com.br'

export const metadata: Metadata = {
  title: 'Álbum Copa do Mundo 2026 Figurinhas — Troque e Complete',
  description: 'Tudo sobre o álbum de figurinhas da Copa do Mundo FIFA 2026: 980 figurinhas, 48 seleções, 112 páginas. Troque suas repetidas, venda e complete seu álbum com match automático.',
  keywords: [
    'álbum copa do mundo 2026', 'figurinhas copa do mundo 2026', 'álbum panini copa 2026',
    'quantas figurinhas copa 2026', 'lista figurinhas copa do mundo 2026',
    'como completar álbum copa 2026', 'trocar figurinhas copa 2026',
    'figurinhas repetidas copa do mundo', 'copa do mundo fifa 2026 figurinhas',
    'comprar figurinhas copa 2026', 'álbum panini fifa 2026',
    'figurinhas seleções copa 2026', '48 seleções álbum copa 2026',
  ],
  alternates: { canonical: `${APP_URL}/copa-2026` },
  openGraph: {
    title: 'Álbum Copa do Mundo 2026 — Figurinhas Panini | Completando',
    description: '980 figurinhas, 48 seleções. Troque suas repetidas e complete seu álbum da Copa do Mundo FIFA 2026.',
    url: `${APP_URL}/copa-2026`,
    images: [{ url: `${APP_URL}/logo-bg.png`, width: 1200, height: 630, alt: 'Álbum Copa do Mundo 2026 Figurinhas' }],
  },
}

const SELECOES = [
  { grupo: 'A', times: ['EUA', 'México', 'Canadá', 'Arábia Saudita'] },
  { grupo: 'B', times: ['Brasil', 'Argentina', 'Equador', 'Bolívia'] },
  { grupo: 'C', times: ['França', 'Alemanha', 'Portugal', 'Marrocos'] },
  { grupo: 'D', times: ['Inglaterra', 'Espanha', 'Holanda', 'Austrália'] },
  { grupo: 'E', times: ['Japão', 'Coreia do Sul', 'Irã', 'Iraque'] },
  { grupo: 'F', times: ['Nigéria', 'Costa do Marfim', 'Senegal', 'Camarões'] },
  { grupo: 'G', times: ['Uruguai', 'Colômbia', 'Chile', 'Venezuela'] },
  { grupo: 'H', times: ['Bélgica', 'Itália', 'Suíça', 'Turquia'] },
]

const FAQS = [
  { q: 'Quantas figurinhas tem o álbum da Copa do Mundo 2026?', a: 'O álbum oficial Panini da Copa do Mundo FIFA 2026 tem 980 figurinhas ao total, distribuídas em 112 páginas, cobrindo as 48 seleções participantes.' },
  { q: 'Quantas seleções participam da Copa do Mundo 2026?', a: 'A Copa do Mundo FIFA 2026 conta com 48 seleções — o maior número da história. Será realizada nos Estados Unidos, Canadá e México.' },
  { q: 'Como trocar figurinhas repetidas da Copa 2026?', a: 'No Completando você anncia suas repetidas gratuitamente. O sistema faz o match automático com outros colecionadores que têm o que você precisa. Quando há compatibilidade dos dois lados, você combina o encontro diretamente.' },
  { q: 'Quanto custa o álbum Panini Copa do Mundo 2026?', a: 'O álbum base é vendido em bancas e papelarias. As figurinhas avulsas variam de R$ 0,50 a R$ 5,00 dependendo do tipo (normal, brilhante, especial). No Completando você pode conseguir as que faltam por troca sem custo.' },
  { q: 'Onde comprar figurinhas da Copa 2026?', a: 'Além de bancas e papelarias, você pode encontrar colecionadores com figurinhas disponíveis para venda no Completando. Use a aba Bancas para encontrar pontos parceiros perto de você.' },
  { q: 'Qual a diferença entre figurinhas normais e brilhantes da Copa 2026?', a: 'As figurinhas brilhantes (foil) são edições especiais de jogadores destaque e escudos. São mais raras, valorizadas e normalmente as últimas a serem completadas.' },
]

export default function Copa2026Page() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Álbum de Figurinhas Copa do Mundo FIFA 2026 — Guia Completo',
      description: 'Guia completo sobre o álbum Panini da Copa do Mundo FIFA 2026: figurinhas, seleções, como trocar e completar.',
      url: `${APP_URL}/copa-2026`,
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
            🏆 Panini Oficial · USA, CAN & MEX 2026
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight">
            Álbum Copa do Mundo 2026
            <span className="block text-green-400 mt-1">Figurinhas Panini FIFA</span>
          </h1>
          <p className="text-slate-300 text-lg mb-3 max-w-2xl mx-auto">
            980 figurinhas · 48 seleções · 112 páginas
          </p>
          <p className="text-slate-400 text-base mb-8 max-w-xl mx-auto">
            Troque suas repetidas, venda o que sobrou e complete seu álbum com match automático entre colecionadores de todo o Brasil.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/cadastro" className="bg-green-500 hover:bg-green-400 text-white font-black px-8 py-4 rounded-xl text-base transition-colors shadow-lg shadow-green-500/25">
              Começar grátis 🚀
            </Link>
            <Link href="/bancas" className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-8 py-4 rounded-xl text-base transition-colors">
              📍 Bancas perto de mim
            </Link>
          </div>
        </div>
      </section>

      {/* Números do álbum */}
      <section className="max-w-4xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-black text-slate-800 text-center mb-8">O álbum em números</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { valor: '980',  label: 'Figurinhas',    icon: '🖼️' },
            { valor: '48',   label: 'Seleções',       icon: '🌍' },
            { valor: '112',  label: 'Páginas',        icon: '📖' },
            { valor: '3',    label: 'Países-sede',    icon: '🏟️' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center">
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="text-3xl font-black text-green-600">{s.valor}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section className="bg-slate-50 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-black text-slate-800 text-center mb-2">
            Como trocar figurinhas da Copa 2026 no Completando
          </h2>
          <p className="text-slate-500 text-center mb-8">
            Sem grupos de WhatsApp lotados. Sem planilha. Match automático e direto.
          </p>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { n: '1', icon: '📖', title: 'Monte seu álbum', desc: 'Marque quais figurinhas você tem coladas, quais estão repetidas e quais ainda precisam.' },
              { n: '2', icon: '🔁', title: 'Receba matches', desc: 'O sistema cruza automaticamente com outros colecionadores. Apareceu match = alguém tem o que você precisa e precisa do que você tem.' },
              { n: '3', icon: '📱', title: 'Combine o encontro', desc: 'Envie uma proposta. Quando ela aceitar, os dois recebem o contato um do outro para combinar pessoalmente.' },
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

      {/* Seleções */}
      <section className="max-w-4xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-black text-slate-800 text-center mb-2">
          48 seleções no álbum Copa do Mundo 2026
        </h2>
        <p className="text-slate-500 text-center mb-8 text-sm">
          Maior Copa da história — pela primeira vez com 48 países
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SELECOES.map(g => (
            <div key={g.grupo} className="bg-white rounded-xl border border-slate-100 p-4">
              <p className="text-xs font-black text-green-600 uppercase tracking-wide mb-2">Grupo {g.grupo}</p>
              <ul className="space-y-1">
                {g.times.map(t => (
                  <li key={t} className="text-sm text-slate-700">⚽ {t}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 text-center mt-4">
          * Grupos ilustrativos. Consulte a Fifa.com para a tabela oficial.
        </p>
      </section>

      {/* Tipos de figurinha */}
      <section className="bg-slate-50 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-black text-slate-800 text-center mb-8">
            Tipos de figurinhas da Copa 2026
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: '🃏', tipo: 'Normal', desc: 'Jogadores e fotos das seleções. Compõem a maior parte do álbum.', dica: 'Mais fáceis de trocar' },
              { icon: '✨', tipo: 'Brilhante (Foil)', desc: 'Edição especial com acabamento metalizado. Escudos, jogadores destaque e especiais.', dica: 'Mais raras e valorizadas' },
              { icon: '🏅', tipo: 'Escudo', desc: 'Figurinhas dos escudos oficiais de cada seleção participante.', dica: 'Uma por seleção' },
            ].map(t => (
              <div key={t.tipo} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className="text-3xl mb-3">{t.icon}</div>
                <h3 className="font-bold text-slate-800 mb-1">{t.tipo}</h3>
                <p className="text-sm text-slate-500 mb-3 leading-relaxed">{t.desc}</p>
                <span className="inline-block text-xs bg-green-50 text-green-700 font-semibold px-2.5 py-1 rounded-full">{t.dica}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-black text-slate-800 text-center mb-8">
          Perguntas frequentes sobre o álbum Copa 2026
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

      {/* CTA final */}
      <section className="bg-green-500 text-white text-center py-14 px-4">
        <h2 className="text-2xl md:text-3xl font-black mb-3">
          Comece a trocar figurinhas da Copa 2026 agora
        </h2>
        <p className="text-green-100 mb-6 max-w-md mx-auto">
          Cadastro grátis. Marque suas figurinhas e receba matches automáticos com colecionadores perto de você.
        </p>
        <Link href="/cadastro" className="inline-block bg-white text-green-600 font-black px-8 py-4 rounded-xl text-base hover:bg-green-50 transition-colors shadow-lg">
          Criar conta grátis →
        </Link>
      </section>

      {/* Footer links internos */}
      <div className="bg-slate-900 text-slate-400 py-6 px-4">
        <div className="max-w-4xl mx-auto flex flex-wrap gap-4 justify-center text-xs">
          <Link href="/" className="hover:text-white transition-colors">Início</Link>
          <Link href="/bancas" className="hover:text-white transition-colors">📍 Bancas de Figurinhas</Link>
          <Link href="/suporte" className="hover:text-white transition-colors">🛟 Suporte</Link>
          <Link href="/cadastro" className="hover:text-white transition-colors">Criar conta</Link>
        </div>
      </div>
    </div>
  )
}
