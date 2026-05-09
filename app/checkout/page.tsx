'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getCarrinho, clearCarrinho, addPedido, type CarrinhoItem } from '@/lib/store'
import { getSession, dbGetProfile } from '@/lib/db'
import BannerMenorDeIdade from '@/components/BannerMenorDeIdade'

type Etapa = 'resumo' | 'redirecionando' | 'confirmacao'

interface FreteInfo {
  valor:   number
  prazo:   string
  servico: string
}

/** Simulação Correios — Carta Registrada Nacional (tabela 2026 aprox.) */
function calcularFreteCarta(cep: string, totalItens: number): FreteInfo {
  const prefix = parseInt(cep.slice(0, 2), 10)
  const pesoG  = totalItens * 3 + 20   // ~3 g/figurinha + 20 g envelope

  // faixa de peso → preço base
  const base =
    pesoG <= 20  ? 9.30  :
    pesoG <= 50  ? 11.80 :
    pesoG <= 100 ? 14.60 :
                   18.20

  // faixa de CEP → prazo + acréscimo regional
  let prazo = '5 dias úteis'
  let extra = 0
  if      (prefix <=  9) { prazo = '2 dias úteis'; extra = 0.00 }
  else if (prefix <= 19) { prazo = '3 dias úteis'; extra = 0.00 }
  else if (prefix <= 39) { prazo = '5 dias úteis'; extra = 1.50 }
  else if (prefix <= 69) { prazo = '7 dias úteis'; extra = 3.00 }
  else if (prefix <= 79) { prazo = '6 dias úteis'; extra = 2.50 }
  else                   { prazo = '4 dias úteis'; extra = 1.00 }

  return {
    valor:   parseFloat((base + extra).toFixed(2)),
    prazo,
    servico: 'Carta Registrada',
  }
}

function LogoMercadoPago() {
  return (
    <div className="flex items-center gap-2">
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="16" fill="#009EE3"/>
        <path d="M8 16.5c0-4.142 3.358-7.5 7.5-7.5s7.5 3.358 7.5 7.5" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="16" cy="19" r="2.5" fill="white"/>
      </svg>
      <span className="font-black text-[15px] text-slate-800">Mercado Pago</span>
    </div>
  )
}

function LogoCorreios() {
  return (
    <div className="flex items-center gap-1.5">
      {/* envelope estilizado */}
      <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="5" fill="#F7B300"/>
        <rect x="5" y="10" width="22" height="14" rx="2" fill="white"/>
        <path d="M5 13l11 7.5L27 13" stroke="#F7B300" strokeWidth="2.2" strokeLinecap="round"/>
      </svg>
      <span className="font-bold text-xs text-slate-700">Correios</span>
    </div>
  )
}

function CepInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 8)
    const fmt    = digits.length > 5 ? digits.slice(0, 5) + '-' + digits.slice(5) : digits
    onChange(fmt)
  }
  return (
    <input
      type="text"
      inputMode="numeric"
      placeholder="00000-000"
      value={value}
      onChange={handleChange}
      maxLength={9}
      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition"
    />
  )
}

