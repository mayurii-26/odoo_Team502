// ============================================================
// DealFlow360 - Socket.IO Client Connection Manager
// ============================================================
import { io, Socket } from 'socket.io-client'
import { ChatMessage } from '../components/types'

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace('localhost:8000', '127.0.0.1:8000')

let socket: Socket | null = null

export function getChatSocket(): Socket {
  if (!socket) {
    socket = io(BACKEND_URL, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      timeout: 20000,
    })

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected to chat server:', socket?.id)
    })

    socket.on('disconnect', (reason) => {
      console.log('[Socket.IO] Disconnected:', reason)
    })

    socket.on('connect_error', (error) => {
      console.warn('[Socket.IO] Connection error:', error.message)
    })
  }

  if (!socket.connected) {
    socket.connect()
  }

  return socket
}

export function joinChatUser(userId: number, email?: string) {
  const s = getChatSocket()
  if (userId > 0) {
    s.emit('join_user', { user_id: userId, email })
  }
}

export function emitChatMessage(payload: {
  sender_id: number
  receiver_id: number
  message_type: 'text' | 'image' | 'pdf'
  content?: string
  file_url?: string
  file_name?: string
  file_size?: number
  mime_type?: string
  temp_id?: string
}, callback?: (response: any) => void) {
  const s = getChatSocket()
  s.emit('send_message', payload, callback)
}

export function emitTypingStatus(senderId: number, receiverId: number, isTyping: boolean) {
  const s = getChatSocket()
  if (isTyping) {
    s.emit('typing', { sender_id: senderId, receiver_id: receiverId })
  } else {
    s.emit('stop_typing', { sender_id: senderId, receiver_id: receiverId })
  }
}

export function emitMarkRead(conversationId: number, userId: number) {
  const s = getChatSocket()
  s.emit('mark_read', { conversation_id: conversationId, user_id: userId })
}

export function disconnectChatSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
