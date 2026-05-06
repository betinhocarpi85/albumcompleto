/**
 * lib/store.ts
 * Camada de persistência local (localStorage).
 * Quando o banco de dados estiver pronto, basta trocar as implementações
 * das funções — a assinatura pública não muda.
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

// AlbumId é definido em albums-registry; reexportado aqui para compatibilidade
import type { AlbumId } from '@/data/albums-registry'
export type { AlbumId }
export type TipoAnuncio = 'tenho' | 'preciso'
export type TipoSticker = 'normal' | 'brilhante' | 'escudo' | 'especial'

export interface AnuncioItem {
  sid:   string
  gNum:  number | string
  nome:  string
  qty:   number
  tipo:  TipoSticker
  preco?: number   // só para "tenho" (venda)
}

// Como cada parte quer receber suas figurinhas na troca
export interface PreferenciaEntrega {
  tipo:    'endereco' | 'agencia'
  destino: string   // endereço residencial ou dados da agência
}

export interface PropostaEnviada {
  id:                    string
  matchId:               string
  contraparte:           string
  contraparteAvatar:     string
  contraparteAvatarColor:string
  euOfereco:             number[]
  euRecebo:              number[]
  status:                'pendente' | 'aceita' | 'recusada'
  data:                  string
  minhaEscolha?:         PreferenciaEntrega   // como EU quero receber
  enviarPara?:           PreferenciaEntrega   // onde a contraparte quer receber
}

export interface PropostaRecebida {
  id:              string
  de:              string
  deAvatar:        string
  deAvatarColor:   string
  deCity:          string
  deRating:        number
  deGender:        'M' | 'F'
  eleOferece:      number[]
  elePede:         number[]
  status:          'pendente' | 'aceita' | 'recusada'
  data:            string
  minhaEscolha?:   PreferenciaEntrega   // como EU quero receber (escolho ao aceitar)
  enviarPara?:     PreferenciaEntrega   // onde a outra parte quer receber (revelado após aceitar)
}

export interface CarrinhoItem {
  vendaId:       string
  vendedor:      string
  avatar:        string
  avatarColor:   string
  cidade:        string
  rating:        number
  stickers:      { num: number; nome: string; preco: number; tipo: TipoSticker }[]
}

export interface Pedido {
  id:                  string
  data:                string
  tipo:                'venda' | 'troca' | 'doacao'
  status:              'concluido' | 'pendente' | 'cancelado'
  contraparte:         string
  fig:                 string
  valor?:              number
  enderecoEntrega?:    string   // endereço da contraparte para envio (trocas)
}

export interface UserProfile {
  nome:               string
  email:              string
  cpf:                string
  dataNascimento:     string   // YYYY-MM-DD
  maior18:            boolean
  aceitouTermos:      boolean
  aceitouPrivacidade: boolean
  cep:                string
  uf:                 string
  logradouro:         string
  numero:             string
  complemento:        string
  cidade:             string
}

export function isProfileComplete(): boolean {
  const p = getUserProfile()
  return !!(p.cpf && p.cep && p.logradouro && p.cidade && p.aceitouTermos && p.aceitouPrivacidade)
}

/** Usuário confirmou maioridade — pode usar trocas, vendas e compras */
export function isMaiorDeIdade(): boolean {
  return getUserProfile().maior18 === true
}

// ─── Chaves ───────────────────────────────────────────────────────────────────

// Versão do seed — incrementar aqui força re-seed dos mocks no browser
const SEED_VERSION = '3'

const K = {
  COLADAS:            (id: AlbumId) => `ac_coladas_${id}`,
  ANUNCIOS:           (tipo: TipoAnuncio) => `ac_anuncios_${tipo}`,
  CARRINHO:           'ac_carrinho',
  AUTH:               'ac_auth',
  PROFILE:            'ac_profile',
  PROPS_ENVIADAS:     'ac_props_sent',
  PROPS_RECEBIDAS:    'ac_props_recv',
  PEDIDOS:            'ac_pedidos',
  NOTIFS_VISTAS:      'ac_notifs_seen',
  SEED_VERSION:       'ac_seed_v',
  ACTIVE_ALBUMS:      'ac_active_albums',
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch { return fallback }
}

function write<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

// ─── Álbum ───────────────────────────────────────────────────────────────────

