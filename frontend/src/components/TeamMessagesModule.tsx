'use client'

import React, { useState } from 'react'
import styles from './TeamMessagesModule.module.css'
import { UserRole, Quotation, ActiveModule } from './types'

interface MessageItem {
  id: string
  senderName: string
  senderRole: string
  isSelf: boolean
  timestamp: string
  text: string
  linkedDeal?: string
}

interface Conversation {
  id: string
  name: string
  roleLabel: string
  isChannel?: boolean
  lastMessage: string
  timestamp: string
  unreadCount?: number
  dealId?: string
  dealAmount?: string
  customer?: string
  contactEmail?: string
  messages: MessageItem[]
}

interface TeamMessagesProps {
  role: UserRole
  quotations: Quotation[]
  onNavigate: (module: ActiveModule) => void
  onShowToast: (msg: string) => void
}

export default function TeamMessagesModule({
  role,
  quotations,
  onNavigate,
  onShowToast,
}: TeamMessagesProps) {
  const isFinance = role === 'finance'

  // Build conversations from live quotations — no hardcoded names or deal IDs
  const initialConversations: Conversation[] = quotations.slice(0, 4).map((q, i) => ({
    id: `conv-${i + 1}`,
    name: q.salesRep || q.customerName || `Contact ${i + 1}`,
    roleLabel: q.salesRep ? 'Sales Representative' : 'Customer Contact',
    lastMessage: `${q.id} — ${q.status}`,
    timestamp: q.createdAt || 'Recent',
    unreadCount: q.status === 'Under Review' ? 1 : 0,
    dealId: q.id,
    dealAmount: `$${q.items.reduce((s, it) => s + it.qty * it.unitPrice * (1 - it.discountPct / 100), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    customer: q.customerName,
    messages: [],
  }))

  const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
  const [selectedConvId, setSelectedConvId] = useState<string>(initialConversations[0]?.id || '')
  const [inputText, setInputText] = useState('')

  const activeConv = conversations.find(c => c.id === selectedConvId) || conversations[0]

  // Quick Response Chips tailored by Role
  const quickChips = isFinance
    ? [
        'Invoice verified ✓',
        'Payment terms approved (Net 30)',
        'Please send margin cost calculation',
        'Wire payment confirmed by treasury',
      ]
    : [
        'Discount approved, proceed to send',
        'Please cap discount at 15%',
        'Approved with executive sign-off',
        'Schedule client call before signing',
      ]

  function handleSendMessage(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!inputText.trim() || !activeConv) return

    const newMsg: MessageItem = {
      id: `msg-${Date.now()}`,
      senderName: isFinance ? 'David Miller' : 'Alex Rivera',
      senderRole: isFinance ? 'Finance Officer' : 'Sales Manager',
      isSelf: true,
      timestamp: 'Just now',
      text: inputText.trim(),
    }

    setConversations(prev =>
      prev.map(c =>
        c.id === activeConv.id
          ? {
              ...c,
              lastMessage: inputText.trim(),
              timestamp: 'Just now',
              unreadCount: 0,
              messages: [...c.messages, newMsg],
            }
          : c
      )
    )

    setInputText('')
    onShowToast(`Message delivered to ${activeConv.name}`)

    // Realistic auto-reply simulation
    setTimeout(() => {
      const replyMsg: MessageItem = {
        id: `reply-${Date.now()}`,
        senderName: activeConv.name.split(' ')[0],
        senderRole: activeConv.roleLabel,
        isSelf: false,
        timestamp: 'Just now',
        text: isFinance
          ? 'Thank you David. I have updated the terms in the deal workspace accordingly.'
          : 'Thank you Alex! Updating the quotation status and dispatching to customer now.',
      }
      setConversations(prev =>
        prev.map(c =>
          c.id === activeConv.id
            ? {
                ...c,
                lastMessage: replyMsg.text,
                timestamp: 'Just now',
                messages: [...c.messages, replyMsg],
              }
            : c
        )
      )
    }, 2500)
  }

  function handleQuickChip(chipText: string) {
    setInputText(chipText)
  }

  return (
    <div className={styles.container}>
      {/* ── Left Sidebar: Conversations List ──────────────────── */}
      <aside className={styles.channelsSidebar}>
        <div className={styles.channelsHeader}>
          <h2 className={styles.channelsTitle}>
            <span>💬</span>
            <span>{isFinance ? 'Finance Direct Threads' : 'Manager Deal Threads'}</span>
          </h2>
          <p className={styles.channelsSubtitle}>
            {isFinance
              ? 'Invoicing, terms approvals & rep inquiries'
              : 'Discount escalations, deal reviews & coaching'}
          </p>
        </div>

        <div className={styles.channelsScroll}>
          <div className={styles.channelSectionLabel}>Direct Conversations</div>
          {conversations.map(conv => {
            const isSelected = conv.id === activeConv.id
            const initials = conv.name
              .split(' ')
              .map(n => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()

            return (
              <button
                key={conv.id}
                className={`${styles.channelItem} ${isSelected ? styles.channelItemActive : ''}`}
                onClick={() => {
                  setSelectedConvId(conv.id)
                  // clear unread
                  setConversations(prev =>
                    prev.map(c => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
                  )
                }}
              >
                <div className={styles.channelAvatar}>{initials}</div>
                <div className={styles.channelMeta}>
                  <div className={styles.channelName}>
                    <span>{conv.name}</span>
                    {conv.unreadCount && conv.unreadCount > 0 ? (
                      <span className={styles.unreadBadge}>{conv.unreadCount}</span>
                    ) : null}
                  </div>
                  <div className={styles.channelSnippet}>{conv.lastMessage}</div>
                </div>
              </button>
            )
          })}
        </div>
      </aside>

      {/* ── Middle Pane: Chat Thread ──────────────────────────── */}
      <main className={styles.chatMain}>
        {/* Chat Header */}
        <header className={styles.chatHeader}>
          <div className={styles.chatHeaderLeft}>
            <div>
              <h3 className={styles.chatTitle}>{activeConv.name}</h3>
              <p className={styles.chatTopic}>
                {activeConv.dealId
                  ? `Active Discussion on Deal ${activeConv.dealId} (${activeConv.customer || ''})`
                  : 'Direct Communication'}
              </p>
            </div>
            <span
              className={`${styles.roleTag} ${
                isFinance ? styles.roleTagFinance : styles.roleTagManager
              }`}
            >
              {activeConv.roleLabel}
            </span>
          </div>
        </header>

        {/* Message Stream */}
        <div className={styles.messagesStream}>
          {activeConv.messages.map(msg => (
            <div
              key={msg.id}
              className={`${styles.messageRow} ${msg.isSelf ? styles.messageRowSelf : ''}`}
            >
              <div
                className={`${styles.messageAvatar} ${
                  msg.isSelf ? styles.messageAvatarSelf : ''
                }`}
              >
                {msg.senderName.slice(0, 2).toUpperCase()}
              </div>
              <div
                className={`${styles.messageBubble} ${
                  msg.isSelf ? styles.messageBubbleSelf : ''
                }`}
              >
                <div className={styles.messageMeta}>
                  <span className={styles.senderName}>{msg.senderName}</span>
                  <span className={styles.timestamp}>{msg.timestamp}</span>
                </div>
                <p className={styles.messageText}>{msg.text}</p>
                {msg.linkedDeal && (
                  <span
                    className={styles.dealBadgeInMessage}
                    onClick={() => onNavigate('approvals')}
                    title="Click to view linked approval request"
                  >
                    📄 Linked: {msg.linkedDeal}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Response Chips */}
        <div className={styles.quickChipsRow}>
          <span className={styles.quickChipLabel}>⚡ Quick Reply:</span>
          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              className={styles.quickChip}
              onClick={() => handleQuickChip(chip)}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Composer Form */}
        <form className={styles.composer} onSubmit={handleSendMessage}>
          <input
            type="text"
            className={styles.input}
            placeholder={`Type a message to ${activeConv.name.split(' ')[0]}...`}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
          />
          <button type="submit" className={styles.sendBtn}>
            <span>Send</span>
            <span>↵</span>
          </button>
        </form>
      </main>

      {/* ── Right Sidebar: Context Card ───────────────────────── */}
      <aside className={styles.contextSidebar}>
        <div>
          <h4 className={styles.contextCardTitle}>Linked Deal Context</h4>
          <div className={styles.dealSummaryBox}>
            <div className={styles.dealName}>
              {activeConv.dealId || 'Q-1042'} — Proposal
            </div>
            <div className={styles.dealCompany}>
              Client: {activeConv.customer || 'Acme Corp'}
            </div>
            <div className={styles.dealValue}>
              {activeConv.dealAmount || '$124,500'}
            </div>

            <div className={styles.dealMetaRow}>
              <span>Status:</span>
              <strong style={{ color: '#D97706' }}>Under Review</strong>
            </div>
            <div className={styles.dealMetaRow}>
              <span>Discount Requested:</span>
              <strong>18.0%</strong>
            </div>
            <div className={styles.dealMetaRow}>
              <span>Blended Margin:</span>
              <strong style={{ color: '#166534' }}>36.4%</strong>
            </div>

            <button
              type="button"
              className={styles.dealActionBtn}
              onClick={() => onNavigate('approvals')}
              style={{ marginTop: 6 }}
            >
              View in Approval Queue →
            </button>
          </div>
        </div>

        <div>
          <h4 className={styles.contextCardTitle}>Participant Details</h4>
          <div className={styles.contactBox}>
            <div className={styles.contactName}>{activeConv.name}</div>
            <div className={styles.contactRole}>{activeConv.roleLabel}</div>
            <div className={styles.contactEmail}>{activeConv.contactEmail}</div>
            <div style={{ fontSize: 11, color: '#166534', marginTop: 4 }}>
              ● Online &amp; Active
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
