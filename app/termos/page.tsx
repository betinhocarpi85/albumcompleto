import Link from 'next/link'

export default function TermosPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-6">
        <Link href="/" className="text-sm text-slate-400 hover:text-slate-600">← Voltar</Link>
      </div>

      <h1 className="font-black text-slate-800 text-2xl mb-1">Termos de Uso</h1>
      <p className="text-xs text-slate-400 mb-8">Última atualização: maio de 2026 · completando.com.br</p>

      <div className="prose prose-sm prose-slate max-w-none space-y-6 text-slate-700">

        <section>
          <h2 className="font-black text-slate-800 text-base mb-2">1. O que é o Completando</h2>
          <p className="text-sm leading-relaxed">O Completando é uma plataforma de anúncios para troca e venda de figurinhas de álbuns esportivos entre colecionadores. Somos um serviço de conexão — não participamos das negociações, não intermediamos pagamentos e não nos responsabilizamos pela entrega dos itens. Toda combinação é feita diretamente entre os usuários.</p>
        </section>

        <section>
          <h2 className="font-black text-slate-800 text-base mb-2">2. Aceitação dos Termos</h2>
          <p className="text-sm leading-relaxed">Ao criar uma conta no Completando, você concorda integralmente com estes Termos de Uso e com a nossa Política de Privacidade. Se não concordar com qualquer parte, não utilize a plataforma.</p>
        </section>

        <section>
          <h2 className="font-black text-slate-800 text-base mb-2">3. Cadastro e Elegibilidade</h2>
          <p className="text-sm leading-relaxed">Para utilizar as funcionalidades de anúncio de trocas e vendas, o usuário deve ter <strong>18 anos ou mais</strong> e fornecer informações verdadeiras no cadastro. O controle do álbum (marcar figurinhas como coladas) é gratuito e disponível a todos os usuários cadastrados.</p>
        </section>

        <section>
          <h2 className="font-black text-slate-800 text-base mb-2">4. Planos e Assinatura</h2>
          <ul className="text-sm leading-relaxed list-disc pl-4 space-y-1">
            <li><strong>Grátis:</strong> controle completo do álbum (marcar figurinhas coladas).</li>
            <li><strong>PRO (mensal ou anual):</strong> anunciar figurinhas para troca e venda, receber matches com outros colecionadores e ter o contato revelado após aceitação mútua.</li>
          </ul>
          <p className="text-sm leading-relaxed mt-2">O Completando não intermedia pagamentos entre usuários — toda transação financeira é acordada e realizada diretamente entre as partes.</p>
        </section>

        <section>
          <h2 className="font-black text-slate-800 text-base mb-2">5. Como Funciona o Match e o Contato</h2>
          <p className="text-sm leading-relaxed">Quando dois usuários têm figurinhas de interesse mútuo, o sistema gera um match. Um usuário envia uma proposta de troca ou interesse de compra. Se <strong>ambos aceitarem</strong>, cada um recebe o número de WhatsApp/telefone do outro para combinar local, data e horário diretamente. O contato só é revelado após aceitação mútua.</p>
        </section>

        <section>
          <h2 className="font-black text-slate-800 text-base mb-2">6. Responsabilidades do Usuário</h2>
          <ul className="text-sm leading-relaxed list-disc pl-4 space-y-1">
            <li>Anunciar figurinhas com informações precisas (estado de conservação, tipo).</li>
            <li>Honrar as combinações feitas com outros usuários após a aceitação.</li>
            <li>Não utilizar os dados de contato recebidos para fins diferentes da troca ou venda acordada.</li>
            <li>Não criar múltiplas contas ou fornecer informações falsas.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-black text-slate-800 text-base mb-2">7. Limitação de Responsabilidade</h2>
          <p className="text-sm leading-relaxed">O Completando não se responsabiliza por: atrasos ou extravios no envio de figurinhas, desentendimentos entre usuários, acordos não cumpridos ou quaisquer danos decorrentes das negociações diretas entre as partes. Somos uma plataforma de conexão, não uma parte das transações.</p>
        </section>

        <section>
          <h2 className="font-black text-slate-800 text-base mb-2">8. Conteúdo Proibido</h2>
          <p className="text-sm leading-relaxed">É vedado anunciar figurinhas falsificadas, danificadas sem declaração, ou qualquer item não relacionado a álbuns de figurinhas esportivos. Violações resultam em remoção do anúncio e possível suspensão da conta.</p>
        </section>

        <section>
          <h2 className="font-black text-slate-800 text-base mb-2">9. Encerramento de Conta</h2>
          <p className="text-sm leading-relaxed">O usuário pode encerrar sua conta a qualquer momento em Minha Conta → Configurações. O Completando pode suspender ou encerrar contas que violem estes termos, sem aviso prévio em casos graves.</p>
        </section>

        <section>
          <h2 className="font-black text-slate-800 text-base mb-2">10. Alterações nos Termos</h2>
          <p className="text-sm leading-relaxed">Estes termos podem ser atualizados. Usuários ativos serão notificados por e-mail com pelo menos 15 dias de antecedência. O uso continuado da plataforma após a vigência das alterações implica aceitação.</p>
        </section>

        <section>
          <h2 className="font-black text-slate-800 text-base mb-2">11. Contato</h2>
          <p className="text-sm leading-relaxed">Dúvidas ou reclamações: <a href="mailto:legal@completando.com.br" className="text-green-600 font-semibold">legal@completando.com.br</a></p>
        </section>

      </div>

      <div className="mt-10 pt-6 border-t border-slate-100 text-center">
        <Link href="/privacidade" className="text-sm text-green-600 font-semibold">
          Ler também: Política de Privacidade →
        </Link>
      </div>
    </div>
  )
}
