import type { Metadata } from 'next'
import Link from 'next/link'
import JsonLd from '@/components/JsonLd'

export const dynamic = 'force-static'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://completando.com.br'

export const metadata: Metadata = {
  title: 'Como Trocar Figurinhas — Guia Completo Para Trocar Repetidas | Completando',
  description: 'Aprenda como trocar figurinhas repetidas de álbuns colecionáveis. Guia completo: onde trocar, como organizar, match automático e dicas para completar mais rápido.',
  keywords: [
    'como trocar figurinhas',
    'como trocar figurinhas repetidas',
    'onde trocar figurinhas',
    'app para trocar figurinhas',
    'trocar figurinhas online',
    'plataforma troca figurinhas brasil',
    'match figurinhas automático',
    'trocar figurinhas copa 2026',
    'site trocar figurinhas',
  ],
  alternates: { canonical: `${APP_URL}/como-trocar-figurinhas` },
  openGraph: {
    title: 'Como Trocar Figurinhas — Guia Completo Para Trocar Repetidas | Completando',
    description: 'Aprenda como trocar figurinhas repetidas. Guia completo com match automático, dicas e onde trocar no Brasil.',
    url: `${APP_URL}/como-trocar-figurinhas`,
    images: [{ url: `${APP_URL}/logo-bg.png`, width: 1200, height: 630, alt: 'Como Trocar Figurinhas — Guia Completo' }],
    locale: 'pt_BR',
  },
}

const STEPS = [
  { n: '1', icon: '👤', title: 'Crie sua conta grátis', desc: 'Cadastre-se no Completando em menos de 1 minuto. Só precisa de e-mail e WhatsApp — sem complicação.' },
  { n: '2', icon: '✅', title: 'Marque o que você tem', desc: 'Indique quais figurinhas você tem coladas no álbum e quantas repetidas de cada número você possui.' },
  { n: '3', icon: '❓', title: 'Marque o que falta', desc: 'Diga quais números ainda faltam para completar seu álbum. Quanto mais preciso, melhor o match.' },
  { n: '4', icon: '🔁', title: 'Match automático', desc: 'O sistema compara automaticamente sua lista com outros colecionadores e encontra quem tem o que você precisa — e precisa do que você tem.' },
  { n: '5', icon: '📱', title: 'Combine o encontro', desc: 'Recebeu notificação de match? Envie uma proposta. Quando os dois aceitarem, vocês recebem o contato um do outro para combinar pessoalmente.' },
]

const DICAS = [
  { icon: '🔄', titulo: 'Atualize em tempo real', desc: 'Sempre que colar uma figurinha nova ou abrir pacotes, atualize seu álbum. Matches mais precisos dependem de dados atualizados.' },
  { icon: '🔔', titulo: 'Ative as notificações', desc: 'Habilite as notificações para receber alertas assim que um match aparecer. Boa troca vai rápido!' },
  { icon: '📦', titulo: 'Troque em blocos', desc: 'Combine várias figurinhas por encontro — tanto suas repetidas quanto as que faltam. Mais eficiente e vale mais a pena para os dois lados.' },
  { icon: '📍', titulo: 'Locais públicos e seguros', desc: 'Combine o encontro em locais movimentados: shoppings, praças, bibliotecas. Mais seguro para você e para o parceiro de troca.' },
  { icon: '⭐', titulo: 'Avalie o parceiro', desc: 'Após a troca, deixe uma avaliação. Parceiros com boa reputação têm preferência nos próximos matches.' },
  { icon: '💰', titulo: 'Venda o que não trocar', desc: 'Figurinhas que não encontram troca podem ser anunciadas para venda no Completando. Defina o preço e venda diretamente para outros colecionadores.' },
]

