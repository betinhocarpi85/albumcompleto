type BaseAnuncio = {
  user_id: string
  g_num: number | null
  preco: number | null
  sticker_tipo: string | null
}

type ProfileLite = {
  id: string
  nome: string | null
  cidade: string | null
}

export interface MatchTroca {
  id: string
  nome: string
  cidade: string
  tem_para_mim: number[]
  eu_tenho_para: number[]
}

export interface MatchVenda {
  id: string
  nome: string
  cidade: string
  items: { gnum: number; preco: number; tipo: string }[]
}

export interface MatchDoacao {
  id: string
  nome: string
  cidade: string
  gnums: number[]
}

export interface MatchResult {
  trocas: MatchTroca[]
  vendas: MatchVenda[]
  doacoes: MatchDoacao[]
}

const DEFAULT_MATCHES: MatchResult = { trocas: [], vendas: [], doacoes: [] }

function uniqSorted(values: number[]): number[] {
  return [...new Set(values)].sort((a, b) => a - b)
}

function profileOf(map: Map<string, ProfileLite>, userId: string) {
  const p = map.get(userId)
  return {
    nome: p?.nome ?? "Usuário",
    cidade: p?.cidade ?? "",
  }
}

export function buildMatchResultFromAnuncios(params: {
  myUserId: string
  myTenho: BaseAnuncio[]
  myPreciso: BaseAnuncio[]
  othersTenho: BaseAnuncio[]
  othersPreciso: BaseAnuncio[]
  profiles: ProfileLite[]
}): MatchResult {
  const { myUserId, myTenho, myPreciso, othersTenho, othersPreciso, profiles } = params
  if (!myUserId) return DEFAULT_MATCHES

  const profileMap = new Map(profiles.map((p) => [p.id, p]))
  const myTenhoSet = new Set(myTenho.map((a) => a.g_num).filter((n): n is number => typeof n === "number"))
  const myPrecisoSet = new Set(myPreciso.map((a) => a.g_num).filter((n): n is number => typeof n === "number"))

  const users = new Set<string>()
  for (const a of othersTenho) users.add(a.user_id)
  for (const a of othersPreciso) users.add(a.user_id)

  const trocas: MatchTroca[] = []
  const vendas: MatchVenda[] = []
  const doacoes: MatchDoacao[] = []

  for (const userId of users) {
    if (userId === myUserId) continue

    const have = othersTenho.filter((a) => a.user_id === userId && typeof a.g_num === "number")
    const need = othersPreciso.filter((a) => a.user_id === userId && typeof a.g_num === "number")

    const haveNums = uniqSorted(have.map((a) => a.g_num as number))
    const needNums = uniqSorted(need.map((a) => a.g_num as number))

    const temParaMim = haveNums.filter((n) => myPrecisoSet.has(n))
    const euTenhoPara = needNums.filter((n) => myTenhoSet.has(n))
    const who = profileOf(profileMap, userId)

    if (temParaMim.length > 0 && euTenhoPara.length > 0) {
      trocas.push({
        id: userId,
        nome: who.nome,
        cidade: who.cidade,
        tem_para_mim: temParaMim,
        eu_tenho_para: euTenhoPara,
      })
    }

    const vendaItems = have
      .filter((a) => typeof a.preco === "number" && a.preco > 0)
      .map((a) => ({
        gnum: a.g_num as number,
        preco: a.preco as number,
        tipo: a.sticker_tipo ?? "normal",
      }))

    if (vendaItems.length > 0) {
      vendas.push({ id: userId, nome: who.nome, cidade: who.cidade, items: vendaItems })
    }

    const doacaoNums = uniqSorted(
      have
        .filter((a) => !(typeof a.preco === "number" && a.preco > 0))
        .map((a) => a.g_num as number)
    )
    if (doacaoNums.length > 0) {
      doacoes.push({ id: userId, nome: who.nome, cidade: who.cidade, gnums: doacaoNums })
    }
  }

  return { trocas, vendas, doacoes }
}
