import type { Metadata } from 'next'
import Link from 'next/link'
import JsonLd from '@/components/JsonLd'

export const dynamic = 'force-static'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://completando.com.br'
const CITY = 'Curitiba'
const SLUG = 'curitiba'
const DATE_MODIFIED = new Date().toISOString().split('T')[0]

export const metadata: Metadata = {
  title: 'Bancas de Figurinhas em Curitiba — Copa 2026 e Brasileirão | Completando',
  description:
    'Encontre bancas de figurinhas em Curitiba para comprar, vender e trocar figurinhas da Copa 2026 e Brasileirão. Veja estoque, horários e localização no mapa.',
  keywords: [
    'bancas figurinhas curitiba',
    'onde comprar figurinhas copa 2026 curitiba',
    'banca figurinhas cwb',
    'figurinhas repetidas curitiba',
    'trocar figurinhas curitiba',
  ],
  alternates: { canonical: `${APP_URL}/bancas/${SLUG}` },
  openGraph: {
    title: 'Bancas de Figurinhas em Curitiba — Copa 2026 e Brasileirão | Completando',
    description:
      'Encontre bancas de figurinhas em Curitiba para comprar, vender e trocar figurinhas da Copa 2026 e Brasileirão.',
    url: `${APP_URL}/bancas/${SLUG}`,
    siteName: 'Completando',
    locale: 'pt_BR',
    type: 'website',
  },
}

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Completando',
    description: `Plataforma para encontrar bancas de figurinhas em ${CITY} e trocar figurinhas da Copa 2026 e Brasileirão.`,
    url: `${APP_URL}/bancas/${SLUG}`,
    areaServed: { '@type': 'City', name: CITY },
    datePublished: '2026-01-01',
    dateModified: DATE_MODIFIED,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: APP_URL },
      { '@type': 'ListItem', position: 2, name: 'Bancas', item: `${APP_URL}/bancas` },
      { '@type': 'ListItem', position: 3, name: CITY, item: `${APP_URL}/bancas/${SLUG}` },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Onde comprar figurinhas da Copa 2026 e Brasileirão em Curitiba?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No Completando você encontra bancas de figurinhas cadastradas em Curitiba com estoque da Copa 2026 e Brasileirão. Acesse completando.com.br/bancas e veja as bancas mais próximas.',
        },
      },
      {
        '@type': 'Question',
        name: 'Tem banca de figurinhas perto de mim em Curitiba?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'O Completando exibe bancas de figurinhas em Curitiba no mapa, com endereço, horário e estoque disponível. Localize a mais próxima de você diretamente pelo aplicativo.',
        },
      },
      {
        '@type': 'Question',
        name: 'Como encontrar figurinhas raras em Curitiba?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Cadastre-se no Completando e ative alertas de figurinhas raras. Quando uma banca em Curitiba cadastrar a figurinha que você precisa, você recebe uma notificação imediatamente.',
        },
      },
      {
        '@type': 'Question',
        name: 'Posso vender figurinhas em Curitiba pelo Completando?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sim! Qualquer pessoa pode anunciar figurinhas repetidas no Completando gratuitamente. Se você tem uma banca em Curitiba, pode cadastrá-la e receber clientes pelo aplicativo.',
        },
      },
    ],
  },
]

