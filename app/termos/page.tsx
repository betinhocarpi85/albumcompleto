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
          <h2 className="font-black text-slate-800 text-base mb-2">1. Aceitação dos Termos</h2>
          <p className="text-sm leading-relaxed">Ao criar uma conta no Completando, você concorda integralmente com estes Termos de Uso. Se não concordar com qualquer parte, não utilize a plataforma.</p>
        </section>

        <section>
          <h2 className="font-black text-slate-800 text-base mb-2">2. O que é o Completando</h2>
          <p className="text-sm leading-relaxed">O Completando é uma plataforma de anúncios para troca e venda de figurinhas de álbuns esportivos entre colecionadores. Não somos vendedores — facilitamos a conexão entre usuários para que combinem diretamente.</p>
        </section>

        <section>
          <h2 className="font-black text-slate-800 text-base mb-2">3. Cadastro e Elegibilidade</h2>
          <p className="text-sm leading-relaxed">Para utilizar trocas, vendas e compras, o usuário deve ter <strong>18 anos ou mais</strong> e fornecer informações verdadeiras no cadastro, incluindo CPF e endereço válidos. O uso de identidade falsa resultará em banimento imediato.</p>
        </section>

        <section>
          <h2 className="font-black text-slate-800 text-base mb-2">4. Responsabilidades do Usuário</h2>
          <ul className="text-sm leading-relaxed list-disc pl-4 space-y-1">
            <li>Descrever as figurinhas com precisão (estado de conservação, tipo).</li>
            <li>Enviar os itens acordados dentro do prazo de 3 dias úteis após confirmação.</li>
            <li>Confirmar o recebimento apenas após verificar os itens.</li>
            <li>Não realizar transações fora da plataforma para evitar fraudes.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-black text-slate-800 text-base mb-2">5. Taxas e Pagamentos</h2>
          <p className="text-sm leading-relaxed">O Completando cobra uma <strong>assinatura mensal ou anual</strong> para acesso aos anúncios e ao sistema de matches. O controle do álbum é gratuito. Não intermediamos pagamentos — as transações entre usuários são combinadas diretamente.</p>
        </section>

        <section>
          <h2 className="font-black text-slate-800 text-base mb-2">6. Proteção do Comprador</h2>
          <p className="text-sm leading-relaxed">O valor pago fica retido até que o comprador confirme o recebimento. Caso o item não chegue em até 30 dias ou chegue diferente do anunciado, o comprador pode abrir uma disputa e receber reembolso integral.</p>
        </section>

        <section>
          <h2 className="font-black text-slate-800 text-base mb-2">7. Conteúdo Proibido</h2>
          <p className="text-sm leading-relaxed">É vedado anunciar figurinhas falsificadas, danificadas sem declaração, ou qualquer item não relacionado a álbuns de figurinhas esportivos. Violações resultam em remoção do anúncio e possível banimento.</p>
        </section>

        <section>
          <h2 className="font-black text-slate-800 text-base mb-2">8. Limitação de Responsabilidade</h2>
          <p className="text-sm leading-relaxed">O Completando não se responsabiliza por atrasos dos Correios ou Mercado Envios, por danos às figurinhas causados pelo transporte, ou por disputas entre usuários que não forem reportadas pela plataforma.</p>
        </section>

        <section>
          <h2 className="font-black text-slate-800 text-base mb-2">9. Encerramento de Conta</h2>
          <p className="text-sm leading-relaxed">O usuário pode encerrar sua conta a qualquer momento via configurações. O Completando pode suspender ou encerrar contas que violem estes termos, com ou sem aviso prévio.</p>
        </section>

        <section>
          <h2 className="font-black text-slate-800 text-base mb-2">10. Alterações</h2>
          <p className="text-sm leading-relaxed">Estes termos podem ser atualizados. Notificaremos usuários ativos por e-mail com 15 dias de antecedência. O uso continuado da plataforma após a vigência implica aceitação.</p>
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
