'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  getPropostasRecebidas, savePropostasRecebidas,
  getPropostasEnviadas, savePropostasEnviadas,
  addPedido,
  type PropostaRecebida, type PropostaEnviada, type PreferenciaEntrega, type UserProfile,
} from '@/lib/store'
import { getSession, dbGetProfile } from '@/lib/db'
import BannerMenorDeIdade from '@/components/BannerMenorDeIdade'

type Aba = 'recebidas' | 'enviadas'

const STATUS_CONFIG = {
  pendente:  { label: 'Aguardando',  bg: 'bg-amber-100',  text: 'text-amber-700'  },
  aceita:    { label: 'Aceita',      bg: 'bg-green-100',  text: 'text-green-700'  },
  recusada:  { label: 'Recusada',    bg: 'bg-red-100',    text: 'text-red-700'    },
}

// Ponto Mercado Envios mais próximo por UF (mock)
const PONTOS_MERCADO_ENVIOS: Record<string, string> = {
  SP: 'Ponto Mercado Envios — Paulista · Av. Paulista, 695 · Bela Vista · São Paulo/SP · CEP 01311-100 · Seg–Sex 9h–20h · Sáb 9h–14h',
  RJ: 'Ponto Mercado Envios — Flamengo · Rua Marquês de Abrantes, 6 · Flamengo · Rio de Janeiro/RJ · CEP 22230-060 · Seg–Sex 9h–20h · Sáb 9h–14h',
  MG: 'Ponto Mercado Envios — Savassi · Av. do Contorno, 6594 · Savassi · Belo Horizonte/MG · CEP 30110-042 · Seg–Sex 9h–20h · Sáb 9h–14h',
  PR: 'Ponto Mercado Envios — Batel · R. Visconde do Rio Branco, 1490 · Batel · Curitiba/PR · CEP 80420-210 · Seg–Sex 9h–20h · Sáb 9h–14h',
  RS: 'Ponto Mercado Envios — Moinhos · Av. Independência, 1008 · Moinhos de Vento · Porto Alegre/RS · CEP 90035-071 · Seg–Sex 9h–20h · Sáb 9h–14h',
  BA: 'Ponto Mercado Envios — Pituba · Av. Antônio Carlos Magalhães, 3244 · Pituba · Salvador/BA · CEP 41825-000 · Seg–Sex 9h–20h · Sáb 9h–14h',
  PE: 'Ponto Mercado Envios — Boa Viagem · Av. Conselheiro Aguiar, 2900 · Boa Viagem · Recife/PE · CEP 51020-010 · Seg–Sex 9h–20h · Sáb 9h–14h',
  CE: 'Ponto Mercado Envios — Aldeota · Av. Santos Dumont, 3800 · Aldeota · Fortaleza/CE · CEP 60150-161 · Seg–Sex 9h–20h · Sáb 9h–14h',
  DEFAULT: 'Ponto Mercado Envios mais próximo — consulte envios.mercadopago.com.br para encontrar o ponto mais próximo de você.',
}

function meuEndereco(p: Partial<UserProfile>): string {
  if (!p.logradouro) return 'Endereço não cadastrado'
  const partes = [p.logradouro, p.numero, p.complemento].filter(Boolean).join(', ')
  return `${partes} · ${p.cidade}/${p.uf} · CEP ${p.cep}`
}

function minhaCidadeUF(p: Partial<UserProfile>): string {
  return (p.cidade && p.uf) ? `${p.cidade}, ${p.uf}` : 'São Paulo, SP'
}

function pontoPorCidade(city: string): string {
  const uf = city.split(', ')[1]?.toUpperCase() ?? ''
  return PONTOS_MERCADO_ENVIOS[uf] ?? PONTOS_MERCADO_ENVIOS.DEFAULT
}

function StickerPill({ num }: { num: number }) {
  return (
    <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg border-2 border-slate-200 bg-slate-50 text-[11px] font-black text-slate-600 flex-shrink-0">
      {num}
    </span>
  )
}

