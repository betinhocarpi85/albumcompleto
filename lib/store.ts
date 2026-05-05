/**
 * lib/store.ts
 * Camada de persistência local (localStorage).
 * Quando o banco de dados estiver pronto, basta trocar as implementações
 * das funções — a assinatura pública não muda.
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type AlbumId = 'copa-2026' | 'brasileirao-masc-2025' | 'brasileirao-fem-2025'
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
  id:          string
  data:        string
  tipo:        'venda' | 'troca' | 'doacao'
  status:      'concluido' | 'pendente' | 'cancelado'
  contraparte: string
  fig:         string
  valor?:      number
}

// ─── Chaves ───────────────────────────────────────────────────────────────────

const K = {
  COLADAS:            (id: AlbumId) => `ac_coladas_${id}`,
  ANUNCIOS:           (tipo: TipoAnuncio) => `ac_anuncios_${tipo}`,
  CARRINHO:           'ac_carrinho',
  AUTH:               'ac_auth',
  PROPS_ENVIADAS:     'ac_props_sent',
  PROPS_RECEBIDAS:    'ac_props_recv',
  PEDIDOS:            'ac_pedidos',
  NOTIFS_VISTAS:      'ac_notifs_seen',
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

// ─── Propostas ───────────────────────────────────────────────────────────────

export function getPropostasEnviadas(): PropostaEnviada[] {
  return read<PropostaEnviada[]>(K.PROPS_ENVIADAS, [])
}
export function savePropostasEnviadas(items: PropostaEnviada[]): void {
  write(K.PROPS_ENVIADAS, items)
}

export function getPropostasRecebidas(): PropostaRecebida[] {
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
    eleOferece: [28, 42, 53],
    elePede: [17, 29],
    status: 'pendente',
    data: '04/05/2026',
  },
  {
    id: 'pr2',
    de: 'Pedro S.', deAvatar: 'PS', deAvatarColor: 'from-orange-400 to-red-500',
    deCity: 'Curitiba, PR', deRating: 4.6, deGender: 'M',
    eleOferece: [19, 65],
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
  },
]

const MOCK_PEDIDOS: Pedido[] = [
  { id: 'p1', data: '02/05/2026', tipo: 'troca',  status: 'concluido', contraparte: 'Ana Lima',   fig: 'BRA-14 · Vinicius Jr.' },
  { id: 'p2', data: '01/05/2026', tipo: 'venda',  status: 'concluido', contraparte: 'Pedro S.',   fig: 'ARG-17 · Messi',        valor: 12 },
  { id: 'p3', data: '30/04/2026', tipo: 'doacao', status: 'concluido', contraparte: 'Julia F.',   fig: 'ESP-15 · Yamal' },
  { id: 'p4', data: '29/04/2026', tipo: 'troca',  status: 'concluido', contraparte: 'Marcos T.',  fig: 'FRA-20 · Mbappé' },
  { id: 'p5', data: '28/04/2026', tipo: 'venda',  status: 'concluido', contraparte: 'Fernanda R.',fig: 'ENG-18 · Kane',          valor: 3 },
  { id: 'p6', data: '26/04/2026', tipo: 'troca',  status: 'pendente',  contraparte: 'Carlos M.',  fig: 'BRA-5 · Endrick' },
  { id: 'p7', data: '25/04/2026', tipo: 'venda',  status: 'pendente',  contraparte: 'Luciana T.', fig: 'ARG-10 · Di María',      valor: 8 },
]

export const MOCK_NOTIFICACOES = [
  { id: 'n1', icon: '🔁', titulo: 'Nova proposta de troca',     desc: 'Ana Lima quer trocar figurinhas com você.',        data: '04/05/2026', link: '/propostas' },
  { id: 'n2', icon: '🔁', titulo: 'Nova proposta de troca',     desc: 'Pedro S. enviou uma proposta de troca.',           data: '03/05/2026', link: '/propostas' },
  { id: 'n3', icon: '✅', titulo: 'Proposta aceita!',            desc: 'Julia F. aceitou sua proposta. Prepare o envio.',  data: '02/05/2026', link: '/propostas' },
  { id: 'n4', icon: '⭐', titulo: 'Nova avaliação recebida',    desc: 'Marcos T. avaliou você com 5 estrelas.',           data: '01/05/2026', link: '/conta' },
  { id: 'n5', icon: '📦', titulo: 'Pedido enviado',             desc: 'Sua compra de Fernanda R. foi enviada.',           data: '30/04/2026', link: '/conta?s=historico' },
  { id: 'n6', icon: '🏆', titulo: 'Novo badge desbloqueado!',   desc: 'Você ganhou o badge "Top Trocador".',              data: '28/04/2026', link: '/conta?s=gamificacao' },
]
