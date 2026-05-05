'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { albumCopa2026 } from '@/data/album-copa-2026'
import StickerSquare from '@/components/StickerSquare'

const allStickers = albumCopa2026.categories.flatMap(c => c.stickers)

const MEU_PRECISO = [19, 21, 28, 40, 42, 53, 65, 76, 78, 88, 90, 101]
const MEU_TENHO   = [17, 22, 29, 33, 45, 67, 89]

function pronome(gender: 'M' | 'F') {
  return {
    ele:  gender === 'F' ? 'Ela'  : 'Ele',
    dele: gender === 'F' ? 'dela' : 'dele',
  }
}

const MATCHES = [
  { id: '1', user: { name: 'Ana Lima',  city: 'Rio de Janeiro, RJ', avatar: 'AL', avatarColor: 'from-pink-400 to-purple-500', rating: 4.9, trades: 142, gender: 'F' as const }, type: 'parcial' as const, temParaMim: [28, 42, 53], euTenhoPara: [17, 29], balance: -1 },
  { id: '2', user: { name: 'Pedro S.',  city: 'Curitiba, PR',        avatar: 'PS', avatarColor: 'from-orange-400 to-red-500',  rating: 4.6, trades: 57,  gender: 'M' as const }, type: 'parcial' as const, temParaMim: [19, 65],    euTenhoPara: [22, 45, 67], balance: 1 },
  { id: '3', user: { name: 'Julia F.',  city: 'Belo Horizonte, MG',  avatar: 'JF', avatarColor: 'from-teal-400 to-green-500', rating: 5.0, trades: 203, gender: 'F' as const }, type: 'exato'  as const, temParaMim: [40, 76, 78], euTenhoPara: [33, 89, 22], balance: 0 },
  { id: '4', user: { name: 'Carlos M.', city: 'São Paulo, SP',        avatar: 'CM', avatarColor: 'from-green-400 to-blue-500', rating: 4.8, trades: 89,  gender: 'M' as const }, type: 'parcial' as const, temParaMim: [88],         euTenhoPara: [67], balance: 0 },
]

const DOACOES = [
  { id: 'd1', user: { name: 'Fernanda R.', city: 'Porto Alegre, RS', avatar: 'FR', avatarColor: 'from-violet-400 to-pink-500', rating: 4.5, trades: 78, gender: 'F' as const }, stickers: [21, 101] },
  { id: 'd2', user: { name: 'Marcos T.',   city: 'Fortaleza, CE',    avatar: 'MT', avatarColor: 'from-blue-400 to-indigo-500', rating: 4.7, trades: 31, gender: 'M' as const }, stickers: [90] },
]