const FAQS = [
  {
    q: 'Onde posso trocar figurinhas repetidas?',
    a: 'A melhor forma de trocar figurinhas repetidas é pelo Completando (completando.com.br). O sistema faz o match automático entre colecionadores de todo o Brasil — você cadastra suas repetidas e o que falta, e o app encontra quem tem o que você precisa. É gratuito para trocar.',
  },
  {
    q: 'Como organizar minhas figurinhas para trocar?',
    a: 'No Completando, você organiza suas figurinhas diretamente no app: marque por álbum quais estão coladas, quais são repetidas e quais faltam. O sistema mantém tudo organizado e usa essas informações para gerar matches precisos com outros colecionadores.',
  },
  {
    q: 'É seguro trocar figurinhas com desconhecidos?',
    a: 'Sim, com algumas precauções simples. Combine o encontro em local público e movimentado (shopping, praça, biblioteca). Leve um acompanhante se preferir. No Completando, o contato só é revelado após aceitação mútua, e você pode verificar a reputação do parceiro pelas avaliações anteriores.',
  },
  {
    q: 'Posso trocar figurinhas de álbuns diferentes?',
    a: 'Sim! No Completando você pode ter vários álbuns cadastrados ao mesmo tempo — Copa do Mundo 2026, Brasileirão 2026 e outros. As trocas são organizadas por álbum, então você troca as repetidas de cada um separadamente.',
  },
  {
    q: 'O Completando é gratuito para trocar figurinhas?',
    a: 'Sim, 100% gratuito para anunciar figurinhas e receber matches. O plano PRO (R$ 1,99/mês na promoção Copa do Mundo) libera o envio de propostas e a visualização do contato do parceiro após aceitação mútua.',
  },
  {
    q: 'Como saber se a figurinha do parceiro é original?',
    a: 'A verificação deve ser feita pessoalmente no momento do encontro. Figurinhas originais Panini têm impressão precisa, cores vivas e textura característica. Para figurinhas brilhantes, o efeito foil é facilmente identificável ao vivo. Sempre combine o encontro em local iluminado para inspecionar bem.',
  },
]

