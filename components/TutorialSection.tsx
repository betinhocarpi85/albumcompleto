'use client'

import { useState } from 'react'

interface TopicProps {
  emoji: string
  title: string
  children: React.ReactNode
}

function Topic({ emoji, title, children }: TopicProps) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
      >
        <span className="text-2xl flex-shrink-0">{emoji}</span>
        <p className="flex-1 font-bold text-slate-800 text-sm">{title}</p>
        <span className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-slate-50 space-y-3 animate-fadein">
          {children}
        </div>
      )}
    </div>
  )
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="w-6 h-6 rounded-full bg-green-500 text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
        {n}
      </span>
      <p className="text-sm text-slate-600 leading-relaxed">{text}</p>
    </div>
  )
}

function Tip({ text }: { text: string }) {
  return (
    <div className="flex gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
      <span className="text-base flex-shrink-0">💡</span>
      <p className="text-xs text-amber-700 leading-relaxed">{text}</p>
    </div>
  )
}

function Info({ text }: { text: string }) {
  return (
    <div className="flex gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
      <span className="text-base flex-shrink-0">ℹ️</span>
      <p className="text-xs text-blue-700 leading-relaxed">{text}</p>
    </div>
  )
}

export default function TutorialSection() {
  return (
    <div className="animate-fadein space-y-3">
      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide px-1 mb-3">
        Como usar o Completando
      </p>

      {/* COMEÇANDO */}
      <Topic emoji="🚀" title="Primeiros passos — por onde começar">
        <div className="pt-3 space-y-3">
          <Step n={1} text="Complete seu cadastro com nome, telefone e CEP. Esses dados são usados para encontrar colecionadores perto de você." />
          <Step n={2} text='Vá em "Meus Álbuns" e selecione o álbum que você está completando.' />
          <Step n={3} text='Acesse "Álbum" e marque as figurinhas que você já colou. Isso constrói seu inventário.' />
          <Step n={4} text='Vá em "Anúncios" e cadastre as figurinhas que você tem repetidas (para troca) e as que você precisa.' />
          <Step n={5} text='Acesse "Matches" para ver quem tem o que você precisa e precisa do que você tem!' />
          <Tip text="Quanto mais completo seu perfil e anúncios, mais e melhores matches você vai receber." />
        </div>
      </Topic>

      {/* ÁLBUM */}
      <Topic emoji="📚" title="Álbum — marcando suas figurinhas">
        <div className="pt-3 space-y-3">
          <Info text="A seção Álbum mostra todas as figurinhas do álbum. Aqui você registra quais já foram coladas." />
          <Step n={1} text="Toque em uma figurinha para marcá-la como colada. Ela ficará destacada com a borda verde." />
          <Step n={2} text="Use os filtros no topo para ver só as coladas, só as faltantes ou todas." />
          <Step n={3} text="O progresso do álbum aparece na barra no topo da página." />
          <Tip text="Manter o álbum atualizado é essencial — os Matches são calculados com base nas figurinhas que você colou (e as que faltam)." />
        </div>
      </Topic>

      {/* ANÚNCIOS */}
      <Topic emoji="📢" title="Anúncios — o que você tem e o que precisa">
        <div className="pt-3 space-y-3">
          <Info text="Os anúncios dizem ao sistema quais figurinhas você tem repetidas e quais você está procurando para troca ou compra." />
          <Step n={1} text='Em "Anúncios", clique em "Anunciar" para cadastrar figurinhas repetidas (tenho para troca) ou pedidos (preciso comprar/trocar).' />
          <Step n={2} text="Informe o número da figurinha e o tipo: Troca (você oferece em troca de outra) ou Venda (você cobra um valor)." />
          <Step n={3} text='Seus anúncios aparecem na aba "Anunciadas". Você pode editar ou remover a qualquer momento.' />
          <Tip text="Anuncie todas as suas repetidas — quanto mais figurinhas você oferecer, mais chances de dar match com outros colecionadores." />
        </div>
      </Topic>

      {/* MATCHES */}
      <Topic emoji="🤝" title="Matches — encontrando quem trocar">
        <div className="pt-3 space-y-3">
          <Info text="O sistema compara seus anúncios com os de outros usuários e mostra os melhores pares de troca." />
          <Step n={1} text='Acesse "Matches" para ver a lista de colecionadores compatíveis com você.' />
          <Step n={2} text="Cada match mostra o nome, localidade e as figurinhas que vocês podem trocar entre si." />
          <Step n={3} text="Use os filtros para ver Trocas (você dá e recebe figurinhas) ou Compras (você compra de alguém)." />
          <Step n={4} text="Abra o card de um match para ajustar quais figurinhas entram na proposta e clique em Enviar." />
          <Tip text="Matches próximos de você aparecem primeiro. Preencha bairro e cidade no seu perfil para encontrar vizinhos!" />
        </div>
      </Topic>

      {/* PROPOSTAS */}
      <Topic emoji="📩" title="Propostas — enviando e recebendo">
        <div className="pt-3 space-y-3">
          <Info text="Quando você envia uma proposta, o outro colecionador recebe uma notificação e pode aceitar ou recusar." />
          <Step n={1} text='Após enviar uma proposta, aguarde a resposta em "Propostas → Enviadas".' />
          <Step n={2} text="Se o outro aceitar, vocês recebem o telefone um do outro para combinar a entrega diretamente." />
          <Step n={3} text='Você também pode receber propostas de outros — confira em "Propostas → Recebidas" e aceite ou recuse.' />
          <Step n={4} text="Após realizar a troca, avalie o outro colecionador com estrelas. Só assim a troca entra no seu histórico." />
          <Tip text="Não envie múltiplas propostas para a mesma pessoa. O sistema bloqueia automaticamente até a resposta da anterior." />
        </div>
      </Topic>

      {/* SEGURANÇA NA TROCA */}
      <Topic emoji="🛡️" title="Segurança — como se proteger nas trocas">
        <div className="pt-3 space-y-3">
          <Info text="O Completando conecta colecionadores, mas a troca acontece pessoalmente. Siga estas dicas para se proteger." />
          <Step n={1} text="Combine sempre em local público e movimentado: shopping, praça, lanchonete." />
          <Step n={2} text="Não entregue suas figurinhas antes de receber as do outro — façam a troca simultânea." />
          <Step n={3} text="Nunca forneça endereço residencial para pessoas que não conhece." />
          <Step n={4} text="Em caso de problema ou comportamento suspeito, use o botão de denúncia no perfil do usuário." />
          <Tip text="Verifique a avaliação e o histórico do colecionador antes de aceitar uma proposta de alguém novo." />
        </div>
      </Topic>

      {/* PRO */}
      <Topic emoji="🏆" title="Plano PRO — o que muda">
        <div className="pt-3 space-y-3">
          <Info text="No plano gratuito você cria anúncios e vê os matches, mas não consegue visualizar o contato nem enviar propostas de troca. O PRO libera essas funções." />
          <div className="space-y-1.5 bg-green-50 rounded-xl px-4 py-3">
            {[
              '✅ Visualize o telefone/contato dos matches',
              '✅ Envie propostas de troca ilimitadas',
              '✅ Apareça em mais matches de outros usuários',
              '✅ Histórico completo de trocas confirmadas',
              '✅ Badge PRO no seu perfil',
            ].map(t => (
              <p key={t} className="text-xs text-green-800 font-medium">{t}</p>
            ))}
          </div>
          <Step n={1} text='Acesse "Minha Conta → Visão Geral" e clique em "Assinar PRO".' />
          <Step n={2} text="Escolha o plano mensal (R$ 1,99/mês) ou anual (R$ 14,99/ano — economize 37%)." />
          <Step n={3} text="O pagamento é feito via cartão de crédito ou pix. A ativação é automática após confirmação." />
          <Tip text="O plano anual sai por R$ 1,25/mês — melhor custo-benefício se você vai usar o site com frequência." />
        </div>
      </Topic>

      {/* HISTÓRICO E AVALIAÇÕES */}
      <Topic emoji="⭐" title="Avaliações e histórico">
        <div className="pt-3 space-y-3">
          <Info text="As avaliações constroem sua reputação no site e confirmam que a troca aconteceu de verdade." />
          <Step n={1} text="Após realizar uma troca, o outro colecionador aparece em Propostas → Aceitas com o botão Avaliar." />
          <Step n={2} text="Dê uma nota de 1 a 5 estrelas e opcionalmente escreva um comentário sobre a experiência." />
          <Step n={3} text="Quando AMBOS avaliarem, a troca entra no Histórico como confirmada." />
          <Tip text="Colecionadores com mais avaliações positivas aparecem primeiro nos matches de outros usuários." />
        </div>
      </Topic>

      {/* DÚVIDAS */}
      <Topic emoji="❓" title="Dúvidas frequentes">
        <div className="pt-3 space-y-4">
          {[
            {
              q: 'Meu match sumiu, o que aconteceu?',
              a: 'O match some quando o outro usuário remove o anúncio, completa o álbum ou encontra outra troca. Continue com seus anúncios atualizados para novos matches aparecerem.',
            },
            {
              q: 'Posso trocar com alguém de outra cidade?',
              a: 'Sim! O sistema mostra matches de todo o Brasil. Você pode combinar envio pelos Correios ou encontrar pessoalmente.',
            },
            {
              q: 'O que acontece se eu recusar uma proposta?',
              a: 'A proposta é recusada e some da sua lista. O outro colecionador é notificado e pode enviar uma proposta diferente futuramente.',
            },
            {
              q: 'Perdi o telefone de quem aceitou minha troca. O que faço?',
              a: 'Vá em Propostas → Aceitas e o contato ainda estará disponível lá enquanto a proposta estiver aceita.',
            },
            {
              q: 'Como cancelo o plano PRO?',
              a: 'Acesse o painel do Pagar.me pelo e-mail de confirmação da assinatura ou entre em contato pelo suporte do site.',
            },
          ].map(({ q, a }) => (
            <div key={q}>
              <p className="text-sm font-bold text-slate-800 mb-1">{q}</p>
              <p className="text-sm text-slate-500 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </Topic>
    </div>
  )
}
