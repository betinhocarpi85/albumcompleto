import { describe, expect, it } from "vitest"
import { buildMatchResultFromAnuncios } from "../lib/match-engine"

describe("buildMatchResultFromAnuncios", () => {
  it("monta trocas quando ha intersecao dos dois lados", () => {
    const result = buildMatchResultFromAnuncios({
      myUserId: "me",
      myTenho: [{ user_id: "me", g_num: 10, preco: null, sticker_tipo: "normal" }],
      myPreciso: [{ user_id: "me", g_num: 20, preco: null, sticker_tipo: "normal" }],
      othersTenho: [{ user_id: "u1", g_num: 20, preco: 2, sticker_tipo: "normal" }],
      othersPreciso: [{ user_id: "u1", g_num: 10, preco: null, sticker_tipo: "normal" }],
      profiles: [{ id: "u1", nome: "Ana Silva", cidade: "SP" }],
    })

    expect(result.trocas).toHaveLength(1)
    expect(result.trocas[0].id).toBe("u1")
    expect(result.trocas[0].tem_para_mim).toEqual([20])
    expect(result.trocas[0].eu_tenho_para).toEqual([10])
  })

  it("separa vendas e doacoes pelo preco", () => {
    const result = buildMatchResultFromAnuncios({
      myUserId: "me",
      myTenho: [],
      myPreciso: [],
      othersTenho: [
        { user_id: "u2", g_num: 30, preco: 5, sticker_tipo: "brilhante" },
        { user_id: "u2", g_num: 31, preco: null, sticker_tipo: "normal" },
      ],
      othersPreciso: [],
      profiles: [{ id: "u2", nome: "Carlos", cidade: "RJ" }],
    })

    expect(result.vendas).toHaveLength(1)
    expect(result.vendas[0].items[0]).toEqual({ gnum: 30, preco: 5, tipo: "brilhante" })
    expect(result.doacoes).toHaveLength(1)
    expect(result.doacoes[0].gnums).toEqual([31])
  })
})