const VENDAS = [
  { id: 'v01', user: { name: 'Ricardo B.',   city: 'São Paulo, SP',        avatar: 'RB', avatarColor: 'from-green-400 to-teal-500',   rating: 4.8, sales: 64  }, items: [{ num: 19, preco: 2.00,  tipo: 'normal'    as const }, { num: 21,  preco: 2.00,  tipo: 'normal'    as const }, { num: 40,  preco: 12.00, tipo: 'brilhante' as const }, { num: 53,  preco: 2.00,  tipo: 'normal' as const }] },
  { id: 'v02', user: { name: 'Camila T.',    city: 'Belo Horizonte, MG',   avatar: 'CT', avatarColor: 'from-rose-400 to-pink-500',    rating: 5.0, sales: 128 }, items: [{ num: 65, preco: 2.00,  tipo: 'normal'    as const }, { num: 76,  preco: 8.00,  tipo: 'escudo'    as const }, { num: 88,  preco: 2.00,  tipo: 'normal'    as const }, { num: 90,  preco: 15.00, tipo: 'brilhante' as const }] },
  { id: 'v03', user: { name: 'Leandro P.',   city: 'Recife, PE',            avatar: 'LP', avatarColor: 'from-amber-400 to-orange-500', rating: 4.6, sales: 33  }, items: [{ num: 101, preco: 2.00, tipo: 'normal'    as const }, { num: 78,  preco: 5.00,  tipo: 'escudo'    as const }, { num: 28,  preco: 2.00,  tipo: 'normal'    as const }] },
  { id: 'v04', user: { name: 'Patrícia M.',  city: 'Curitiba, PR',          avatar: 'PM', avatarColor: 'from-purple-400 to-violet-500',rating: 4.7, sales: 91  }, items: [{ num: 42, preco: 2.00,  tipo: 'normal'    as const }, { num: 65,  preco: 2.00,  tipo: 'normal'    as const }, { num: 19,  preco: 2.50,  tipo: 'normal'    as const }, { num: 101, preco: 2.00,  tipo: 'normal' as const }, { num: 78,  preco: 5.00,  tipo: 'escudo' as const }] },
  { id: 'v05', user: { name: 'Fábio N.',     city: 'Porto Alegre, RS',      avatar: 'FN', avatarColor: 'from-sky-400 to-blue-500',     rating: 4.5, sales: 17  }, items: [{ num: 76, preco: 7.00,  tipo: 'escudo'    as const }, { num: 88,  preco: 2.00,  tipo: 'normal'    as const }, { num: 53,  preco: 2.00,  tipo: 'normal'    as const }] },
  { id: 'v06', user: { name: 'Roberta S.',   city: 'Fortaleza, CE',         avatar: 'RS', avatarColor: 'from-fuchsia-400 to-pink-500', rating: 4.9, sales: 210 }, items: [{ num: 40, preco: 10.00, tipo: 'brilhante' as const }, { num: 21,  preco: 2.00,  tipo: 'normal'    as const }, { num: 90,  preco: 14.00, tipo: 'brilhante' as const }, { num: 42,  preco: 2.00,  tipo: 'normal' as const }] },
  { id: 'v07', user: { name: 'Thiago C.',    city: 'Salvador, BA',          avatar: 'TC', avatarColor: 'from-lime-400 to-green-500',   rating: 4.3, sales: 55  }, items: [{ num: 28, preco: 2.00,  tipo: 'normal'    as const }, { num: 101, preco: 2.00,  tipo: 'normal'    as const }, { num: 19,  preco: 2.00,  tipo: 'normal'    as const }] },
  { id: 'v08', user: { name: 'Mariana L.',   city: 'Manaus, AM',            avatar: 'ML', avatarColor: 'from-cyan-400 to-teal-500',    rating: 4.6, sales: 38  }, items: [{ num: 65, preco: 2.00,  tipo: 'normal'    as const }, { num: 78,  preco: 6.00,  tipo: 'escudo'    as const }, { num: 88,  preco: 2.00,  tipo: 'normal'    as const }, { num: 21,  preco: 2.00,  tipo: 'normal'    as const }] },
  { id: 'v09', user: { name: 'Daniel F.',    city: 'Natal, RN',             avatar: 'DF', avatarColor: 'from-orange-400 to-amber-500', rating: 4.8, sales: 77  }, items: [{ num: 53, preco: 2.00,  tipo: 'normal'    as const }, { num: 40,  preco: 13.00, tipo: 'brilhante' as const }, { num: 76,  preco: 8.00,  tipo: 'escudo'    as const }] },
  { id: 'v10', user: { name: 'Isabela C.',   city: 'Florianópolis, SC',     avatar: 'IC', avatarColor: 'from-pink-400 to-rose-500',    rating: 5.0, sales: 153 }, items: [{ num: 90, preco: 12.00, tipo: 'brilhante' as const }, { num: 101, preco: 2.00,  tipo: 'normal'    as const }, { num: 42,  preco: 2.00,  tipo: 'normal'    as const }, { num: 65,  preco: 2.00,  tipo: 'normal'    as const }] },
  { id: 'v11', user: { name: 'André M.',     city: 'Goiânia, GO',           avatar: 'AM', avatarColor: 'from-indigo-400 to-blue-500',  rating: 4.4, sales: 22  }, items: [{ num: 19, preco: 2.00,  tipo: 'normal'    as const }, { num: 28,  preco: 2.00,  tipo: 'normal'    as const }, { num: 88,  preco: 2.00,  tipo: 'normal'    as const }] },
  { id: 'v12', user: { name: 'Juliana R.',   city: 'Belém, PA',             avatar: 'JR', avatarColor: 'from-teal-400 to-cyan-500',    rating: 4.7, sales: 49  }, items: [{ num: 78, preco: 5.00,  tipo: 'escudo'    as const }, { num: 53,  preco: 2.00,  tipo: 'normal'    as const }, { num: 21,  preco: 2.00,  tipo: 'normal'    as const }, { num: 76,  preco: 7.50,  tipo: 'escudo'    as const }] },
  { id: 'v13', user: { name: 'Bruno K.',     city: 'Brasília, DF',          avatar: 'BK', avatarColor: 'from-red-400 to-orange-500',   rating: 4.5, sales: 61  }, items: [{ num: 42, preco: 2.00,  tipo: 'normal'    as const }, { num: 90,  preco: 16.00, tipo: 'brilhante' as const }, { num: 65,  preco: 2.00,  tipo: 'normal'    as const }] },
  { id: 'v14', user: { name: 'Letícia P.',   city: 'Vitória, ES',           avatar: 'LP', avatarColor: 'from-violet-400 to-purple-500',rating: 4.9, sales: 88  }, items: [{ num: 40, preco: 11.00, tipo: 'brilhante' as const }, { num: 101, preco: 2.00,  tipo: 'normal'    as const }, { num: 88,  preco: 2.00,  tipo: 'normal'    as const }] },
  { id: 'v15', user: { name: 'Gustavo A.',   city: 'Campo Grande, MS',      avatar: 'GA', avatarColor: 'from-green-400 to-emerald-500',rating: 4.6, sales: 30  }, items: [{ num: 19, preco: 2.00,  tipo: 'normal'    as const }, { num: 78,  preco: 5.00,  tipo: 'escudo'    as const }, { num: 21,  preco: 2.00,  tipo: 'normal'    as const }, { num: 53,  preco: 2.00,  tipo: 'normal'    as const }] },
]