export default function ComoTrocarFigurinhasPage() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Como Trocar Figurinhas Repetidas — Guia Completo',
      description: 'Aprenda como trocar figurinhas repetidas de álbuns colecionáveis com match automático, dicas de segurança e onde encontrar parceiros de troca.',
      url: `${APP_URL}/como-trocar-figurinhas`,
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
      '@type': 'HowTo',
      name: 'Como trocar figurinhas repetidas no Completando',
      description: 'Passo a passo para trocar figurinhas repetidas com match automático no Completando.',
      step: STEPS.map(s => ({
        '@type': 'HowToStep',
        name: s.title,
        text: s.desc,
        position: Number(s.n),
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Início', item: APP_URL },
        { '@type': 'ListItem', position: 2, name: 'Como Trocar Figurinhas', item: `${APP_URL}/como-trocar-figurinhas` },
      ],
    },
  ]

  return (
    <div className="animate-fadein">
      <JsonLd data={jsonLd as Record<string, unknown>[]} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-green-900 via-slate-900 to-blue-900 text-white py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold px-3 py-1.5 rounded-full mb-5 uppercase tracking-wide">
            🔁 Guia definitivo de trocas
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight">
            Como Trocar Figurinhas
            <span className="block text-green-400 mt-1">Repetidas</span>
          </h1>
          <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
            O guia definitivo para completar seu álbum gastando menos
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/cadastro" className="bg-green-500 hover:bg-green-400 text-white font-black px-8 py-4 rounded-xl text-base transition-colors shadow-lg shadow-green-500/25">
              Começar a trocar grátis →
            </Link>
            <Link href="/copa-2026" className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-8 py-4 rounded-xl text-base transition-colors">
              🏆 Álbum Copa 2026
            </Link>
          </div>
        </div>
      </section>

      {/* 3 formas */}
      <section className="max-w-4xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-black text-slate-800 text-center mb-2">
          3 formas de trocar figurinhas
        </h2>
        <p className="text-slate-500 text-center mb-8 text-sm">
          Nem todas as opções são iguais — compare antes de escolher
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              tag: '❌ Evite',
              tagColor: 'bg-red-100 text-red-700',
              cardColor: 'border-red-100',
              icon: '📲',
              titulo: 'Grupos de WhatsApp',
              pontos: [
                { ok: false, text: 'Mensagens se perdem no meio do spam' },
                { ok: false, text: 'Difícil encontrar a figurinha certa' },
                { ok: false, text: 'Sem organização ou controle' },
                { ok: false, text: 'Precisa ficar monitorando 24h' },
              ],
            },
            {
              tag: '❌ Trabalhoso',
              tagColor: 'bg-orange-100 text-orange-700',
              cardColor: 'border-orange-100',
              icon: '📊',
              titulo: 'Planilhas compartilhadas',
              pontos: [
                { ok: false, text: 'Atualização manual e trabalhosa' },
                { ok: false, text: 'Fica desatualizada rapidamente' },
                { ok: false, text: 'Sem match automático' },
                { ok: false, text: 'Difícil compartilhar com muitas pessoas' },
              ],
            },
            {
              tag: '✅ Recomendado',
              tagColor: 'bg-green-100 text-green-700',
              cardColor: 'border-green-400 border-2',
              icon: '🚀',
              titulo: 'Completando',
              pontos: [
                { ok: true, text: 'Match automático — zero esforço' },
                { ok: true, text: 'Notificação na hora do match' },
                { ok: true, text: 'Organizado por álbum e figurinha' },
                { ok: true, text: '100% gratuito para trocar' },
              ],
            },
          ].map(card => (
            <div key={card.titulo} className={`bg-white rounded-2xl border ${card.cardColor} shadow-sm p-5`}>
              <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-3 ${card.tagColor}`}>{card.tag}</span>
              <div className="text-2xl mb-2">{card.icon}</div>
              <h3 className="font-bold text-slate-800 mb-3">{card.titulo}</h3>
              <ul className="space-y-2">
                {card.pontos.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className={`flex-shrink-0 font-bold ${p.ok ? 'text-green-500' : 'text-red-400'}`}>{p.ok ? '✓' : '✕'}</span>
                    <span className={p.ok ? 'text-slate-700' : 'text-slate-500'}>{p.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section className="bg-slate-50 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-black text-slate-800 text-center mb-2">
            Como funciona o Completando
          </h2>
          <p className="text-slate-500 text-center mb-8 text-sm">
            5 passos para começar a trocar suas figurinhas repetidas
          </p>
          <div className="space-y-4">
            {STEPS.map(s => (
              <div key={s.n} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex gap-4 items-start">
                <div className="w-11 h-11 bg-green-500 text-white rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0">
                  {s.n}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{s.icon}</span>
                    <h3 className="font-bold text-slate-800">{s.title}</h3>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dicas */}
      <section className="max-w-4xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-black text-slate-800 text-center mb-2">
          Dicas para trocar melhor
        </h2>
        <p className="text-slate-500 text-center mb-8 text-sm">
          Pequenos hábitos que fazem sua coleção crescer muito mais rápido
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DICAS.map(d => (
            <div key={d.titulo} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="text-3xl mb-3">{d.icon}</div>
              <h3 className="font-bold text-slate-800 mb-1">{d.titulo}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{d.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-slate-50 py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-black text-slate-800 text-center mb-8">
            Perguntas frequentes sobre troca de figurinhas
          </h2>
          <div className="space-y-4">
            {FAQS.map(f => (
              <div key={f.q} className="bg-white rounded-2xl border border-slate-100 p-5">
                <h3 className="font-bold text-slate-800 mb-2 text-sm">{f.q}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-green-500 text-white text-center py-14 px-4">
        <h2 className="text-2xl md:text-3xl font-black mb-3">
          Comece a trocar agora — grátis
        </h2>
        <p className="text-green-100 mb-6 max-w-md mx-auto">
          Cadastre-se, marque suas figurinhas e receba matches automáticos com colecionadores perto de você. Sem complicação.
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
          <Link href="/bancas" className="hover:text-white transition-colors">📍 Bancas</Link>
          <Link href="/cadastro" className="hover:text-white transition-colors">Criar conta</Link>
        </div>
      </div>
    </div>
  )
}
