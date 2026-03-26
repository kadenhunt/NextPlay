import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { useLeague } from '@/providers/LeagueProvider'
import { getChatMessages, postChatMessage } from '@/services/api/nextplayApi'
import type { ChatMessage } from '@/types/models'
import Button from '@/components/Button'
import StatusBadge from '@/components/StatusBadge'

const POLL_MS = 3000

export default function ChatPage() {
  const { id: leagueIdParam } = useParams()
  const leagueId = leagueIdParam ?? ''

  const { user } = useAuth()
  const userId = user?.id

  const { league } = useLeague()

  const [text, setText] = useState('')
  const [banner, setBanner] = useState<string | null>(null)

  const messagesQuery = useQuery({
    queryKey: ['chat', leagueId, userId],
    queryFn: () => getChatMessages(leagueId, userId!),
    enabled: Boolean(leagueId && userId && league),
    refetchInterval: POLL_MS,
  })

  const messages = messagesQuery.data ?? []

  const groupedMessages: ChatMessage[] = useMemo(() => {
    return messages
  }, [messages])

  const sendMutation = useMutation({
    mutationFn: () => postChatMessage(leagueId, userId!, text),
    onSuccess: async () => {
      setText('')
      setBanner('Message sent.')
      window.setTimeout(() => setBanner(null), 1500)
    },
    onError: (err) => setBanner(err instanceof Error ? err.message : 'Failed to send message'),
  })

  useEffect(() => {
    return () => setBanner(null)
  }, [])

  const onSend = () => {
    const trimmed = text.trim()
    if (!trimmed) {
      setBanner('Message cannot be empty.')
      return
    }
    sendMutation.mutate()
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Chat</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-400">
              {league ? <StatusBadge state={league.state} /> : null}
              <span>League chat feed.</span>
            </div>
          </div>
          {banner ? (
            <div className="text-sm text-emerald-400">{banner}</div>
          ) : null}
        </div>
      </div>

      {messagesQuery.isLoading ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 text-sm text-zinc-400">
          Loading messages…
        </div>
      ) : messagesQuery.isError ? (
        <div className="rounded-lg border border-red-500/20 bg-red-500/[0.07] p-4 text-sm text-red-400">
          {messagesQuery.error instanceof Error
            ? messagesQuery.error.message
            : 'Failed to load messages.'}
        </div>
      ) : messages.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 text-sm text-zinc-400">
          No messages yet. Be the first to say hello!
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <div className="flex flex-col gap-3">
            {groupedMessages.map((m) => (
              <div key={m.id} className="rounded-md border border-zinc-800/60 p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="text-sm font-medium">{m.displayName}</div>
                  <div className="text-xs text-zinc-500">
                    {new Date(m.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="mt-2 whitespace-pre-wrap text-sm text-zinc-200">
                  {m.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <label className="text-sm font-medium" htmlFor="chatText">
              Send a message
            </label>
            <textarea
              id="chatText"
              className="min-h-[92px] w-full resize-y rounded-xl border border-zinc-700/60 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-red-500/60"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type your message…"
            />
          </div>

          <Button
            onClick={onSend}
            disabled={sendMutation.isPending || messagesQuery.isLoading || !league}
            isLoading={sendMutation.isPending}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}