const POR_PAGINA = 10

type Tab = 'trocas' | 'doacoes' | 'vendas'

interface DuplicateWarning {
  vendaId:        string
  num:            number
  outroVendedor:  string
}

export default function MatchesPage() {
  const [tab, setTab]               = useState<Tab>('trocas')
  const [expanded, setExpanded]     = useState<string | null>(null)
  const [removidos, setRemovidos]       = useState<Record<string, Set<number>>>({})  // minha oferta
  const [removidosDele, setRemovidosDele] = useState<Record<string, Set<number>>>({}) // oferta dele
  const [carrinho, setCarrinho]         = useState<Record<string, Set<number>>>({})
  const [pagina, setPagina]             = useState(0)
  const [aviso, setAviso]               = useState<DuplicateWarning | null>(null)

  // ── Paginação ─────────────────────────────────────────────────
  const totalPaginas  = Math.ceil(VENDAS.length / POR_PAGINA)
  const vendaPagina   = VENDAS.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA)

  // ── Totais globais do carrinho ─────────────────────────────────
  const { totalItens, totalValor } = useMemo(() => {
    let itens = 0
    let valor = 0
    for (const v of VENDAS) {
      const sel = carrinho[v.id] ?? new Set<number>()
      for (const item of v.items) {
        if (sel.has(item.num)) { itens++; valor += item.preco }
      }
    }
    return { totalItens: itens, totalValor: valor }
  }, [carrinho])

  // ── Removidos (trocas) ─────────────────────────────────────────
  function toggleRemovido(matchId: string, num: number) {
    setRemovidos(prev => {
      const next = new Set(prev[matchId] ?? [])
      next.has(num) ? next.delete(num) : next.add(num)
      return { ...prev, [matchId]: next }
    })
  }

  function toggleRemovidoDele(matchId: string, num: number) {
    setRemovidosDele(prev => {
      const next = new Set(prev[matchId] ?? [])
      next.has(num) ? next.delete(num) : next.add(num)
      return { ...prev, [matchId]: next }
    })
  }

  // ── Carrinho (vendas) ──────────────────────────────────────────
  function toggleCarrinho(vendaId: string, num: number, force = false) {
    // Se já está no carrinho deste vendedor → desmarca sem aviso
    const jaNesteVendedor = (carrinho[vendaId] ?? new Set()).has(num)
    if (jaNesteVendedor) {
      setCarrinho(prev => {
        const next = new Set(prev[vendaId] ?? [])
        next.delete(num)
        return { ...prev, [vendaId]: next }
      })
      return
    }

    // Verifica se está marcado em outro vendedor
    if (!force) {
      for (const v of VENDAS) {
        if (v.id === vendaId) continue
        if ((carrinho[v.id] ?? new Set()).has(num)) {
          setAviso({ vendaId, num, outroVendedor: v.user.name })
          return
        }
      }
    }

    setCarrinho(prev => {
      const next = new Set(prev[vendaId] ?? [])
      next.add(num)
      return { ...prev, [vendaId]: next }
    })
  }

  function confirmarDuplicata() {
    if (!aviso) return
    toggleCarrinho(aviso.vendaId, aviso.num, true)
    setAviso(null)
  }

  function selecionarTudo(vendaId: string, nums: number[]) {
    setCarrinho(prev => ({ ...prev, [vendaId]: new Set(nums) }))
  }

  function limparCarrinho(vendaId: string) {
    setCarrinho(prev => ({ ...prev, [vendaId]: new Set() }))
  }

  const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div className="max-w-2xl mx-auto px-3 py-4 animate-fadein">

      {/* Modal aviso duplicata */}
      {aviso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAviso(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm animate-fadein">
            <p className="text-2xl mb-2">⚠️</p>
            <p className="font-black text-slate-800 mb-1">Figurinha já no carrinho</p>
            <p className="text-sm text-slate-500 mb-4">
              A figurinha <span className="font-bold text-slate-700">#{aviso.num}</span> já está no seu carrinho de{' '}
              <span className="font-bold text-slate-700">{aviso.outroVendedor}</span>.
              Quer adicionar mesmo assim? (ex: quer 2 cópias)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setAviso(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarDuplicata}
                className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700"
              >
                Adicionar mesmo assim
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <h1 className="text-xl font-black text-slate-800">Matches</h1>
        <p className="text-sm text-slate-500">Colecionadores com figurinhas do seu interesse</p>
      </div>

      {/* Aviso de match */}
      <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 mb-4 flex items-center gap-3">
        <span className="text-2xl">🔥</span>
        <div>
          <p className="text-sm font-bold text-green-800">{MATCHES.length + VENDAS.length + DOACOES.length} matches encontrados!</p>
          <p className="text-xs text-green-600">Trocas, vendas e doações com figurinhas que você precisa</p>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-1.5 mb-4">
        {([
          { key: 'trocas',  label: `🔁 Trocas (${MATCHES.length})` },
          { key: 'vendas',  label: `💰 Vendas (${VENDAS.length})` },
          { key: 'doacoes', label: `💜 Doações (${DOACOES.length})` },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={[
              'flex-1 py-2.5 rounded-xl text-xs font-bold transition-all',
              tab === t.key ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 border border-slate-200',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TROCAS ── */}
      {tab === 'trocas' && (
        <div className="space-y-3 animate-fadein">
          {MATCHES.map(match => {
            const rem         = removidos[match.id]     ?? new Set<number>()
            const remDele     = removidosDele[match.id] ?? new Set<number>()
            const oferta      = match.euTenhoPara.filter(n => !rem.has(n))
            const deles       = match.temParaMim.filter(n => !remDele.has(n))
            const dynBalance  = oferta.length - deles.length
            const equilibrado = dynBalance === 0
            const isOpen      = expanded === match.id
            const p           = pronome(match.user.gender)

            return (
              <div key={match.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${match.user.avatarColor} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white text-xs font-black">{match.user.avatar}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-slate-800">{match.user.name}</p>
                      <span className={['text-[10px] font-bold px-2 py-0.5 rounded-full', equilibrado ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'].join(' ')}>
                        {equilibrado ? '✓ Match exato' : '≈ Match parcial'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{match.user.city} · ⭐ {match.user.rating}</p>
                  </div>
                  <button onClick={() => setExpanded(isOpen ? null : match.id)} className="text-slate-400 text-sm px-2">
                    {isOpen ? '▲' : '▼'}
                  </button>
                </div>

                <div className="px-4 pb-3 flex items-center gap-3 text-xs text-slate-500">
                  <span><span className="text-blue-500 font-bold">{p.ele} tem:</span> <span className="font-semibold text-slate-700">{match.temParaMim.length} fig. suas</span></span>
                  <span className="text-slate-300">·</span>
                  <span><span className="text-blue-500 font-bold">{p.ele} tem:</span> <span className="font-semibold text-slate-700">{deles.length} fig. suas</span></span>
                  <span className="text-slate-300">·</span>
                  <span><span className="text-green-500 font-bold">Você tem:</span> <span className="font-semibold text-slate-700">{oferta.length} fig. {p.dele}</span></span>
                  {!equilibrado && <><span className="text-slate-300">·</span><span className="text-amber-600 font-medium">{dynBalance > 0 ? `${dynBalance} a mais` : `${Math.abs(dynBalance)} a menos`}</span></>}
                </div>

                {isOpen && (
                  <div className="px-4 pb-4 border-t border-slate-50 pt-3 animate-fadein">
                    {!equilibrado && (
                      <p className="text-[11px] text-slate-400 text-center mb-3">
                        Toque em qualquer figurinha dos dois lados para removê-la da proposta
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-4 mb-3">

                      {/* Lado dele — clicável */}
                      <div>
                        <p className="text-xs font-semibold text-blue-600 mb-2">🔵 {p.ele} tem:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {match.temParaMim.map(num => {
                            const s       = allStickers.find(x => x.number === num)
                            const removido = remDele.has(num)
                            return (
                              <button
                                key={num}
                                onClick={() => toggleRemovidoDele(match.id, num)}
                                title={removido ? `Recolocar #${num}` : `Remover #${num} da proposta`}
                                className={['w-9 h-9 rounded-lg border-2 flex flex-col items-center justify-center transition-all active:scale-90',
                                  removido
                                    ? 'bg-slate-100 border-slate-200 text-slate-300 opacity-50'
                                    : 'bg-blue-50 border-blue-300 text-blue-700 hover:border-red-300 hover:bg-red-50'].join(' ')}
                              >
                                <span className="text-[10px] font-bold leading-none">{removido ? '✕' : num}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Lado meu — clicável */}
                      <div>
                        <p className="text-xs font-semibold text-green-600 mb-2">🟢 Você tem:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {match.euTenhoPara.map(num => {
                            const s       = allStickers.find(x => x.number === num)
                            const removido = rem.has(num)
                            return (
                              <button
                                key={num}
                                onClick={() => toggleRemovido(match.id, num)}
                                title={removido ? `Recolocar #${num}` : `Remover #${num} da proposta`}
                                className={['w-9 h-9 rounded-lg border-2 flex flex-col items-center justify-center transition-all active:scale-90',
                                  removido
                                    ? 'bg-slate-100 border-slate-200 text-slate-300 opacity-50'
                                    : 'bg-green-50 border-green-300 text-green-700 hover:border-red-300 hover:bg-red-50'].join(' ')}
                              >
                                <span className="text-[10px] font-bold leading-none">{removido ? '✕' : num}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    {!equilibrado && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-3 text-xs text-amber-700">
                        {dynBalance > 0
                          ? `⚠️ Você tem ${dynBalance} fig. a mais — remova ${dynBalance} do seu lado para equilibrar.`
                          : `⚠️ ${p.ele} tem ${Math.abs(dynBalance)} fig. a mais — remova ${Math.abs(dynBalance)} do lado ${p.dele} para equilibrar.`
                        }
                      </div>
                    )}
                    {equilibrado && (rem.size > 0 || remDele.size > 0) && (
                      <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2.5 mb-3 text-xs text-green-700">
                        ✅ Troca equilibrada! Você pode enviar a proposta agora.
                      </div>
                    )}

                    <button
                      disabled={!equilibrado}
                      className={['w-full font-bold py-3 rounded-xl text-sm transition-colors', equilibrado ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed'].join(' ')}
                    >
                      🔁 {equilibrado ? 'Enviar proposta de troca' : 'Ajuste a proposta para enviar'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── VENDAS ── */}
      {tab === 'vendas' && (
        <div className="animate-fadein">
          <p className="text-xs text-slate-400 text-center mb-3">
            Vendedores com figurinhas que você não tem — toque nas que quer comprar
          </p>

          <div className="space-y-3">
            {vendaPagina.map(v => {
              const isOpen   = expanded === v.id
              const sel      = carrinho[v.id] ?? new Set<number>()
              const totalSel = v.items.filter(i => sel.has(i.num)).reduce((a, i) => a + i.preco, 0)
              const precos   = v.items.map(i => i.preco)
              const pMin = Math.min(...precos), pMax = Math.max(...precos)
              const faixa = pMin === pMax ? fmtBRL(pMin) : `${fmtBRL(pMin)} – ${fmtBRL(pMax)}`

              return (
                <div key={v.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

                  {/* Header */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : v.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${v.user.avatarColor} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white text-xs font-black">{v.user.avatar}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-slate-800">{v.user.name}</p>
                        {sel.size > 0 && (
                          <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            {sel.size} no carrinho
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{v.user.city} · ⭐ {v.user.rating} · {v.user.sales} vendas</p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 flex-shrink-0 text-right">
                      <span className="text-[10px] font-semibold text-slate-500">{v.items.length} fig. disponíveis</span>
                      <span className="text-[10px] text-slate-400">{faixa}</span>
                    </div>
                    <span className="text-slate-400 text-xs ml-1">{isOpen ? '▲' : '▼'}</span>
                  </button>

                  {/* Grid expandido */}
                  {isOpen && (
                    <div className="border-t border-slate-50 px-4 pt-3 pb-4 animate-fadein">
                      <div className="flex gap-2 mb-3">
                        <button onClick={() => selecionarTudo(v.id, v.items.map(i => i.num))} className="text-xs font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors">
                          Selecionar tudo
                        </button>
                        {sel.size > 0 && (
                          <button onClick={() => limparCarrinho(v.id)} className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors">
                            Limpar
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {v.items.map(item => {
                          const selecionado = sel.has(item.num)
                          const isBrilhante = item.tipo === 'brilhante'
                          const isEscudo    = item.tipo === 'escudo'
                          return (
                            <button
                              key={item.num}
                              onClick={() => toggleCarrinho(v.id, item.num)}
                              title={`#${item.num} · ${allStickers.find(x => x.number === item.num)?.name ?? ''} · ${fmtBRL(item.preco)}`}
                              className={[
                                'w-12 h-12 rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90 hover:scale-105 select-none',
                                selecionado ? 'bg-green-600 border-green-700 text-white shadow-sm'
                                  : isBrilhante ? 'bg-amber-50 border-amber-300 text-amber-700'
                                  : isEscudo   ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                                  : 'bg-white border-slate-200 text-slate-600 hover:border-green-300',
                              ].join(' ')}
                            >
                              {selecionado ? (
                                <span className="text-base leading-none">✓</span>
                              ) : (
                                <>
                                  <span className="text-[10px] font-black leading-none">{item.num}</span>
                                  <span className="text-[8px] leading-none font-semibold opacity-75">
                                    {fmtBRL(item.preco).replace('R$ ', 'R$')}
                                  </span>
                                  {isBrilhante && <span className="text-[7px] leading-none">✨</span>}
                                  {isEscudo    && <span className="text-[7px] leading-none">🛡</span>}
                                </>
                              )}
                            </button>
                          )
                        })}
                      </div>

                      {sel.size > 0 ? (
                        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
                          <div className="flex-1">
                            <p className="text-sm font-bold text-green-800">{sel.size} figurinha{sel.size > 1 ? 's' : ''} selecionada{sel.size > 1 ? 's' : ''}</p>
                            <p className="text-xs text-green-600">Subtotal: <span className="font-black">{fmtBRL(totalSel)}</span></p>
                          </div>
                          <button className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors flex-shrink-0">
                            🛒 Comprar
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 text-center">Toque nas figurinhas que quer comprar</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-4">
              <button
                onClick={() => { setPagina(p => Math.max(0, p - 1)); setExpanded(null) }}
                disabled={pagina === 0}
                className="w-9 h-9 rounded-xl border border-slate-200 text-slate-500 text-sm disabled:opacity-30 hover:bg-slate-50 transition-colors"
              >
                ‹
              </button>
              {Array.from({ length: totalPaginas }, (_, i) => (
                <button
                  key={i}
                  onClick={() => { setPagina(i); setExpanded(null) }}
                  className={[
                    'w-9 h-9 rounded-xl text-sm font-bold transition-all',
                    pagina === i ? 'bg-slate-800 text-white' : 'border border-slate-200 text-slate-500 hover:bg-slate-50',
                  ].join(' ')}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => { setPagina(p => Math.min(totalPaginas - 1, p + 1)); setExpanded(null) }}
                disabled={pagina === totalPaginas - 1}
                className="w-9 h-9 rounded-xl border border-slate-200 text-slate-500 text-sm disabled:opacity-30 hover:bg-slate-50 transition-colors"
              >
                ›
              </button>
            </div>
          )}

          {/* Botão carrinho global */}
          {totalItens > 0 && (
            <div className="mt-4 bg-slate-800 rounded-2xl px-4 py-4 flex items-center gap-3 shadow-lg">
              <div className="flex-1">
                <p className="text-white font-black text-sm">🛒 Meu Carrinho</p>
                <p className="text-slate-300 text-xs mt-0.5">
                  {totalItens} figurinha{totalItens > 1 ? 's' : ''} de {Object.values(carrinho).filter(s => s.size > 0).length} vendedor{Object.values(carrinho).filter(s => s.size > 0).length > 1 ? 'es' : ''}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-green-400 font-black text-lg leading-none">{fmtBRL(totalValor)}</p>
                <Link href="/conta?s=carrinho" className="mt-1.5 inline-block bg-green-600 hover:bg-green-500 text-white font-bold text-xs px-4 py-1.5 rounded-xl transition-colors">
                  Finalizar compra →
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── DOAÇÕES ── */}
      {tab === 'doacoes' && (
        <div className="space-y-3 animate-fadein">
          {DOACOES.map(d => (
            <div key={d.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${d.user.avatarColor} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-xs font-black">{d.user.avatar}</span>
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-800">{d.user.name}</p>
                  <p className="text-xs text-slate-400">{d.user.city} · ⭐ {d.user.rating}</p>
                </div>
                <span className="ml-auto text-xs bg-purple-100 text-purple-700 font-bold px-2 py-1 rounded-full">💜 Doação</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {d.stickers.map(num => {
                  const s = allStickers.find(x => x.number === num)
                  return <StickerSquare key={num} number={num} name={s?.name} stickerType={s?.type} status="doacao" size="sm" />
                })}
              </div>
              <button className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
                💜 Solicitar doação
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