export default function CuritibaPage() {
  return (
    <>
      <JsonLd data={jsonLd} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-green-900 via-slate-900 to-blue-900 text-white py-16 px-4 text-center animate-fadein">
        <div className="max-w-3xl mx-auto">
          <p className="text-4xl mb-3">📍</p>
          <h1 className="text-3xl md:text-4xl font-black mb-4">
            Bancas de Figurinhas em Curitiba
          </h1>
          <p className="text-green-200 text-lg mb-8">
            Encontre onde comprar figurinhas da Copa 2026, Brasileirão e mais em Curitiba
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/bancas"
              className="bg-green-500 hover:bg-green-400 text-white font-black px-6 py-3 rounded-2xl transition-colors"
            >
              Ver bancas cadastradas
            </Link>
            <Link
              href="/bancas"
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-2xl transition-colors border border-white/20"
            >
              Cadastrar minha banca
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12 pb-24 md:pb-12 space-y-14">

        {/* How it works */}
        <section className="animate-fadein">
          <h2 className="text-2xl font-black text-slate-800 mb-6 text-center">
            Como funciona
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { step: '1', text: `Busque bancas em Curitiba no mapa` },
              { step: '2', text: 'Veja o estoque disponível' },
              { step: '3', text: 'Reserve ou vá pessoalmente' },
            ].map(({ step, text }) => (
              <div
                key={step}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center"
              >
                <div className="w-10 h-10 bg-green-500 text-white font-black rounded-full flex items-center justify-center mx-auto mb-3 text-lg">
                  {step}
                </div>
                <p className="text-slate-700 font-bold">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why Completando */}
        <section className="animate-fadein">
          <h2 className="text-2xl font-black text-slate-800 mb-6 text-center">
            Por que usar o Completando?
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: '🗺️', title: 'Localização no mapa', desc: 'Veja bancas de figurinhas em Curitiba no mapa e encontre a mais próxima de você.' },
              { icon: '📦', title: 'Estoque atualizado', desc: 'As bancas mantêm o estoque atualizado para você saber o que está disponível antes de sair de casa.' },
              { icon: '🔔', title: 'Alertas de novas figurinhas', desc: 'Receba notificações quando a figurinha que você precisa aparecer em alguma banca de Curitiba.' },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
              >
                <p className="text-3xl mb-3">{icon}</p>
                <h3 className="font-black text-slate-800 mb-2">{title}</h3>
                <p className="text-slate-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="animate-fadein">
          <h2 className="text-2xl font-black text-slate-800 mb-6 text-center">
            Perguntas frequentes
          </h2>
          <div className="space-y-4">
            {[
              {
                q: 'Onde comprar figurinhas da Copa 2026 e Brasileirão em Curitiba?',
                a: 'No Completando você encontra bancas de figurinhas cadastradas em Curitiba com estoque da Copa 2026 e Brasileirão. Acesse a seção de bancas e veja as mais próximas.',
              },
              {
                q: 'Tem banca de figurinhas perto de mim em Curitiba?',
                a: 'O Completando exibe bancas de figurinhas em Curitiba no mapa, com endereço, horário e estoque disponível. Localize a mais próxima de você diretamente pelo aplicativo.',
              },
              {
                q: 'Como encontrar figurinhas raras em Curitiba?',
                a: 'Cadastre-se no Completando e ative alertas de figurinhas raras. Quando uma banca em Curitiba cadastrar a figurinha que você precisa, você recebe uma notificação imediatamente.',
              },
              {
                q: 'Posso vender figurinhas em Curitiba pelo Completando?',
                a: 'Sim! Qualquer pessoa pode anunciar figurinhas repetidas no Completando gratuitamente. Se você tem uma banca em Curitiba, pode cadastrá-la e receber clientes pelo aplicativo.',
              },
            ].map(({ q, a }) => (
              <div
                key={q}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
              >
                <h3 className="font-black text-slate-800 mb-2">{q}</h3>
                <p className="text-slate-500 text-sm">{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="animate-fadein text-center">
          <Link
            href="/bancas"
            className="inline-block bg-green-500 hover:bg-green-600 text-white font-black px-8 py-4 rounded-2xl text-lg transition-colors shadow-md"
          >
            Ver bancas em Curitiba
          </Link>
        </section>

        {/* Footer links */}
        <footer className="border-t border-slate-100 pt-8 text-center text-sm text-slate-400 animate-fadein">
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/" className="hover:text-green-600 transition-colors">Início</Link>
            <Link href="/copa-2026" className="hover:text-green-600 transition-colors">Copa 2026</Link>
            <Link href="/bancas" className="hover:text-green-600 transition-colors">Bancas</Link>
            <Link href="/como-trocar-figurinhas" className="hover:text-green-600 transition-colors">Como trocar figurinhas</Link>
            <Link href="/cadastro" className="hover:text-green-600 transition-colors">Cadastro</Link>
          </div>
        </footer>
      </div>
    </>
  )
}