export function getColadas(albumId: AlbumId): string[] {
  return read<string[]>(K.COLADAS(albumId), [])
}
export function saveColadas(albumId: AlbumId, ids: string[]): void {
  write(K.COLADAS(albumId), ids)
}

// ─── Anúncios ─────────────────────────────────────────────────────────────────

export function getAnuncios(tipo: TipoAnuncio): AnuncioItem[] {
  return read<AnuncioItem[]>(K.ANUNCIOS(tipo), [])
}
export function saveAnuncios(tipo: TipoAnuncio, items: AnuncioItem[]): void {
  write(K.ANUNCIOS(tipo), items)
}

// ─── Carrinho ─────────────────────────────────────────────────────────────────

export function getCarrinho(): CarrinhoItem[] {
  return read<CarrinhoItem[]>(K.CARRINHO, [])
}
export function saveCarrinho(items: CarrinhoItem[]): void {
  write(K.CARRINHO, items)
}
export function clearCarrinho(): void {
  write(K.CARRINHO, [])
}

// ─── Auth (mock) ─────────────────────────────────────────────────────────────

export function isLoggedIn(): boolean {
  return read<boolean>(K.AUTH, false)
}
export function setLoggedIn(v: boolean): void {
  write(K.AUTH, v)
}

// ─── Perfil do usuário ────────────────────────────────────────────────────────

export function getUserProfile(): Partial<UserProfile> {
  return read<Partial<UserProfile>>(K.PROFILE, {})
}
export function saveUserProfile(p: Partial<UserProfile>): void {
  write(K.PROFILE, p)
}

// ─── Propostas ───────────────────────────────────────────────────────────────

export function getPropostasEnviadas(): PropostaEnviada[] {
  return read<PropostaEnviada[]>(K.PROPS_ENVIADAS, [])
}
export function savePropostasEnviadas(items: PropostaEnviada[]): void {
  write(K.PROPS_ENVIADAS, items)
}

export function getPropostasRecebidas(): PropostaRecebida[] {
  // Re-seed se versão desatualizada (ex: dados mock antigos no browser)
  if (typeof window !== 'undefined') {
    const storedV = localStorage.getItem(K.SEED_VERSION)
    if (storedV !== SEED_VERSION) {
      localStorage.removeItem(K.PROPS_RECEBIDAS)
      localStorage.setItem(K.SEED_VERSION, SEED_VERSION)
    }
  }
  return read<PropostaRecebida[]>(K.PROPS_RECEBIDAS, MOCK_PROPOSTAS_RECEBIDAS)
}
export function savePropostasRecebidas(items: PropostaRecebida[]): void {
  write(K.PROPS_RECEBIDAS, items)
}

// ─── Pedidos ─────────────────────────────────────────────────────────────────

export function getPedidos(): Pedido[] {
  return read<Pedido[]>(K.PEDIDOS, MOCK_PEDIDOS)
}
export function savePedidos(items: Pedido[]): void {
  write(K.PEDIDOS, items)
}
export function addPedido(p: Pedido): void {
  const prev = getPedidos()
  savePedidos([p, ...prev])
}

// ─── Álbuns ativos ───────────────────────────────────────────────────────────

export function getActiveAlbums(): AlbumId[] {
  return read<AlbumId[]>(K.ACTIVE_ALBUMS, ['copa-2026'])
}
export function saveActiveAlbums(ids: AlbumId[]): void {
  write(K.ACTIVE_ALBUMS, ids)
}

// ─── Notificações vistas ──────────────────────────────────────────────────────

export function getNotifsSeen(): string[] {
  return read<string[]>(K.NOTIFS_VISTAS, [])
}
export function markNotifSeen(id: string): void {
  const prev = getNotifsSeen()
  if (!prev.includes(id)) write(K.NOTIFS_VISTAS, [...prev, id])
}

// ─── Mock data (seeds iniciais) ───────────────────────────────────────────────