function CardEnviarPara({ pref, contraparte }: { pref: PreferenciaEntrega; contraparte: string }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
      <div className="flex items-start gap-2">
        <span className="text-xl flex-shrink-0">{pref.tipo === 'agencia' ? '📮' : '🏠'}</span>
        <div>
          <p className="text-xs font-bold text-amber-800 mb-1">
            {pref.tipo === 'agencia'
              ? `Envie para o ponto Mercado Envios escolhido por ${contraparte}`
              : `Envie para o endereço de ${contraparte}`}
          </p>
          <p className="text-sm text-amber-900 font-medium leading-relaxed">{pref.destino}</p>
          {pref.tipo === 'agencia' && (
            <p className="text-[11px] text-amber-700 mt-1.5 font-medium">
              💡 {contraparte} vai retirar no ponto Mercado Envios e poderá conferir antes de aceitar o recebimento.
            </p>
          )}
          <p className="text-[11px] text-amber-600 mt-1">
            ⚠️ O frete é por sua conta — use o serviço de envio de sua preferência.
          </p>
        </div>
      </div>
    </div>
  )
}

function SelecionarEntrega({
  minhaCidade,
  meuEnderecoPerfil,
  onEscolher,
}: {
  minhaCidade: string
  meuEnderecoPerfil: string
  onEscolher: (p: PreferenciaEntrega) => void
}) {
  const agencia = pontoPorCidade(minhaCidade)

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
      <p className="text-sm font-bold text-blue-800 mb-1">Como você quer receber suas figurinhas?</p>
      <p className="text-xs text-blue-600 mb-3">
        Sua privacidade é protegida. Escolha a opção mais conveniente.
      </p>
      <div className="space-y-2">
        {/* Opção agência */}
        <button
          onClick={() => onEscolher({ tipo: 'agencia', destino: agencia })}
          className="w-full text-left bg-white border-2 border-blue-200 hover:border-blue-400 rounded-xl p-3 transition-all group"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">📮</span>
            <div>
              <p className="font-bold text-slate-800 text-sm group-hover:text-blue-700">Ponto Mercado Envios</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Você retira no ponto e confere tudo na hora. Mais seguro — pode recusar o recebimento se estiver errado.
              </p>
              <p className="text-[11px] text-blue-600 mt-1 font-medium">✓ Recomendado · Sem compartilhar seu endereço</p>
            </div>
          </div>
        </button>

        {/* Opção endereço */}
        <button
          onClick={() => onEscolher({ tipo: 'endereco', destino: meuEnderecoPerfil })}
          className="w-full text-left bg-white border-2 border-slate-200 hover:border-slate-400 rounded-xl p-3 transition-all group"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">🏠</span>
            <div>
              <p className="font-bold text-slate-800 text-sm group-hover:text-slate-700">Meu endereço</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Recebe diretamente em casa. Seu endereço será compartilhado com a outra parte.
              </p>
              <p className="text-[11px] text-slate-400 mt-1">{meuEnderecoPerfil}</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}

