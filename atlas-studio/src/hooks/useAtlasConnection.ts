import { useCallback, useEffect, useRef, useState } from 'react'
import {
  StudioClientMessage,
  StudioServerMessage,
  StudioSnapshot,
  STUDIO_WS_URL,
} from '../types/protocol'

type ConnectionState = 'connecting' | 'connected' | 'disconnected'

const defaultSnapshot: StudioSnapshot = {
  status: 'idle',
  agents: [],
  tasks: [],
  memory: { shortTerm: 0, longTerm: 0, knowledgeGraph: 0 },
  world: { position: { x: 0, y: 0, z: 0 }, confidence: 0, objects: [] },
  logs: ['[INFO] Atlas Studio started', '[INFO] Connecting to runtime...'],
}

export function useAtlasConnection() {
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting')
  const [snapshot, setSnapshot] = useState<StudioSnapshot>(defaultSnapshot)
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const send = useCallback((message: StudioClientMessage) => {
    const socket = socketRef.current
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message))
    }
  }, [])

  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return

    setConnectionState('connecting')
    const socket = new WebSocket(STUDIO_WS_URL)
    socketRef.current = socket

    socket.onopen = () => {
      setConnectionState('connected')
      send({ type: 'get_snapshot' })
    }

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as StudioServerMessage
        if (message.type === 'snapshot') {
          setSnapshot(message.payload)
        } else if (message.type === 'event') {
          setSnapshot((prev) => ({
            ...prev,
            logs: [...prev.logs, message.payload.message].slice(-200),
          }))
        }
      } catch {
        // ignore malformed messages
      }
    }

    socket.onclose = () => {
      setConnectionState('disconnected')
      setSnapshot((prev) => ({
        ...prev,
        status: 'idle',
        logs: [...prev.logs, '[WARN] Disconnected from Atlas runtime'].slice(-200),
      }))
      reconnectTimer.current = setTimeout(connect, 3000)
    }

    socket.onerror = () => {
      socket.close()
    }
  }, [send])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      socketRef.current?.close()
    }
  }, [connect])

  const startRuntime = useCallback(() => send({ type: 'start_runtime' }), [send])
  const stopRuntime = useCallback(() => send({ type: 'stop_runtime' }), [send])
  const refresh = useCallback(() => send({ type: 'get_snapshot' }), [send])

  return {
    connectionState,
    snapshot,
    startRuntime,
    stopRuntime,
    refresh,
  }
}
