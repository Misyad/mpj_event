import { NextRequest, NextResponse } from 'next/server'
import { createAiTextStream, normalizeAiMessages, type AiChatContext } from '@/lib/server/ai-chat'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status })
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const messages = normalizeAiMessages(payload?.messages)
    const context = (payload?.context && typeof payload.context === 'object' ? payload.context : {}) as AiChatContext

    if (messages.length === 0) return jsonError('Pesan chat wajib diisi')
    if (messages[messages.length - 1]?.role !== 'user') return jsonError('Pesan terakhir harus berasal dari user')

    const stream = await createAiTextStream(request, messages, context)

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal memproses chat AI'
    const status = message.includes('OPENAI_API_KEY') ? 503 : 500
    return jsonError(message, status)
  }
}
