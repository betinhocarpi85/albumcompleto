import { NextResponse } from 'next/server'

// Este endpoint foi desativado por segurança
export async function GET() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}