export default function PropostasPage() {
  const [aba, setAba]               = useState<Aba>('recebidas')
  const [recebidas, setRecebidas]   = useState<PropostaRecebida[]>([])
  const [enviadas, setEnviadas]     = useState<PropostaEnviada[]>([])
  const [confirmando, setConfirmando] = useState<{ id: string; acao: 'aceitar' | 'recusar' } | null>(null)
  const [adulto, setAdulto]           = useState(true)
  const [perfil, setPerfil]           = useState<Partial<UserProfile>>({})

  useEffect(() => {
    queueMicrotask(() => setRecebidas(getPropostasRecebidas()))
    queueMicrotask(() => setEnviadas(getPropostasEnviadas()))
    getSession().then(session => {
      if (!session) { setAdulto(true); return }
      dbGetProfile().then(p => { setPerfil(p); setAdulto(!!p.maior18) })
    })
  }, [])

  function handleAcao(id: string, acao: 'aceitar' | 'recusar') {
    setConfirmando({ id, acao })
  }

  function confirmar() {
    if (!confirmando) return
    const novoStatus = confirmando.acao === 'aceitar' ? 'aceita' : 'recusada'
    const proposta   = recebidas.find(p => p.id === confirmando.id)
    const atualizadas = recebidas.map(p =>
      p.id === confirmando.id ? { ...p, status: novoStatus as PropostaRecebida['status'] } : p
    )
    setRecebidas(atualizadas)
    savePropostasRecebidas(atualizadas)

    // Cria pedido no histórico ao aceitar
    if (confirmando.acao === 'aceitar' && proposta) {
      const qtd = proposta.eleOferece.length + proposta.elePede.length
      addPedido({
        id:               'troca-' + Date.now().toString(36),
        data:             new Date().toLocaleDateString('pt-BR'),
        tipo:             'troca',
        status:           'pendente',
        contraparte:      proposta.de,
        fig:              `${qtd} figurinha${qtd !== 1 ? 's' : ''}`,
        enderecoEntrega:  proposta.enviarPara?.destino,
      })
    }

    setConfirmando(null)
  }

  function escolherEntregaRecebida(id: string, pref: PreferenciaEntrega) {
    const atualizadas = recebidas.map(p =>
      p.id === id ? { ...p, minhaEscolha: pref } : p
    )
    setRecebidas(atualizadas)
    savePropostasRecebidas(atualizadas)
  }

  function escolherEntregaEnviada(id: string, pref: PreferenciaEntrega) {
    const atualizadas = enviadas.map(p =>
      p.id === id ? { ...p, minhaEscolha: pref } : p
    )
    setEnviadas(atualizadas)
    savePropostasEnviadas(atualizadas)
  }

  const pendentesRecebidas = recebidas.filter(p => p.status === 'pendente').length
  const pendentesEnviadas  = enviadas.filter(p => p.status === 'pendente').length

  return (
    <div className="max-w-2xl mx-auto px-3 py-4 animate-fadein">

      <BannerMenorDeIdade />

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link href="/matches" className="text-sm text-slate-400 hover:text-slate-600">‹</Link>
        <h1 className="text-lg font-black text-slate-800">Propostas de Troca</h1>
      </div>

      {/* Abas */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-4">
        {([
          { key: 'recebidas', label: 'Recebidas', badge: pendentesRecebidas },
          { key: 'enviadas',  label: 'Enviadas',  badge: pendentesEnviadas  },
        ] as { key: Aba; label: string; badge: number }[]).map(a => (
          <button
            key={a.key}
            onClick={() => setAba(a.key)}
            className={[
              'flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2',
              aba === a.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700',
            ].join(' ')}
          >
            {a.label}
            {a.badge > 0 && (
              <span className="w-5 h-5 rounded-full bg-green-500 text-white text-[10px] font-black flex items-center justify-center">
                {a.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── RECEBIDAS ── */}
      {aba === 'recebidas' && (
        <div className="space-y-3 animate-fadein">
          {recebidas.length === 0 && (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📭</p>
              <p className="font-bold text-slate-700">Nenhuma proposta recebida</p>
              <p className="text-sm text-slate-400 mt-1">Quando alguém quiser trocar com você, aparece aqui.</p>
            </div>
          )}

          {recebidas.map(p => {
            const st = STATUS_CONFIG[p.status]
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-50">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${p.deAvatarColor} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white text-sm font-black">{p.deAvatar}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-800 text-sm">{p.de}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>
                        {st.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{p.deCity} · ⭐ {p.deRating} · {p.data}</p>
                  </div>
                </div>

                {/* Ofertas */}
                <div className="grid grid-cols-2 divide-x divide-slate-50">
                  <div className="px-3 py-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                      {p.deGender === 'F' ? 'Ela oferece' : 'Ele oferece'} ({p.eleOferece.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {p.eleOferece.map(n => <StickerPill key={n} num={n} />)}
                    </div>
                  </div>
                  <div className="px-3 py-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                      Quer receber ({p.elePede.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {p.elePede.map(n => <StickerPill key={n} num={n} />)}
                    </div>
                  </div>
                </div>

                {/* Balanço */}
                <div className={[
                  'mx-3 mb-3 px-3 py-2 rounded-xl text-xs text-center font-semibold',
                  p.eleOferece.length === p.elePede.length
                    ? 'bg-green-50 text-green-700'
                    : 'bg-amber-50 text-amber-700',
                ].join(' ')}>
                  {p.eleOferece.length === p.elePede.length
                    ? '✓ Troca exata — mesma quantidade dos dois lados'
                    : `Desequilíbrio: ${p.eleOferece.length} × ${p.elePede.length}`}
                </div>

                {/* Ações pendente */}
                {p.status === 'pendente' && (
                  <div className="flex gap-2 px-3 pb-3">
                    <button
                      onClick={() => handleAcao(p.id, 'recusar')}
                      className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Recusar
                    </button>
                    {adulto ? (
                      <button
                        onClick={() => handleAcao(p.id, 'aceitar')}
                        className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition-colors"
                      >
                        ✓ Aceitar troca
                      </button>
                    ) : (
                      <div className="flex-1 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold text-center">
                        🔒 +18 obrigatório
                      </div>
                    )}
                  </div>
                )}

                {/* Aceita — fluxo de entrega */}
                {p.status === 'aceita' && (
                  <div className="px-3 pb-3 space-y-2">
                    <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <p className="text-sm font-bold text-green-700">Troca aceita com {p.de}!</p>
                    </div>

                    {/* PASSO 1 — minha escolha de recebimento (sempre primeiro) */}
                    {!p.minhaEscolha ? (
                      <SelecionarEntrega
                        minhaCidade={minhaCidadeUF(perfil)}
                        meuEnderecoPerfil={meuEndereco(perfil)}
                        onEscolher={(pref) => escolherEntregaRecebida(p.id, pref)}
                      />
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                        <div className="flex items-start gap-2">
                          <span className="text-xl">{p.minhaEscolha.tipo === 'agencia' ? '📮' : '🏠'}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-slate-700">
                                {p.minhaEscolha.tipo === 'agencia'
                                  ? 'Você vai retirar na agência'
                                  : 'Você vai receber em casa'}
                              </p>
                              <button
                                className="text-[10px] text-slate-400 hover:text-slate-600 underline"
                                onClick={() => {
                                  const atualizadas = recebidas.map(r =>
                                    r.id === p.id ? { ...r, minhaEscolha: undefined } : r
                                  )
                                  setRecebidas(atualizadas)
                                  savePropostasRecebidas(atualizadas)
                                }}
                              >
                                Alterar
                              </button>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{p.minhaEscolha.destino}</p>
                            <p className="text-[11px] text-slate-400 mt-1">
                              {p.de} receberá este destino para saber onde enviar as figurinhas dela.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* PASSO 2 — onde enviar MINHAS figurinhas (só aparece após eu escolher) */}
                    {p.minhaEscolha && (
                      p.enviarPara
                        ? <CardEnviarPara pref={p.enviarPara} contraparte={p.de} />
                        : (
                          <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 flex items-center gap-2">
                            <span className="text-slate-400 animate-spin text-sm">⏳</span>
                            <p className="text-xs text-slate-500">
                              Aguardando {p.de} escolher como {p.deGender === 'F' ? 'ela' : 'ele'} quer receber…
                            </p>
                          </div>
                        )
                    )}
                  </div>
                )}

                {/* Recusada */}
                {p.status === 'recusada' && (
                  <div className="px-3 pb-3">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-center">
                      <p className="text-xs text-slate-500">Proposta recusada.</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── ENVIADAS ── */}
      {aba === 'enviadas' && (
        <div className="space-y-3 animate-fadein">
          {enviadas.length === 0 && (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📤</p>
              <p className="font-bold text-slate-700">Nenhuma proposta enviada</p>
              <p className="text-sm text-slate-400 mt-1">
                Vá para{' '}
                <Link href="/matches" className="text-green-600 font-semibold">Matches</Link>
                {' '}e envie propostas de troca.
              </p>
            </div>
          )}

          {enviadas.map(p => {
            const st = STATUS_CONFIG[p.status]
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-50">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${p.contraparteAvatarColor} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white text-sm font-black">{p.contraparteAvatar}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-800 text-sm">{p.contraparte}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>
                        {st.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{p.data}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 divide-x divide-slate-50">
                  <div className="px-3 py-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                      Você oferece ({p.euOfereco.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {p.euOfereco.map(n => <StickerPill key={n} num={n} />)}
                    </div>
                  </div>
                  <div className="px-3 py-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                      Você recebe ({p.euRecebo.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {p.euRecebo.map(n => <StickerPill key={n} num={n} />)}
                    </div>
                  </div>
                </div>

                {/* Aceita — fluxo de entrega */}
                {p.status === 'aceita' && (
                  <div className="px-3 pb-3 space-y-2">
                    <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <p className="text-sm font-bold text-green-700">{p.contraparte} aceitou sua proposta!</p>
                    </div>

                    {/* PASSO 1 — minha escolha de recebimento (sempre primeiro) */}
                    {!p.minhaEscolha ? (
                      <SelecionarEntrega
                        minhaCidade={minhaCidadeUF(perfil)}
                        meuEnderecoPerfil={meuEndereco(perfil)}
                        onEscolher={(pref) => escolherEntregaEnviada(p.id, pref)}
                      />
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                        <div className="flex items-start gap-2">
                          <span className="text-xl">{p.minhaEscolha.tipo === 'agencia' ? '📮' : '🏠'}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-slate-700">
                                {p.minhaEscolha.tipo === 'agencia'
                                  ? 'Você vai retirar na agência'
                                  : 'Você vai receber em casa'}
                              </p>
                              <button
                                className="text-[10px] text-slate-400 hover:text-slate-600 underline"
                                onClick={() => {
                                  const atualizadas = enviadas.map(e =>
                                    e.id === p.id ? { ...e, minhaEscolha: undefined } : e
                                  )
                                  setEnviadas(atualizadas)
                                  savePropostasEnviadas(atualizadas)
                                }}
                              >
                                Alterar
                              </button>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{p.minhaEscolha.destino}</p>
                            <p className="text-[11px] text-slate-400 mt-1">
                              {p.contraparte} receberá este destino para saber onde enviar as figurinhas.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* PASSO 2 — onde enviar MINHAS figurinhas (só aparece após eu escolher) */}
                    {p.minhaEscolha && (
                      p.enviarPara
                        ? <CardEnviarPara pref={p.enviarPara} contraparte={p.contraparte} />
                        : (
                          <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 flex items-center gap-2">
                            <span className="text-slate-400 text-sm">⏳</span>
                            <p className="text-xs text-slate-500">
                              Aguardando {p.contraparte} escolher como quer receber…
                            </p>
                          </div>
                        )
                    )}
                  </div>
                )}

                {/* Aguardando */}
                {p.status === 'pendente' && (
                  <div className="px-3 pb-3">
                    <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-center">
                      <p className="text-xs text-slate-500">Aguardando resposta de {p.contraparte}…</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal confirmação */}
      {confirmando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmando(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm animate-fadein">
            <p className="text-2xl mb-2">{confirmando.acao === 'aceitar' ? '🤝' : '❌'}</p>
            <p className="font-black text-slate-800 mb-1">
              {confirmando.acao === 'aceitar' ? 'Aceitar proposta?' : 'Recusar proposta?'}
            </p>
            <p className="text-sm text-slate-500 mb-4">
              {confirmando.acao === 'aceitar'
                ? 'Ao aceitar, você escolhe como quer receber e combina o envio com a outra parte.'
                : 'A proposta será recusada e o colecionador será notificado.'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmando(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600"
              >
                Cancelar
              </button>
              <button
                onClick={confirmar}
                className={[
                  'flex-1 py-2.5 rounded-xl text-white text-sm font-bold',
                  confirmando.acao === 'aceitar'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-500 hover:bg-red-600',
                ].join(' ')}
              >
                {confirmando.acao === 'aceitar' ? '✓ Aceitar' : 'Recusar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