const MOCK_PROPOSTAS_RECEBIDAS: PropostaRecebida[] = [
  {
    id: 'pr1',
    de: 'Ana Lima', deAvatar: 'AL', deAvatarColor: 'from-pink-400 to-purple-500',
    deCity: 'Rio de Janeiro, RJ', deRating: 4.9, deGender: 'F',
    eleOferece: [28, 42],
    elePede: [17, 29],
    status: 'pendente',
    data: '04/05/2026',
  },
  {
    id: 'pr2',
    de: 'Pedro S.', deAvatar: 'PS', deAvatarColor: 'from-orange-400 to-red-500',
    deCity: 'Curitiba, PR', deRating: 4.6, deGender: 'M',
    eleOferece: [19, 65, 88],
    elePede: [22, 45, 67],
    status: 'pendente',
    data: '03/05/2026',
  },
  {
    id: 'pr3',
    de: 'Julia F.', deAvatar: 'JF', deAvatarColor: 'from-teal-400 to-green-500',
    deCity: 'Belo Horizonte, MG', deRating: 5.0, deGender: 'F',
    eleOferece: [40, 76, 78],
    elePede: [33, 89, 22],
    status: 'aceita',
    data: '01/05/2026',
    // Julia escolheu agência — você precisa enviar para lá
    enviarPara: {
      tipo: 'agencia',
      destino: 'Ponto Mercado Envios — Savassi · Av. do Contorno, 6594 · Savassi · Belo Horizonte/MG · CEP 30110-042 · Seg–Sex 9h–20h · Sáb 9h–14h',
    },
  },
]

const MOCK_PEDIDOS: Pedido[] = [
  { id: 'p1', data: '02/05/2026', tipo: 'troca',  status: 'concluido', contraparte: 'Ana Lima',    fig: 'BRA-14 · Vinicius Jr.', enderecoEntrega: 'Rua das Flores, 12 · Rio de Janeiro/RJ · CEP 20040-010' },
  { id: 'p2', data: '01/05/2026', tipo: 'venda',  status: 'concluido', contraparte: 'Pedro S.',    fig: 'ARG-17 · Messi',        valor: 12, enderecoEntrega: 'Av. Batel, 800 · Curitiba/PR · CEP 80420-090' },
  { id: 'p3', data: '30/04/2026', tipo: 'doacao', status: 'concluido', contraparte: 'Julia F.',    fig: 'ESP-15 · Yamal' },
  { id: 'p4', data: '29/04/2026', tipo: 'troca',  status: 'concluido', contraparte: 'Marcos T.',   fig: 'FRA-20 · Mbappé',       enderecoEntrega: 'Rua Augusta, 500 · São Paulo/SP · CEP 01305-000' },
  { id: 'p5', data: '28/04/2026', tipo: 'venda',  status: 'concluido', contraparte: 'Fernanda R.', fig: 'ENG-18 · Kane',         valor: 3,  enderecoEntrega: 'Rua XV de Novembro, 200 · Florianópolis/SC · CEP 88010-400' },
  { id: 'p6', data: '26/04/2026', tipo: 'troca',  status: 'pendente',  contraparte: 'Carlos M.',   fig: 'BRA-5 · Endrick',       enderecoEntrega: 'Av. Paulista, 1000 · São Paulo/SP · CEP 01310-100' },
  { id: 'p7', data: '25/04/2026', tipo: 'venda',  status: 'pendente',  contraparte: 'Luciana T.',  fig: 'ARG-10 · Di María',     valor: 8,  enderecoEntrega: 'Rua Sete de Setembro, 45 · Porto Alegre/RS · CEP 90010-190' },
]

export const MOCK_NOTIFICACOES = [
  { id: 'n1', icon: '🔁', titulo: 'Nova proposta de troca',     desc: 'Ana Lima quer trocar figurinhas com você.',        data: '04/05/2026', link: '/propostas' },
  { id: 'n2', icon: '🔁', titulo: 'Nova proposta de troca',     desc: 'Pedro S. enviou uma proposta de troca.',           data: '03/05/2026', link: '/propostas' },
  { id: 'n3', icon: '✅', titulo: 'Proposta aceita!',            desc: 'Julia F. aceitou sua proposta. Prepare o envio.',  data: '02/05/2026', link: '/propostas' },
  { id: 'n4', icon: '⭐', titulo: 'Nova avaliação recebida',    desc: 'Marcos T. avaliou você com 5 estrelas.',           data: '01/05/2026', link: '/conta' },
  { id: 'n5', icon: '📦', titulo: 'Pedido enviado',             desc: 'Sua compra de Fernanda R. foi enviada.',           data: '30/04/2026', link: '/conta?s=historico' },
  { id: 'n6', icon: '🏆', titulo: 'Novo badge desbloqueado!',   desc: 'Você ganhou o badge "Top Trocador".',              data: '28/04/2026', link: '/conta?s=gamificacao' },
]
