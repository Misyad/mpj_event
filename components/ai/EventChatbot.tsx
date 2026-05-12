'use client'

import { FormEvent, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Bot, Loader2, MessageCircle, RotateCcw, Send, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const quickPrompts = [
  'Event apa yang sedang aktif?',
  'Bagaimana cara daftar event UMUM?',
  'Cek status tiket saya',
]

function createMessage(role: ChatMessage['role'], content: string): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    content,
  }
}

export function EventChatbot() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage('assistant', 'Assalamualaikum. Saya Asisten MPJ Event. Saya bisa bantu info event, pendaftaran, tiket, pembayaran, sertifikat, dan panduan operasional.'),
  ])
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const apiMessages = useMemo(
    () => messages
      .filter((message) => message.content.trim())
      .slice(-12)
      .map((message) => ({ role: message.role, content: message.content })),
    [messages],
  )

  async function submitPrompt(value: string) {
    const prompt = value.trim()
    if (!prompt || loading) return

    const userMessage = createMessage('user', prompt)
    const assistantMessage = createMessage('assistant', '')
    setMessages((current) => [...current, userMessage, assistantMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...apiMessages, { role: 'user', content: prompt }],
          context: { pathname },
        }),
      })

      if (!response.ok || !response.body) {
        const payload = await response.json().catch(() => null) as { error?: string } | null
        throw new Error(payload?.error || 'Asisten AI belum bisa menjawab.')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      async function readStream(currentContent: string): Promise<void> {
        const { done, value } = await reader.read()
        if (done) return
        const nextContent = currentContent + decoder.decode(value, { stream: true })
        setMessages((current) => current.map((message) => (
          message.id === assistantMessage.id
            ? { ...message, content: nextContent }
            : message
        )))
        await readStream(nextContent)
      }

      await readStream('')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Asisten AI belum bisa menjawab.'
      setMessages((current) => current.map((item) => (
        item.id === assistantMessage.id
          ? { ...item, content: `Maaf, ${message}` }
          : item
      )))
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void submitPrompt(input)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
      {open && (
        <section className="mb-3 flex h-[min(620px,calc(100vh-7rem))] w-[calc(100vw-2rem)] max-w-[390px] flex-col overflow-hidden rounded-2xl border border-[#d6e3d9] bg-white shadow-2xl">
          <header className="flex items-center justify-between border-b border-[#edf2ee] bg-[#123d2d] px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-[#C9A227] text-[#123d2d]">
                <Bot className="size-4" />
              </div>
              <div>
                <p className="text-sm font-extrabold leading-tight">Asisten MPJ Event</p>
                <p className="text-[11px] font-medium text-white/55">Read-only operational assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Reset chat"
                className="flex size-8 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white"
                onClick={() => setMessages([createMessage('assistant', 'Chat sudah direset. Ada yang bisa saya bantu tentang MPJ Event?')])}
              >
                <RotateCcw className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Tutup chat"
                className="flex size-8 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white"
                onClick={() => setOpen(false)}
              >
                <X className="size-4" />
              </button>
            </div>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-[#f5f8f5] p-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start',
                )}
              >
                <div
                  className={cn(
                    'max-w-[86%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm',
                    message.role === 'user'
                      ? 'rounded-br-md bg-[#123d2d] text-white'
                      : 'rounded-bl-md border border-[#e5ece7] bg-white text-[#173d30]',
                  )}
                >
                  {message.content ? (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <span className="inline-flex items-center gap-2 text-[#6c7c72]">
                      <Loader2 className="size-3.5 animate-spin" />
                      Menyusun jawaban...
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-[#e5ece7] bg-white p-3">
            <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={loading}
                  onClick={() => void submitPrompt(prompt)}
                  className="shrink-0 rounded-full border border-[#d7e3db] bg-[#f7faf8] px-3 py-1.5 text-xs font-semibold text-[#1B4332] transition hover:border-[#C9A227] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    void submitPrompt(input)
                  }
                }}
                placeholder="Tulis pertanyaan..."
                rows={2}
                className="max-h-28 min-h-11 flex-1 resize-none rounded-xl border border-[#d7e3db] bg-white px-3 py-2 text-sm text-[#173d30] outline-none transition placeholder:text-[#8a9a91] focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/20"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                aria-label="Kirim pesan"
                className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#C9A227] text-[#123d2d] shadow-sm transition hover:bg-[#d7b53e] disabled:cursor-not-allowed disabled:opacity-55"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </button>
            </form>
          </div>
        </section>
      )}

      <button
        type="button"
        aria-label={open ? 'Tutup asisten MPJ Event' : 'Buka asisten MPJ Event'}
        onClick={() => setOpen((current) => !current)}
        className="flex size-14 items-center justify-center rounded-2xl bg-[#123d2d] text-white shadow-xl ring-1 ring-black/10 transition hover:-translate-y-0.5 hover:bg-[#1B4332]"
      >
        {open ? <X className="size-5" /> : <MessageCircle className="size-6 text-[#C9A227]" />}
      </button>
    </div>
  )
}
