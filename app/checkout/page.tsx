'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCarrinho, clearCarrinho, addPedido, type CarrinhoItem } from '@/lib/store'

type Etapa = 'resumo' | 'pagamento' | 'confirmacao'
type MetodoPag = 'pix' | 'cartao'

function CheckoutInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [etapa, setEtapa]       = useState<Etapa>('resumo')
  const [metodo, setMetodo]     = useState<MetodoPag>('pix')
  const [itens, setItens]       = useState<CarrinhoItem[]>([])
  const [pedidoId, setPedidoId] = useState('')
  const [pixCopiado, setPixCopiado] = useState(false)

  useEffect(() => {
    setItens(getCarrinho())
  }, [])

  const totalItens = itens.reduce((s, v) => s + v.stickers.length, 0)
  const totalValor = itens.reduce((s, v) => s + v.stickers.reduce((sv, st) => sv + st.preco, 0), 0)
  const frete      = totalItens > 0 ? (totalItens <= 5 ? 8.90 : 14.90) : 0
  const totalFinal = totalValor + frete

  const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  function confirmarPedido() {
    const id = 'PED-' + Date.now().toString(36).toUpperCase()
    setPedidoId(id)
    // Salva no histórico
    for (const v of itens) {
      addPedido({
        id:          id + '-' + v.vendaId,
        data:        new Date().toLocaleDateString('pt-BR'),
        tipo:        'venda',
        status:      'pendente',
        contraparte: v.vendedor,
        fig:         `${v.stickers.length} figurinha${v.stickers.length !== 1 ? 's' : ''}`,
        valor:       v.stickers.reduce((s, st) => s + st.preco, 0),
      })
    }
    clearCarrinho()
    setEtapa('confirmacao')
  }

  function copiarPix() {
    navigator.clipboard.writeText('00020126360014BR.GOV.BCB.PIX0114+5511999999999520400005303986540' + totalFinal.toFixed(2) + '5802BR5915AlbumCompleto6009SaoPaulo62070503***6304ABCD').catch(() => {})
    setPixCopiado(true)
    setTimeout(() => setPixCopiado(false), 3000)
  }

  if (itens.length === 0 && etapa !== 'confirmacao') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center animate-fadein">
        <p className="text-5xl mb-4">🛒</p>
        <p className="font-black text-slate-800 text-lg mb-2">Carrinho vazio</p>
        <p className="text-sm text-slate-400 mb-6">Adicione figurinhas na aba Vendas do Matches.</p>
        <Link href="/matches" className="inline-block bg-green-600 text-white font-bold px-6 py-3 rounded-xl text-sm">
          ← Ver vendedores
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-3 py-4 animate-fadein">

      {/* Header / steps */}
      {etapa !== 'confirmacao' && (
        <div className="flex items-center gap-2 mb-5">
          {(['resumo', 'pagamento'] as Etapa[]).map((e, i) => (
            <div key={e} className="flex items-center gap-2">
              <div className={[
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-black',
                etapa === e ? 'bg-green-600 text-white' :
                (etapa === 'pagamento' && i === 0) ? 'bg-green-200 text-green-700' :
                'bg-slate-100 text-slate-400',
              ].join(' ')}>
                {(etapa === 'pagamento' && i === 0) ? '✓' : i + 1}
              </div>
              <span className={`text-xs font-semibold ${etapa === e ? 'text-slate-800' : 'text-slate-400'}`}>
                {e === 'resumo' ? 'Resumo' : 'Pagamento'}
              </span>
              {i === 0 && <div className="w-8 h-px bg-slate-200" />}
            </div>
          ))}
        </div>
      )}

      {/* ── ETAPA 1: Resumo ── */}
      {etapa === 'resumo' && (
        <div className="animate-fadein space-y-3">
          <h1 className="font-black text-slate-800 text-lg mb-3">Resumo do pedido</h1>

          {itens.map(v => (
            <div key={v.vendaId} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Vendedor */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-50">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${v.avatarColor} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-xs font-black">{v.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-800">{v.vendedor}</p>
                  <p className="text-xs text-slate-400">{v.cidade} · ⭐ {v.rating}</p>
                </div>
                <span className="text-xs text-slate-400">{v.stickers.length} fig.</span>
              </div>

              {/* Itens */}
              <div className="divide-y divide-slate-50">
                {v.stickers.map(s => (
                  <div key={s.num} className="flex items-center px-4 py-2.5 gap-3">
                    <div className="w-8 h-8 rounded-lg border-2 border-slate-200 bg-slate-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-black">{s.num}</span>
                    </div>
                    <p className="flex-1 text-sm text-slate-700 truncate">{s.nome}</p>
                    <p className="text-sm font-bold text-green-600">{fmtBRL(s.preco)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Totais */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal ({totalItens} figurinha{totalItens !== 1 ? 's' : ''})</span>
              <span>{fmtBRL(totalValor)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>Frete estimado</span>
              <span>{fmtBRL(frete)}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-800 pt-2 border-t border-slate-100">
              <span>Total</span>
              <span className="text-green-600">{fmtBRL(totalFinal)}</span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-700">
            💡 O pagamento é protegido pela plataforma. Os valores só são liberados ao vendedor após confirmação do recebimento.
          </div>

          <button
            onClick={() => setEtapa('pagamento')}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-2xl text-sm transition-colors"
          >
            Escolher forma de pagamento →
          </button>
          <Link href="/matches" className="block text-center text-sm text-slate-400 hover:text-slate-600 py-2">
            ← Voltar ao carrinho
          </Link>
        </div>
      )}

      {/* ── ETAPA 2: Pagamento ── */}
      {etapa === 'pagamento' && (
        <div className="animate-fadein space-y-3">
          <h1 className="font-black text-slate-800 text-lg mb-3">Forma de pagamento</h1>

          {/* Seleção método */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'pix' as const, icon: '⚡', label: 'PIX', desc: 'Aprovação imediata' },
              { key: 'cartao' as const, icon: '💳', label: 'Cartão', desc: 'Crédito ou débito' },
            ].map(m => (
              <button
                key={m.key}
                onClick={() => setMetodo(m.key)}
                className={[
                  'p-4 rounded-2xl border-2 text-left transition-all',
                  metodo === m.key
                    ? 'border-green-500 bg-green-50'
                    : 'border-slate-200 bg-white hover:border-slate-300',
                ].join(' ')}
              >
                <span className="text-2xl block mb-1">{m.icon}</span>
                <p className="font-bold text-sm text-slate-800">{m.label}</p>
                <p className="text-[11px] text-slate-400">{m.desc}</p>
              </button>
            ))}
          </div>

          {/* PIX */}
          {metodo === 'pix' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center animate-fadein">
              {/* QR Code mock */}
              <div className="w-44 h-44 mx-auto bg-slate-100 rounded-xl flex items-center justify-center mb-3 border-2 border-slate-200">
                <div className="grid grid-cols-5 gap-0.5 p-2 w-full h-full">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div
                      key={i}
                      className={[
                        'rounded-sm',
                        [0,1,2,5,6,7,10,12,14,17,18,19,20,21,22,23,24,3,4,8,9,11,13,15,16][i] % 3 === 0
                          ? 'bg-slate-800' : 'bg-white',
                      ].join(' ')}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-1">Valor a pagar</p>
              <p className="text-2xl font-black text-green-600 mb-3">{fmtBRL(totalFinal)}</p>
              <p className="text-xs text-slate-400 mb-3">Escaneie o QR Code com o app do seu banco ou copie a chave abaixo</p>
              <button
                onClick={copiarPix}
                className={[
                  'w-full py-3 rounded-xl text-sm font-bold border-2 transition-all',
                  pixCopiado
                    ? 'bg-green-50 border-green-500 text-green-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300',
                ].join(' ')}
              >
                {pixCopiado ? '✓ Chave copiada!' : '📋 Copiar chave PIX'}
              </button>
            </div>
          )}

          {/* Cartão */}
          {metodo === 'cartao' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-fadein space-y-3">
              <p className="font-bold text-sm text-slate-700 mb-1">Dados do cartão</p>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Número do cartão</label>
                <input
                  type="text" placeholder="0000 0000 0000 0000" maxLength={19}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Nome no cartão</label>
                <input
                  type="text" placeholder="COMO ESTÁ NO CARTÃO"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Validade</label>
                  <input
                    type="text" placeholder="MM/AA" maxLength={5}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">CVV</label>
                  <input
                    type="text" placeholder="123" maxLength={4}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Parcelamento</label>
                <select className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white">
                  <option>1× de {fmtBRL(totalFinal)} (sem juros)</option>
                  <option>2× de {fmtBRL(totalFinal / 2)} (sem juros)</option>
                  <option>3× de {fmtBRL(totalFinal / 3)} (sem juros)</option>
                </select>
              </div>
              <p className="text-[10px] text-slate-400 text-center">🔒 Dados criptografados. Não armazenamos seu cartão.</p>
            </div>
          )}

          {/* Endereço de entrega */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-sm text-slate-800">Endereço de entrega</p>
              <button className="text-xs text-green-600 font-semibold">Alterar</button>
            </div>
            <p className="text-sm text-slate-600">Rua das Flores, 123 · Apto 45</p>
            <p className="text-xs text-slate-400 mb-3">São Paulo, SP · 01234-567</p>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Ponto de referência <span className="text-slate-400 font-normal">(opcional)</span></label>
              <input
                type="text"
                placeholder="Ex: Próximo ao mercado, portão azul..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
          </div>

          {/* Total */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-400">Total a pagar</p>
              <p className="text-xl font-black text-green-600">{fmtBRL(totalFinal)}</p>
            </div>
            <button
              onClick={confirmarPedido}
              className="bg-green-600 hover:bg-green-700 text-white font-black px-6 py-3.5 rounded-xl text-sm transition-colors"
            >
              {metodo === 'pix' ? '✓ Já paguei' : '💳 Confirmar'}
            </button>
          </div>

          <button
            onClick={() => setEtapa('resumo')}
            className="w-full text-center text-sm text-slate-400 hover:text-slate-600 py-2"
          >
            ← Voltar ao resumo
          </button>
        </div>
      )}

      {/* ── ETAPA 3: Confirmação ── */}
      {etapa === 'confirmacao' && (
        <div className="animate-fadein text-center py-8">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="font-black text-slate-800 text-2xl mb-2">Pedido confirmado!</h1>
          <p className="text-slate-500 text-sm mb-1">Código do pedido</p>
          <p className="font-black text-green-600 text-lg mb-4">{pedidoId}</p>
          <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
            Os vendedores serão notificados e têm até 3 dias úteis para enviar suas figurinhas. Você receberá atualizações pelo app.
          </p>

          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 text-left">
            <p className="font-bold text-green-800 text-sm mb-2">O que acontece agora?</p>
            <div className="space-y-2">
              {[
                { icon: '📩', text: 'Vendedores recebem notificação do pedido' },
                { icon: '📦', text: 'Eles embalagem e enviam em até 3 dias úteis' },
                { icon: '🚚', text: 'Você acompanha o rastreio aqui no app' },
                { icon: '⭐', text: 'Após receber, avalie a transação' },
              ].map(s => (
                <div key={s.icon} className="flex items-center gap-2">
                  <span className="text-base">{s.icon}</span>
                  <span className="text-xs text-green-700">{s.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Link
              href="/conta?s=historico"
              className="block w-full bg-green-600 hover:bg-green-700 text-white font-black py-3.5 rounded-xl text-sm transition-colors"
            >
              📦 Ver meu histórico
            </Link>
            <Link
              href="/matches"
              className="block w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              🔁 Continuar buscando figurinhas
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutInner />
    </Suspense>
  )
}
