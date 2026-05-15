import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminAuth } from '@/lib/admin-auth'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdminAuth()) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const body   = await request.json()
  const sb     = createAdminClient()

  const { error } = await sb.from('bancas').update({
    ...body,
    updated_at: new Date().toISOString(),
  }).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdminAuth()) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const sb     = createAdminClient()

  const { error } = await sb.from('bancas').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// Incrementa contador de trocas (chamado quando proposta é aceita na banca)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id }    = await params
  const { action } = await request.json()
  if (action !== 'incrementar_troca') return NextResponse.json({ error: 'ação inválida' }, { status: 400 })

  const sb = createAdminClient()
  // Incrementa via update atômico
  const { data: atual } = await sb.from('bancas').select('total_trocas').eq('id', id).single()
  if (atual) {
    await sb.from('bancas').update({ total_trocas: (atual.total_trocas ?? 0) + 1 }).eq('id', id)
  }
  return NextResponse.json({ ok: true })
}
