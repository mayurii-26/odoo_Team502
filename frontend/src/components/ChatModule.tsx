'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import styles from './ChatModule.module.css'
import { UserSession, UserAccount, ChatUser, ChatMessage, ChatConversation } from './types'
import {
  getChatSocket,
  joinChatUser,
  emitChatMessage,
  emitTypingStatus,
  emitMarkRead,
} from '../lib/chatSocket'

const resolveApiBase = () => {
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
  return url.replace('localhost:8000', '127.0.0.1:8000')
}
const API_BASE = resolveApiBase()

interface ChatModuleProps {
  currentUser: UserSession
  users?: UserAccount[]
  onShowToast: (msg: string) => void
  initialRecipientEmail?: string
}

export default function ChatModule({
  currentUser,
  users: propUsers = [],
  onShowToast,
  initialRecipientEmail,
}: ChatModuleProps) {
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([])
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [activeRecipient, setActiveRecipient] = useState<ChatUser | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [recipientTyping, setRecipientTyping] = useState(false)
  const [lightboxImgUrl, setLightboxImgUrl] = useState<string | null>(null)
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false)

  // Pending attachment before dispatch
  const [pendingAttachment, setPendingAttachment] = useState<{
    file: File
    type: 'image' | 'pdf'
    previewUrl: string
    name: string
    size: number
  } | null>(null)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const pdfInputRef = useRef<HTMLInputElement | null>(null)
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Determine current user's DB ID from email or currentUser session
  const activeUserId = useMemo(() => {
    if (typeof currentUser?.id === 'number' && currentUser.id > 0) {
      return currentUser.id
    }
    if (typeof currentUser?.id === 'string') {
      const parsed = parseInt(currentUser.id.replace(/\D/g, ''), 10)
      if (!isNaN(parsed) && parsed > 0 && !currentUser.id.includes('-')) return parsed
    }
    const allKnown = [...chatUsers, ...propUsers]
    const match = allKnown.find(
      u => u.email && currentUser?.email && u.email.toLowerCase() === currentUser.email.toLowerCase()
    )
    if (match) {
      return typeof match.id === 'number' ? match.id : parseInt(String(match.id).replace(/\D/g, '') || '1', 10)
    }
    return 1
  }, [currentUser?.id, currentUser?.email, chatUsers, propUsers])

  // ── 1. Fetch Users & Conversations on Mount ─────────────────
  useEffect(() => {
    let isMounted = true

    async function loadData() {
      try {
        let loadedUsers: ChatUser[] = []
        const usersRes = await fetch(`${API_BASE}/api/v1/chat/users`)
        if (usersRes.ok) {
          loadedUsers = await usersRes.json()
          if (isMounted) setChatUsers(loadedUsers)
        } else if (propUsers.length > 0 && isMounted) {
          loadedUsers = propUsers.map(u => ({
            id: typeof u.id === 'number' ? u.id : parseInt(String(u.id).replace(/\D/g, '') || '1', 10),
            name: u.name || u.email,
            email: u.email,
            role: u.role,
            status: 'ACTIVE',
          }))
          setChatUsers(loadedUsers)
        }

        const convsRes = await fetch(`${API_BASE}/api/v1/chat/conversations?user_id=${activeUserId}`)
        let convsData: ChatConversation[] = []
        if (convsRes.ok) {
          convsData = await convsRes.json()
          if (isMounted) setConversations(convsData)
        }

        if (isMounted) {
          if (initialRecipientEmail) {
            const matchedConv = convsData.find(
              c => c.recipient.email.toLowerCase() === initialRecipientEmail.toLowerCase()
            )
            if (matchedConv) {
              setActiveRecipient(matchedConv.recipient)
            } else {
              const matchedUser = loadedUsers.find(
                u => u.email.toLowerCase() === initialRecipientEmail.toLowerCase()
              )
              if (matchedUser) setActiveRecipient(matchedUser)
            }
          } else if (convsData.length > 0) {
            setActiveRecipient(convsData[0].recipient)
          } else if (loadedUsers.length > 0) {
            const otherUser = loadedUsers.find(u => u.id !== activeUserId && u.email.toLowerCase() !== currentUser.email.toLowerCase()) || loadedUsers[0]
            if (otherUser) setActiveRecipient(otherUser)
          }
        }
      } catch (err) {
        console.warn('Chat API initial load notice (using fallback):', err)
        if (isMounted && propUsers.length > 0) {
          const fallbackUsers: ChatUser[] = propUsers.map(u => ({
            id: typeof u.id === 'number' ? u.id : parseInt(String(u.id).replace(/\D/g, '') || '1', 10),
            name: u.name || u.email,
            email: u.email,
            role: u.role,
            status: 'ACTIVE',
          }))
          setChatUsers(fallbackUsers)
          const other = fallbackUsers.find(u => u.email.toLowerCase() !== currentUser.email.toLowerCase())
          if (other) setActiveRecipient(other)
        }
      }
    }

    loadData()
    return () => {
      isMounted = false
    }
  }, [activeUserId, initialRecipientEmail, currentUser.email, propUsers])

  // ── 2. Socket.IO Real-Time Subscriptions ─────────────────────
  useEffect(() => {
    if (activeUserId <= 0) return

    // Register active user room on Socket.IO
    joinChatUser(activeUserId, currentUser.email)
    const socket = getChatSocket()

    const handleReceiveMessage = (msg: ChatMessage) => {
      // Check if message belongs to the current open chat
      if (
        activeRecipient &&
        ((msg.sender_id === activeRecipient.id && msg.receiver_id === activeUserId) ||
          (msg.sender_id === activeUserId && msg.receiver_id === activeRecipient.id))
      ) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev
          return [...prev, msg]
        })

        // Mark as read immediately if window is open
        if (msg.receiver_id === activeUserId) {
          emitMarkRead(msg.conversation_id, activeUserId)
        }
      }

      // Update conversations list in sidebar
      setConversations(prev => {
        const otherId = msg.sender_id === activeUserId ? msg.receiver_id : msg.sender_id
        const existingIdx = prev.findIndex(
          c => c.recipient.id === otherId
        )

        let lastSnippet = msg.content || ''
        if (msg.message_type === 'image') lastSnippet = '📷 Photo'
        if (msg.message_type === 'pdf') lastSnippet = `📄 Document: ${msg.file_name || 'PDF'}`

        if (existingIdx >= 0) {
          const updated = [...prev]
          const conv = updated[existingIdx]
          const isCurrentChat = activeRecipient?.id === otherId
          updated[existingIdx] = {
            ...conv,
            last_message: lastSnippet,
            last_message_type: msg.message_type,
            last_message_at: msg.created_at,
            unread_count: isCurrentChat ? 0 : (conv.unread_count || 0) + 1,
          }
          // Move to top of list
          const [moved] = updated.splice(existingIdx, 1)
          return [moved, ...updated]
        } else {
          // New conversation entry
          const senderUser = chatUsers.find(u => u.id === otherId)
          if (!senderUser) return prev
          const newConv: ChatConversation = {
            id: msg.conversation_id,
            user1_id: Math.min(activeUserId, otherId),
            user2_id: Math.max(activeUserId, otherId),
            last_message: lastSnippet,
            last_message_type: msg.message_type,
            last_message_at: msg.created_at,
            unread_count: activeRecipient?.id === otherId ? 0 : 1,
            recipient: senderUser,
          }
          return [newConv, ...prev]
        }
      })
    }

    const handleMessageSent = (msg: ChatMessage) => {
      setMessages(prev => {
        // Reconcile optimistic message
        if (msg.temp_id) {
          return prev.map(m => (m.temp_id === msg.temp_id ? msg : m))
        }
        if (!prev.some(m => m.id === msg.id)) {
          return [...prev, msg]
        }
        return prev
      })
    }

    const handleUserTyping = (data: { user_id: number; is_typing: boolean }) => {
      if (activeRecipient && data.user_id === activeRecipient.id) {
        setRecipientTyping(data.is_typing)
      }
    }

    const handleMessagesRead = (data: { conversation_id: number; read_by_user_id: number }) => {
      setMessages(prev =>
        prev.map(m => (m.receiver_id === data.read_by_user_id ? { ...m, is_read: true } : m))
      )
    }

    socket.on('receive_message', handleReceiveMessage)
    socket.on('message_sent', handleMessageSent)
    socket.on('user_typing', handleUserTyping)
    socket.on('messages_read', handleMessagesRead)

    return () => {
      socket.off('receive_message', handleReceiveMessage)
      socket.off('message_sent', handleMessageSent)
      socket.off('user_typing', handleUserTyping)
      socket.off('messages_read', handleMessagesRead)
    }
  }, [activeUserId, activeRecipient, currentUser.email, chatUsers])

  // ── 3. Fetch Message History when Active Recipient Changes ──
  useEffect(() => {
    if (!activeRecipient || activeUserId <= 0) return

    let isMounted = true
    setIsLoadingMessages(true)

    async function loadMessages() {
      try {
        const res = await fetch(
          `${API_BASE}/api/v1/chat/messages?user1_id=${activeUserId}&user2_id=${activeRecipient!.id}`
        )
        if (res.ok && isMounted) {
          const data: ChatMessage[] = await res.json()
          setMessages(data)

          // Mark unread messages in this conversation as read
          const conv = conversations.find(c => c.recipient.id === activeRecipient!.id)
          if (conv && conv.unread_count > 0) {
            emitMarkRead(conv.id, activeUserId)
            setConversations(prev =>
              prev.map(c => (c.id === conv.id ? { ...c, unread_count: 0 } : c))
            )
          }
        }
      } catch (err) {
        console.warn('Failed to load message history:', err)
      } finally {
        if (isMounted) setIsLoadingMessages(false)
      }
    }

    loadMessages()
    return () => {
      isMounted = false
    }
  }, [activeRecipient?.id, activeUserId])

  // ── 4. Auto-Scroll to Bottom on Message Arrival ──────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, recipientTyping, pendingAttachment])

  // ── 5. Typing Indicator Dispatch ────────────────────────────
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputText(e.target.value)

    if (activeRecipient) {
      emitTypingStatus(activeUserId, activeRecipient.id, true)

      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
      typingTimerRef.current = setTimeout(() => {
        if (activeRecipient) {
          emitTypingStatus(activeUserId, activeRecipient.id, false)
        }
      }, 1800)
    }
  }

  // ── 6. File Selection & Validation ───────────────────────────
  function handleSelectImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type.toLowerCase())) {
      onShowToast('Please select a valid image (JPG, PNG, or WebP).')
      return
    }

    if (file.size > 15 * 1024 * 1024) {
      onShowToast('Image exceeds 15MB limit.')
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setPendingAttachment({
      file,
      type: 'image',
      previewUrl,
      name: file.name,
      size: file.size,
    })

    e.target.value = ''
  }

  function handleSelectPdf(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      onShowToast('Please select a valid PDF document.')
      return
    }

    if (file.size > 25 * 1024 * 1024) {
      onShowToast('PDF document exceeds 25MB limit.')
      return
    }

    setPendingAttachment({
      file,
      type: 'pdf',
      previewUrl: '',
      name: file.name,
      size: file.size,
    })

    e.target.value = ''
  }

  // ── 7. Send Message Handler ─────────────────────────────────
  async function handleSendMessage(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!activeRecipient) return

    const trimmed = inputText.trim()
    if (!trimmed && !pendingAttachment) return

    const tempId = `temp-${Date.now()}`
    let uploadedFileUrl: string | undefined
    let uploadedFileName: string | undefined
    let uploadedFileSize: number | undefined
    let uploadedMimeType: string | undefined
    let messageType: 'text' | 'image' | 'pdf' = 'text'

    // Upload attachment if present
    if (pendingAttachment) {
      setIsUploading(true)
      messageType = pendingAttachment.type
      try {
        const formData = new FormData()
        formData.append('file', pendingAttachment.file)

        const uploadRes = await fetch(`${API_BASE}/api/v1/chat/upload`, {
          method: 'POST',
          body: formData,
        })

        if (!uploadRes.ok) {
          const errData = await uploadRes.json()
          throw new Error(errData.detail || 'Upload failed')
        }

        const uploadData = await uploadRes.json()
        uploadedFileUrl = uploadData.file_url
        uploadedFileName = uploadData.file_name
        uploadedFileSize = uploadData.file_size
        uploadedMimeType = uploadData.mime_type
      } catch (err: any) {
        setIsUploading(false)
        onShowToast(`Failed to upload file: ${err.message}`)
        return
      } finally {
        setIsUploading(false)
      }
    }

    // Optimistic UI update
    const optimisticMessage: ChatMessage = {
      id: Date.now(),
      conversation_id: 0,
      sender_id: activeUserId,
      receiver_id: activeRecipient.id,
      message_type: messageType,
      content: trimmed,
      file_url: uploadedFileUrl || pendingAttachment?.previewUrl,
      file_name: uploadedFileName || pendingAttachment?.name,
      file_size: uploadedFileSize || pendingAttachment?.size,
      mime_type: uploadedMimeType,
      is_read: false,
      created_at: new Date().toISOString(),
      temp_id: tempId,
    }

    setMessages(prev => [...prev, optimisticMessage])
    setInputText('')
    setPendingAttachment(null)

    // Clear typing status
    emitTypingStatus(activeUserId, activeRecipient.id, false)

    // 1. Real-Time Socket.IO Broadcast
    emitChatMessage({
      sender_id: activeUserId,
      receiver_id: activeRecipient.id,
      message_type: messageType,
      content: trimmed,
      file_url: uploadedFileUrl,
      file_name: uploadedFileName,
      file_size: uploadedFileSize,
      mime_type: uploadedMimeType,
      temp_id: tempId,
    })

    // 2. Guaranteed REST Write Fallback
    try {
      fetch(`${API_BASE}/api/v1/chat/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: activeUserId,
          receiver_id: activeRecipient.id,
          message_type: messageType,
          content: trimmed,
          file_url: uploadedFileUrl,
          file_name: uploadedFileName,
          file_size: uploadedFileSize,
          mime_type: uploadedMimeType,
          temp_id: tempId,
        }),
      }).then(async res => {
        if (res.ok) {
          const saved: ChatMessage = await res.json()
          setMessages(prev => prev.map(m => (m.temp_id === tempId ? saved : m)))
        }
      }).catch(() => {})
    } catch {}
  }

  // ── 8. Formatted Filters & Helpers ───────────────────────────
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations
    const q = searchQuery.toLowerCase()
    return conversations.filter(
      c =>
        c.recipient.name.toLowerCase().includes(q) ||
        c.recipient.email.toLowerCase().includes(q) ||
        (c.last_message && c.last_message.toLowerCase().includes(q))
    )
  }, [conversations, searchQuery])

  function formatMessageTime(isoString: string): string {
    try {
      const d = new Date(isoString)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  function formatBytes(bytes?: number): string {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  function getInitials(name: string): string {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  // Get full image URL pointing to backend
  function getMediaUrl(url?: string): string {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
      return url.replace('localhost:8000', '127.0.0.1:8000')
    }
    return `${API_BASE}${url}`
  }

  return (
    <div className={styles.container}>
      {/* ── Left Sidebar (Conversations & Contacts) ────────── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.currentUserProfile}>
            <div className={styles.userAvatarLarge}>
              {getInitials(currentUser.fullName || currentUser.email)}
              <span className={styles.onlineBadge} title="Online" />
            </div>
            <div>
              <div className={styles.currentUserName}>
                {currentUser.fullName || currentUser.email}
              </div>
              <div className={styles.currentUserRole}>
                {currentUser.role.replace('_', ' ').toUpperCase()}
              </div>
            </div>
          </div>

          <button
            type="button"
            className={styles.btnNewChat}
            onClick={() => setIsNewChatModalOpen(true)}
            title="Start new conversation"
          >
            <span>＋</span> New Chat
          </button>
        </div>

        <div className={styles.searchWrap}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search chats or messages..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.conversationList}>
          {filteredConversations.map(conv => {
            const isActive = activeRecipient?.id === conv.recipient.id
            return (
              <div
                key={conv.id}
                className={`${styles.conversationItem} ${isActive ? styles.conversationItemActive : ''}`}
                onClick={() => setActiveRecipient(conv.recipient)}
              >
                <div className={styles.convAvatar}>
                  {getInitials(conv.recipient.name)}
                  <span className={styles.onlineBadge} />
                </div>

                <div className={styles.convInfo}>
                  <div className={styles.convTopRow}>
                    <span className={styles.convName}>{conv.recipient.name}</span>
                    {conv.last_message_at && (
                      <span className={styles.convTime}>
                        {formatMessageTime(conv.last_message_at)}
                      </span>
                    )}
                  </div>

                  <div className={styles.convBottomRow}>
                    <span className={styles.convLastMsg}>
                      {conv.last_message || 'Draft message'}
                    </span>
                    {conv.unread_count > 0 && (
                      <span className={styles.unreadPill}>{conv.unread_count}</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {/* All Team Members and Customer Contacts */}
          {chatUsers.filter(u => u.id !== activeUserId && !filteredConversations.some(c => c.recipient.id === u.id)).length > 0 && (
            <div style={{ marginTop: 10, padding: '0 4px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', margin: '10px 0 6px 8px' }}>
                All Team Contacts
              </div>
              {chatUsers
                .filter(u => u.id !== activeUserId && !filteredConversations.some(c => c.recipient.id === u.id))
                .filter(u => !searchQuery.trim() || u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(user => {
                  const isActive = activeRecipient?.id === user.id
                  return (
                    <div
                      key={user.id}
                      className={`${styles.conversationItem} ${isActive ? styles.conversationItemActive : ''}`}
                      onClick={() => setActiveRecipient(user)}
                    >
                      <div className={styles.convAvatar} style={{ background: '#475569' }}>
                        {getInitials(user.name)}
                        <span className={styles.onlineBadge} />
                      </div>

                      <div className={styles.convInfo}>
                        <div className={styles.convTopRow}>
                          <span className={styles.convName}>{user.name}</span>
                          <span style={{ fontSize: 11, color: '#64748b' }}>{user.role}</span>
                        </div>
                        <div className={styles.convBottomRow}>
                          <span className={styles.convLastMsg} style={{ color: '#94a3b8' }}>
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      </aside>

      {/* ── Main Chat Area ─────────────────────────────────── */}
      <main className={styles.chatArea}>
        {activeRecipient ? (
          <>
            {/* Header */}
            <div className={styles.chatHeader}>
              <div className={styles.chatRecipient}>
                <div className={styles.userAvatarLarge} style={{ background: '#0284C7' }}>
                  {getInitials(activeRecipient.name)}
                  <span className={styles.onlineBadge} />
                </div>
                <div>
                  <div className={styles.chatRecipientName}>
                    {activeRecipient.name}
                    <span className={styles.chatRecipientRole}>
                      {activeRecipient.role}
                    </span>
                  </div>
                  <div className={styles.chatRecipientStatus}>
                    {recipientTyping ? (
                      <span className={styles.typingIndicatorText}>typing...</span>
                    ) : (
                      <span>● Active now</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Feed */}
            <div className={styles.messagesStream}>
              <div className={styles.dateSeparator}>Real-Time Encrypted Session</div>

              {isLoadingMessages ? (
                <div style={{ textAlign: 'center', padding: 20, color: '#64748B' }}>
                  Loading chat history...
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
                    Say hello to {activeRecipient.name}! 👋
                  </p>
                  <p style={{ fontSize: 13 }}>
                    Send a message, share a photo, or attach an official quotation PDF.
                  </p>
                </div>
              ) : (
                messages.map(msg => {
                  const isSelf = msg.sender_id === activeUserId

                  return (
                    <div
                      key={msg.id || msg.temp_id}
                      className={`${styles.messageRow} ${isSelf ? styles.messageRowOutgoing : styles.messageRowIncoming}`}
                    >
                      <div
                        className={`${styles.messageBubble} ${isSelf ? styles.bubbleOutgoing : styles.bubbleIncoming}`}
                      >
                        {!isSelf && (
                          <div className={styles.messageSenderLabel}>
                            {activeRecipient.name}
                          </div>
                        )}

                        {/* Image Message */}
                        {msg.message_type === 'image' && msg.file_url && (
                          <div
                            className={styles.imageCard}
                            onClick={() => setLightboxImgUrl(getMediaUrl(msg.file_url))}
                            title="Click to expand"
                          >
                            <img
                              src={getMediaUrl(msg.file_url)}
                              alt="Chat attachment"
                              className={styles.chatImg}
                              loading="lazy"
                            />
                          </div>
                        )}

                        {/* PDF Message */}
                        {msg.message_type === 'pdf' && msg.file_url && (
                          <div className={styles.pdfCard}>
                            <div className={styles.pdfIconBox}>📄</div>
                            <div className={styles.pdfInfo}>
                              <div className={styles.pdfFileName}>
                                {msg.file_name || 'Document.pdf'}
                              </div>
                              <div className={styles.pdfMetaText}>
                                {formatBytes(msg.file_size)} • PDF Document
                              </div>
                            </div>
                            <a
                              href={getMediaUrl(msg.file_url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.btnDownloadPdf}
                              download={msg.file_name || 'Document.pdf'}
                            >
                              <span>⬇</span> Open
                            </a>
                          </div>
                        )}

                        {/* Text / Caption Content */}
                        {msg.content && (
                          <div className={styles.messageContentText}>{msg.content}</div>
                        )}

                        {/* Metadata: Time & Read Ticks */}
                        <div className={styles.messageMeta}>
                          <span>{formatMessageTime(msg.created_at)}</span>
                          {isSelf && (
                            <span className={msg.is_read ? styles.readTicks : styles.sentTicks}>
                              {msg.is_read ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}

              {recipientTyping && (
                <div className={`${styles.messageRow} ${styles.messageRowIncoming}`}>
                  <div
                    className={`${styles.messageBubble} ${styles.bubbleIncoming}`}
                    style={{ fontStyle: 'italic', color: '#64748B', fontSize: 12.5 }}
                  >
                    {activeRecipient.name} is typing...
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar & Attachment Controls */}
            <div className={styles.chatInputArea}>
              {/* Pre-Send Attachment Banner */}
              {pendingAttachment && (
                <div className={styles.pendingAttachmentBanner}>
                  <div className={styles.pendingAttachmentPreview}>
                    {pendingAttachment.type === 'image' ? (
                      <img
                        src={pendingAttachment.previewUrl}
                        alt="Preview"
                        className={styles.pendingImgThumbnail}
                      />
                    ) : (
                      <div className={styles.pendingDocBadge}>📄</div>
                    )}
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                        {pendingAttachment.name}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#64748B' }}>
                        {formatBytes(pendingAttachment.size)} • Ready to send
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.btnCancelAttachment}
                    onClick={() => setPendingAttachment(null)}
                  >
                    ✕ Cancel
                  </button>
                </div>
              )}

              <form className={styles.inputRow} onSubmit={handleSendMessage}>
                {/* Image Upload Trigger */}
                <input
                  type="file"
                  ref={imageInputRef}
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleSelectImage}
                />
                <button
                  type="button"
                  className={styles.actionIconBtn}
                  onClick={() => imageInputRef.current?.click()}
                  title="Share Image (JPG, PNG, WebP)"
                >
                  📷 Photo
                </button>

                {/* PDF Upload Trigger */}
                <input
                  type="file"
                  ref={pdfInputRef}
                  accept="application/pdf"
                  style={{ display: 'none' }}
                  onChange={handleSelectPdf}
                />
                <button
                  type="button"
                  className={styles.actionIconBtn}
                  onClick={() => pdfInputRef.current?.click()}
                  title="Share PDF Document"
                >
                  📄 PDF
                </button>

                {/* Text Input */}
                <input
                  type="text"
                  className={styles.messageTextInput}
                  placeholder={
                    pendingAttachment
                      ? 'Add an optional caption and press Enter...'
                      : 'Type a message...'
                  }
                  value={inputText}
                  onChange={handleInputChange}
                  disabled={isUploading}
                />

                {/* Send Button */}
                <button
                  type="submit"
                  className={styles.btnSendMsg}
                  disabled={(!inputText.trim() && !pendingAttachment) || isUploading}
                  title="Send Message (Enter)"
                >
                  {isUploading ? '⏳' : '➤'}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#64748B',
              gap: 12,
            }}
          >
            <div style={{ fontSize: 44 }}>💬</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>
              DealFlow360 Real-Time Messaging
            </div>
            <p style={{ fontSize: 13.5, maxWidth: 360, textAlign: 'center' }}>
              Select an ongoing conversation from the left or click <strong>New Chat</strong> to connect with team members and customers.
            </p>
            <button
              type="button"
              className={styles.btnNewChat}
              onClick={() => setIsNewChatModalOpen(true)}
            >
              Start a Conversation
            </button>
          </div>
        )}
      </main>

      {/* ── Lightbox Overlay for Images ─────────────────────── */}
      {lightboxImgUrl && (
        <div
          className={styles.lightboxOverlay}
          onClick={() => setLightboxImgUrl(null)}
        >
          <img
            src={lightboxImgUrl}
            alt="Full size attachment"
            className={styles.lightboxImg}
            onClick={e => e.stopPropagation()}
          />
          <div className={styles.lightboxBar} onClick={e => e.stopPropagation()}>
            <a
              href={lightboxImgUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.btnCloseLightbox}
              download="image"
            >
              ⬇ Download Original
            </a>
            <button
              type="button"
              className={styles.btnCloseLightbox}
              onClick={() => setLightboxImgUrl(null)}
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}

      {/* ── New Chat Contact Picker Modal ───────────────────── */}
      {isNewChatModalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => setIsNewChatModalOpen(false)}
        >
          <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Start New Conversation</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsNewChatModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalUserList}>
              {chatUsers.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#64748B' }}>
                  No other active users found.
                </div>
              ) : (
                chatUsers.map(user => (
                  <div
                    key={user.id}
                    className={styles.modalUserItem}
                    onClick={() => {
                      setActiveRecipient(user)
                      setIsNewChatModalOpen(false)
                    }}
                  >
                    <div className={styles.convAvatar}>
                      {getInitials(user.name)}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                        {user.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>
                        {user.role} • {user.email}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