function CheckoutInner() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const [etapa, setEtapa]                     = useState<Etapa>('resumo')
  const [itens, setItens]                     = useState<CarrinhoItem[]>([])
  const [pedidoId, setPedidoId]               = useState('')
  const [cep, setCep]                         = useState('')   // preenchido via useEffect abaixo
  const [adulto, setAdulto]                   = useState(true)
  const [freteInfo, setFreteInfo]             = useState<FreteInfo | null>(null)
  const [calculandoFrete, setCalculandoFrete] = useState(false)
  const [enderecoEntrega, setEnderecoEntrega] = useState('')

  useEffect(() => {
    getSession().then(session => {
      if (!session) { router.replace('/entrar'); return }
      const status = searchParams.get('status')
      if (status === 'approved') {
        setEtapa('confirmacao')
        setPedidoId(searchParams.get('payment_id') ?? 'MP-' + Date.now().toString(36).toUpperCase())
        return
      }
      setItens(getCarrinho())
      dbGetProfile().then(p => {
        if (p.cep) setCep(p.cep)
        if (p.logradouro && p.cidade) {
          const parts = [
            [p.logradouro, p.numero].filter(Boolean).join(', '),
            p.complemento,
            [p.cidade, p.uf].filter(Boolean).join('/'),
            p.cep ? `CEP ${p.cep}` : '',
          ].filter(Boolean)
          setEnderecoEntrega(parts.join(' · '))
        }
        setAdulto(!!p.maior18)
      })
    })
  }, [searchParams, router])

  const totalItens = itens.reduce((s, v) => s + v.stickers.length, 0)
  const totalValor = itens.reduce((s, v) => s + v.stickers.reduce((sv, st) => sv + st.preco, 0), 0)
  const taxa       = parseFloat((totalValor * 0.10).toFixed(2))
  const frete      = freteInfo?.valor ?? 0
  const totalFinal = parseFloat((totalValor + frete + taxa).toFixed(2))

  const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  // Auto-calcula frete ao preencher CEP
  useEffect(() => {
    const digits = cep.replace(/\D/g, '')
    if (digits.length !== 8) {
      queueMicrotask(() => setFreteInfo(null))
      return
    }
    queueMicrotask(() => setCalculandoFrete(true))
    const t = setTimeout(() => {
      setFreteInfo(calcularFreteCarta(digits, totalItens))
      setCalculandoFrete(false)
    }, 900)
    return () => clearTimeout(t)
  }, [cep, totalItens])

  function irParaMercadoPago() {
    setEtapa('redirecionando')
    const id = 'MP-' + Date.now().toString(36).toUpperCase()
    setTimeout(() => {
      for (const v of itens) {
        addPedido({
          id:               id + '-' + v.vendaId,
          data:             new Date().toLocaleDateString('pt-BR'),
          tipo:             'venda',
          status:           'pendente',
          contraparte:      v.vendedor,
          fig:              `${v.stickers.length} figurinha${v.stickers.length !== 1 ? 's' : ''}`,
          valor:            v.stickers.reduce((s, st) => s + st.preco, 0),
          enderecoEntrega:  enderecoEntrega || undefined,
        })
      }
      clearCarrinho()
      setPedidoId(id)
      setEtapa('confirmacao')
    }, 1800)
  }

  if (itens.length === 0 && etapa === 'resumo') {
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

  const podeComprar = freteInfo !== null && adulto

  return (
    <div className="max-w-lg mx-auto px-3 py-4 animate-fadein">

      {/* ── RESUMO ── */}
      {etapa === 'resumo' && (
        <div className="animate-fadein space-y-3">

          <BannerMenorDeIdade />

          <div className="flex items-center gap-3 mb-1">
            <Link href="/conta?s=carrinho" className="text-slate-400 hover:text-slate-600 text-sm">‹</Link>
            <h1 className="font-black text-slate-800 text-lg">Resumo do pedido</h1>
          </div>

          {/* Itens por vendedor */}
          {itens.map(v => (
            <div key={v.vendaId} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-50">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${v.avatarColor} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-xs font-black">{v.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-800">{v.vendedor}</p>
                  <p className="text-xs text-slate-400">{v.cidade} · ⭐ {v.rating}</p>
                </div>
                <span className="text-xs text-slate-400 flex-shrink-0">{v.stickers.length} fig.</span>
              </div>
              <div className="divide-y divide-slate-50">
                {v.stickers.map(s => (
                  <div key={s.num} className="flex items-center px-4 py-2.5 gap-3">
                    <div className={[
                      'w-8 h-8 rounded-lg border-2 flex items-center justify-center flex-shrink-0 text-[10px] font-black',
                      s.tipo === 'brilhante' ? 'bg-amber-50 border-amber-300 text-amber-700'
                      : s.tipo === 'escudo'  ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                      : 'bg-slate-50 border-slate-200 text-slate-600',
                    ].join(' ')}>
                      {s.num}
                    </div>
                    <p className="flex-1 text-sm text-slate-700 truncate">#{s.num} · {s.nome}</p>
                    <p className="text-sm font-bold text-green-600 flex-shrink-0">{fmtBRL(s.preco)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Frete — CEP */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-slate-700">Calcular frete</p>
              <LogoCorreios />
            </div>
            <CepInput value={cep} onChange={setCep} />

            {calculandoFrete && (
              <div className="flex items-center gap-2 mt-2.5">
                <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin flex-shrink-0" />
                <span className="text-xs text-slate-500">Consultando Correios…</span>
              </div>
            )}

            {freteInfo && !calculandoFrete && (
              <div className="mt-2.5 flex items-center justify-between bg-green-50 border border-green-100 rounded-xl px-3 py-2.5">
                <div>
                  <p className="text-xs font-bold text-green-800">{freteInfo.servico}</p>
                  <p className="text-[11px] text-green-600">Entrega em até {freteInfo.prazo}</p>
                </div>
                <span className="text-sm font-black text-green-700">{fmtBRL(freteInfo.valor)}</span>
              </div>
            )}

            {!freteInfo && !calculandoFrete && (
              <p className="text-[11px] text-slate-400 mt-1.5">
                Informe seu CEP para calcular o frete via Correios (Carta Registrada).
              </p>
            )}
          </div>

          {/* Totais */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal ({totalItens} figurinha{totalItens !== 1 ? 's' : ''})</span>
              <span>{fmtBRL(totalValor)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>
                Frete · Carta Registrada
                <span className="text-xs text-slate-400 ml-1">(por conta do comprador)</span>
              </span>
              <span>
                {freteInfo
                  ? fmtBRL(freteInfo.valor)
                  : <span className="text-slate-300 text-xs">— informe o CEP</span>}
              </span>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>
                Taxa de serviço
                <span className="text-xs text-slate-400 ml-1">(10%)</span>
              </span>
              <span>{fmtBRL(taxa)}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-800 pt-2 border-t border-slate-100">
              <span>Total</span>
              <span className={freteInfo ? 'text-green-600' : 'text-slate-300 text-xs font-semibold'}>
                {freteInfo ? fmtBRL(totalFinal) : 'aguardando CEP'}
              </span>
            </div>
          </div>

          {/* Info segurança */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-start gap-2">
            <span className="text-base flex-shrink-0">🔒</span>
            <p className="text-xs text-blue-700">
              Pagamento protegido — o valor fica retido até você confirmar o recebimento. O vendedor só recebe depois da sua aprovação.
            </p>
          </div>

          {/* Botão Mercado Pago */}
          <button
            onClick={irParaMercadoPago}
            disabled={!podeComprar}
            className={[
              'w-full flex items-center justify-center gap-3 text-white font-black py-4 rounded-2xl text-sm transition-colors shadow-lg',
              podeComprar
                ? 'bg-[#009EE3] hover:bg-[#0088cc] shadow-blue-500/20 cursor-pointer'
                : 'bg-slate-300 cursor-not-allowed shadow-none',
            ].join(' ')}
          >
            {!adulto
              ? '🔒 Compras disponíveis apenas para maiores de 18'
              : podeComprar
                ? (<><svg width="22" height="22" viewBox="0 0 32 32" fill="none">
                    <circle cx="16" cy="16" r="16" fill="white" fillOpacity="0.25"/>
                    <path d="M8 16.5c0-4.142 3.358-7.5 7.5-7.5s7.5 3.358 7.5 7.5" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                    <circle cx="16" cy="19" r="2.5" fill="white"/>
                  </svg>Pagar com Mercado Pago · {fmtBRL(totalFinal)}</>)
                : '📮 Informe o CEP para continuar'
            }
          </button>

          <p className="text-center text-[11px] text-slate-400">
            Você será redirecionado para o ambiente seguro do Mercado Pago.
            PIX, cartão, boleto e mais — tudo disponível lá.
          </p>
        </div>
      )}

      {/* ── REDIRECIONANDO ── */}
      {etapa === 'redirecionando' && (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 animate-fadein">
          <LogoMercadoPago />
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-[#009EE3]/20 border-t-[#009EE3] rounded-full animate-spin" />
            <p className="font-semibold text-slate-700 text-sm">Redirecionando para o Mercado Pago…</p>
            <p className="text-xs text-slate-400 text-center max-w-xs">
              Não feche esta janela. Você voltará automaticamente após o pagamento.
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-center">
            <p className="text-xs text-slate-500 mb-0.5">Valor a pagar</p>
            <p className="text-2xl font-black text-[#009EE3]">{fmtBRL(totalFinal)}</p>
          </div>
        </div>
      )}

      {/* ── CONFIRMAÇÃO (retorno do MP) ── */}
      {etapa === 'confirmacao' && (
        <div className="animate-fadein text-center py-8">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">✅</span>
          </div>
          <h1 className="font-black text-slate-800 text-2xl mb-1">Pagamento aprovado!</h1>
          <p className="text-slate-500 text-sm mb-4">pelo Mercado Pago</p>

          <div className="bg-white border border-slate-100 rounded-2xl p-4 mb-5 text-left shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <LogoMercadoPago />
              <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-1 rounded-full">Aprovado</span>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Código do pedido</span>
                <span className="font-black text-slate-800">{pedidoId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Valor pago</span>
                <span className="font-bold text-green-600">{fmtBRL(totalFinal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Data</span>
                <span className="text-slate-700">{new Date().toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 text-left">
            <p className="font-bold text-green-800 text-sm mb-2">O que acontece agora?</p>
            <div className="space-y-2">
              {[
                { icon: '📩', text: 'Vendedores recebem notificação do pedido' },
                { icon: '📦', text: 'Têm até 3 dias úteis para embalar e enviar' },
                { icon: '🚚', text: 'Você acompanha o rastreio aqui no app' },
                { icon: '✅', text: 'Confirme o recebimento para liberar o pagamento' },
                { icon: '⭐', text: 'Avalie a transação e ganhe pontos' },
              ].map(s => (
                <div key={s.icon} className="flex items-center gap-2">
                  <span className="text-base flex-shrink-0">{s.icon}</span>
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
