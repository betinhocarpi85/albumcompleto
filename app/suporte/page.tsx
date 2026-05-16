'use client'

import { useState } from 'react'
import Link from 'next/link'
import TutorialSection from '@/components/TutorialSection'
import JsonLd from '@/components/JsonLd'

const WHATSAPP = 'https://wa.me/5521996787737?text=Olá! Preciso de ajuda com o Completando.'

const FAQS = [
  {
    categoria: '🔁 Trocas e Matches',
    itens: [
      {
        q: 'Como funciona o match?',
        a: 'O sistema compara automaticamente as figurinhas que você tem (anunciadas como "tenho") com as que outros usuários precisam, e vice-versa. Quando há compatibilidade dos dois lados, aparece como um match.',
      },
      {
        q: 'Como faço para combinar uma troca?',
        a: 'Acesse a aba "Matches", encontre a pessoa, e envie uma proposta. Quando ela aceitar, vocês recebem o contato um do outro para combinar o encontro. Sugerimos usar uma de nossas bancas parceiras como ponto de encontro.',
      },
      {
        q: 'Posso trocar figurinhas de álbuns diferentes?',
        a: 'Não. As trocas são feitas dentro do mesmo álbum. Cada álbum tem sua própria listagem de matches.',
      },
      {
        q: 'Meu match sumiu. O que aconteceu?',
        a: 'Isso pode acontecer se a outra pessoa removeu o anúncio, trocou as figurinhas com outra pessoa, ou desativou a conta. Fique de olho e anuncie sempre o que tem disponível.',
      },
    ],
  },
  {
    categoria: '📢 Anúncios',
    itens: [
      {
        q: 'Como anuncio minhas figurinhas repetidas?',
        a: 'Acesse "Anúncios" → escolha o álbum → marque as figurinhas que você tem repetidas → selecione "Tenho" ou "Preciso" → publique. Pronto!',
      },
      {
        q: 'Posso vender figurinhas além de trocar?',
        a: 'Sim! Ao criar um anúncio, escolha o tipo "Venda" e informe o preço. Qualquer usuário pode anunciar para venda.',
      },
      {
        q: 'Quantos anúncios posso criar?',
        a: 'Todos os usuários podem criar anúncios de troca e venda sem limite. A diferença está nas propostas: apenas usuários PRO podem enviar propostas de troca para outros colecionadores.',
      },
    ],
  },
  {
    categoria: '⭐ Plano PRO',
    itens: [
      {
        q: 'Quais são as vantagens do PRO?',
        a: 'Com o PRO você aparece nos matches de outros usuários PRO, consegue ver o contato deles e enviar propostas de troca. No plano gratuito você cria anúncios e vê seus próprios matches, mas não aparece para usuários PRO, não visualiza contatos e não envia propostas.',
      },
      {
        q: 'Como assino o PRO?',
        a: 'Vá em "Minha Conta" → clique em "Assinar PRO" → escolha o plano (mensal ou anual) → conclua o pagamento. A ativação é imediata.',
      },
      {
        q: 'Como cancelo minha assinatura?',
        a: 'Entre em contato pelo WhatsApp abaixo e solicite o cancelamento. Você continuará com o PRO até o fim do período pago.',
      },
      {
        q: 'O pagamento é seguro?',
        a: 'Sim. Os pagamentos são processados pela Pagar.me, empresa do grupo Stone, certificada PCI-DSS. Não armazenamos dados do seu cartão.',
      },
    ],
  },
  {
    categoria: '👤 Conta e Privacidade',
    itens: [
      {
        q: 'Como altero minha senha?',
        a: 'Na tela de login, clique em "Esqueci minha senha". Você receberá um link por e-mail para criar uma nova senha.',
      },
      {
        q: 'Como excluo minha conta?',
        a: 'Acesse "Minha Conta" → role até o final → clique em "Excluir conta". Atenção: todos os seus dados e anúncios serão removidos permanentemente.',
      },
      {
        q: 'Meus dados são compartilhados com terceiros?',
        a: 'Não. Seus dados são usados apenas para o funcionamento do app. Leia nossa Política de Privacidade para mais detalhes.',
      },
      {
        q: 'Como reporto um usuário?',
        a: 'Entre em contato pelo nosso WhatsApp informando o nome do usuário e o motivo do reporte. Nossa equipe analisará e tomará as medidas necessárias.',
      },
    ],
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="text-sm font-medium text-slate-700">{q}</span>
        <span className={`text-slate-400 text-lg transition-transform shrink-0 ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-slate-500 leading-relaxed border-t border-slate-100 pt-3">
          {a}
        </div>
      )}
    </div>
  )
}

export default function SuportePage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.flatMap(cat =>
      cat.itens.map(item => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      }))
    ),
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-10">
      <JsonLd data={faqSchema} />

      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🛟</div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Como podemos ajudar?</h1>
        <p className="text-sm text-slate-500">Encontre respostas nas perguntas frequentes ou fale diretamente com a gente.</p>
      </div>

      {/* WhatsApp CTA */}
      <a
        href={WHATSAPP}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl p-4 mb-8 transition-colors"
      >
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
        </div>
        <div>
          <p className="font-bold text-base">Falar com o suporte</p>
          <p className="text-green-100 text-sm">Atendimento via WhatsApp · (21) 99678-7737</p>
        </div>
        <span className="ml-auto text-2xl">→</span>
      </a>

      {/* FAQ */}
      <h2 className="text-base font-bold text-slate-700 mb-4">Perguntas frequentes</h2>

      <div className="space-y-6">
        {FAQS.map(cat => (
          <div key={cat.categoria}>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">{cat.categoria}</p>
            <div className="space-y-2">
              {cat.itens.map(item => <FaqItem key={item.q} {...item} />)}
            </div>
          </div>
        ))}
      </div>

      {/* Tutorial */}
      <div className="mt-10">
        <h2 className="text-base font-bold text-slate-700 mb-4">📖 Como usar o Completando</h2>
        <TutorialSection />
      </div>

      {/* Links úteis */}
      <div className="mt-8 grid grid-cols-2 gap-3">
        <Link href="/termos"
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 rounded-xl px-4 py-3 text-sm text-slate-600 font-medium transition-colors">
          📄 Termos de Uso
        </Link>
        <Link href="/privacidade"
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 rounded-xl px-4 py-3 text-sm text-slate-600 font-medium transition-colors">
          🔒 Privacidade
        </Link>
        <Link href="/bancas"
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 rounded-xl px-4 py-3 text-sm text-slate-600 font-medium transition-colors">
          📍 Pontos de Troca
        </Link>
        <Link href="/conta"
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 rounded-xl px-4 py-3 text-sm text-slate-600 font-medium transition-colors">
          👤 Minha Conta
        </Link>
      </div>

    </div>
  )
}
