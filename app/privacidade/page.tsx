import Link from 'next/link'

export default function PrivacidadePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-6">
        <Link href="/" className="text-sm text-slate-400 hover:text-slate-600">← Voltar</Link>
      </div>

      <h1 className="font-black text-slate-800 text-2xl mb-1">Política de Privacidade</h1>
      <p className="text-xs text-slate-400 mb-8">Última atualização: maio de 2026 · completando.com.br</p>

      <div className="space-y-6 text-slate-700">

        <section>
          <h2 className="font-black text-slate-800 text-base mb-2">1. Dados que Coletamos</h2>
          <ul className="text-sm leading-relaxed list-disc pl-4 space-y-1">
            <li><strong>Cadastro:</strong> nome completo, e-mail, número de WhatsApp/telefone e CEP.</li>
            <li><strong>Uso da plataforma:</strong> figurinhas marcadas no álbum, anúncios publicados, histórico de propostas de troca e venda.</li>
            <li><strong>Técnicos:</strong> IP de acesso, tipo de dispositivo e horários de login (logs de segurança).</li>
          </ul>
        </section>

        <section>
          <h2 className="font-black text-slate-800 text-base mb-2">2. Como Usamos os Dados</h2>
          <ul className="text-sm leading-relaxed list-disc pl-4 space-y-1">
            <li>Gerar matches entre colecionadores com figurinhas de interesse mútuo (usamos o CEP para priorizar matches próximos).</li>
            <li>Revelar o WhatsApp/telefone de cada parte somente após aceitação mútua de uma proposta.</li>
            <li>Comunicar sobre matches, propostas e atualizações da plataforma.</li>
            <li>Garantir a segurança das contas e prevenir fraudes.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-black text-slate-800 text-base mb-2">3. O que Nunca Fazemos</h2>
          <ul className="text-sm leading-relaxed list-disc pl-4 space-y-1">
            <li>Não vendemos seus dados a terceiros.</li>
            <li>Não exibimos seu telefone ou endereço a outros usuários sem sua autorização (que se dá ao aceitar uma proposta).</li>
            <li>Não enviamos spam ou comunicações não solicitadas.</li>
            <li>Não intermediamos pagamentos — não coletamos dados de cartão ou conta bancária.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-black text-slate-800 text-base mb-2">4. Compartilhamento de Dados</h2>
          <p className="text-sm leading-relaxed">Seus dados são compartilhados apenas em duas situações:</p>
          <ul className="text-sm leading-relaxed list-disc pl-4 space-y-1 mt-2">
            <li><strong>Com o outro usuário:</strong> seu WhatsApp/telefone é revelado somente quando ambos aceitarem uma proposta de troca ou venda.</li>
            <li><strong>Com autoridades:</strong> quando exigido por lei ou ordem judicial.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-black text-slate-800 text-base mb-2">5. Armazenamento e Segurança</h2>
          <p className="text-sm leading-relaxed">Seus dados são armazenados na plataforma Supabase com criptografia em repouso e em trânsito (TLS). O acesso é restrito por autenticação e o telefone só é acessível via função segura do banco de dados, acionada exclusivamente após aceitação mútua de proposta.</p>
        </section>

        <section>
          <h2 className="font-black text-slate-800 text-base mb-2">6. Cookies</h2>
          <p className="text-sm leading-relaxed">Usamos cookies essenciais apenas para manter sua sessão ativa e autenticada. Não utilizamos cookies de rastreamento publicitário.</p>
        </section>

        <section>
          <h2 className="font-black text-slate-800 text-base mb-2">7. Seus Direitos (LGPD)</h2>
          <p className="text-sm leading-relaxed">Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:</p>
          <ul className="text-sm leading-relaxed list-disc pl-4 space-y-1 mt-2">
            <li>Acessar os dados que temos sobre você.</li>
            <li>Corrigir dados incompletos ou incorretos.</li>
            <li>Solicitar a exclusão da sua conta e dados associados.</li>
            <li>Revogar consentimentos concedidos.</li>
            <li>Portabilidade dos dados em formato estruturado.</li>
          </ul>
          <p className="text-sm leading-relaxed mt-2">Para exercer seus direitos: <a href="mailto:privacidade@completando.com.br" className="text-green-600 font-semibold">privacidade@completando.com.br</a></p>
        </section>

        <section>
          <h2 className="font-black text-slate-800 text-base mb-2">8. Retenção de Dados</h2>
          <p className="text-sm leading-relaxed">Mantemos seus dados enquanto sua conta estiver ativa. Após o encerramento, os dados são removidos em até 90 dias, salvo quando a retenção for exigida por lei.</p>
        </section>

        <section>
          <h2 className="font-black text-slate-800 text-base mb-2">9. Menores de Idade</h2>
          <p className="text-sm leading-relaxed">As funcionalidades de anúncio, match e contato são restritas a maiores de 18 anos. O controle do álbum é livre para todos. Não coletamos dados de menores de 13 anos intencionalmente.</p>
        </section>

        <section>
          <h2 className="font-black text-slate-800 text-base mb-2">10. Contato e DPO</h2>
          <p className="text-sm leading-relaxed">
            Encarregado de Proteção de Dados:<br />
            <a href="mailto:privacidade@completando.com.br" className="text-green-600 font-semibold">privacidade@completando.com.br</a>
          </p>
        </section>

      </div>

      <div className="mt-10 pt-6 border-t border-slate-100 text-center">
        <Link href="/termos" className="text-sm text-green-600 font-semibold">
          Ler também: Termos de Uso →
        </Link>
      </div>
    </div>
  )
}
