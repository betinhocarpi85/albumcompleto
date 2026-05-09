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
  telefone:           string   // WhatsApp/telefone para contato em trocas e vendas
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
  return read<PropostaRecebida[]>(K.PROPS_RECEBIDAS, [])
}
export function savePropostasRecebidas(items: PropostaRecebida[]): void {
  write(K.PROPS_RECEBIDAS, items)
}

// ─── Pedidos ─────────────────────────────────────────────────────────────────

export function getPedidos(): Pedido[] {
  return read<Pedido[]>(K.PEDIDOS, [])
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

// ─── Notificações (sem mocks — virão do banco futuramente) ───────────────────

export const MOCK_NOTIFICACOES: { id: string; icon: string; titulo: string; desc: string; data: string; link: string }[] = []
