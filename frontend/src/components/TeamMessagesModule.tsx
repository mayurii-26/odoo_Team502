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

  // Default initial conversations tailored for Financial Officer vs Sales Manager
  const initialConversations: Conversation[] = isFinance
    ? [
        {
          id: 'conv-fin-1',
          name: 'Jane Smith (Sales Rep)',
          roleLabel: 'Sales Representative',
          lastMessage: 'Hi David, please review the gross margin breakdown for Q-1042.',
          timestamp: '10:45 AM',
          unreadCount: 1,
          dealId: 'Q-1042',
          dealAmount: '$124,500',
          customer: 'Acme Corp',
          contactEmail: 'sales@dealflow360.com',
          messages: [
            {
              id: 'm-1',
              senderName: 'Jane Smith',
              senderRole: 'Sales Rep',
              isSelf: false,
              timestamp: '10:42 AM',
              text: 'Good morning David! Customer Acme Corp is requesting an 18% discount on their annual software bundle. Can Finance approve the blended margin impact?',
              linkedDeal: 'Q-1042 ($124,500)',
            },
            {
              id: 'm-2',
              senderName: 'David Miller',
              senderRole: 'Finance Officer',
              isSelf: true,
              timestamp: '10:44 AM',
              text: 'Checking the cost sheet now. Our target gross margin is 35%. What is the payment schedule?',
            },
            {
              id: 'm-3',
              senderName: 'Jane Smith',
              senderRole: 'Sales Rep',
              isSelf: false,
              timestamp: '10:45 AM',
              text: 'They agreed to Net-30 payment with an upfront annual commitment for the software licenses.',
            },
          ],
        },
        {
          id: 'conv-fin-2',
          name: 'Carlos Mendez (Sales Rep)',
          roleLabel: 'Sales Representative',
          lastMessage: 'Invoice payment terms confirmed for Beta Industries.',
          timestamp: 'Yesterday',
          dealId: 'Q-1039',
          dealAmount: '$86,200',
          customer: 'Beta Industries',
          contactEmail: 'carlos.m@dealflow360.com',
          messages: [
            {
              id: 'm-4',
              senderName: 'Carlos Mendez',
              senderRole: 'Sales Rep',
              isSelf: false,
              timestamp: 'Yesterday',
              text: 'David, Beta Industries accepted the Net-30 invoice clause. Ready for financial dispatch sign-off.',
              linkedDeal: 'Q-1039 ($86,200)',
            },
            {
              id: 'm-5',
              senderName: 'David Miller',
              senderRole: 'Finance Officer',
              isSelf: true,
              timestamp: 'Yesterday',
              text: 'Perfect. I will clear the fulfillment hold and generate invoice INV-2026-082.',
            },
          ],
        },
        {
          id: 'conv-fin-3',
          name: 'Alex Rivera (Sales Manager)',
          roleLabel: 'Sales Manager',
          lastMessage: 'Approved commission tier reconciliation for August deals.',
          timestamp: 'Sep 3',
          dealId: 'Q-1035',
          dealAmount: '$210,000',
          customer: 'Nova Retail Group',
          contactEmail: 'manager@dealflow360.com',
          messages: [
            {
              id: 'm-6',
              senderName: 'Alex Rivera',
              senderRole: 'Sales Manager',
              isSelf: false,
              timestamp: 'Sep 3',
              text: 'Hey David, sent over the updated quota achievement reports for Jane and Carlos. Let me know once audited.',
            },
          ],
        },
        {
          id: 'conv-fin-4',
          name: 'John Davis (Acme Corp Billing)',
          roleLabel: 'Customer Finance Contact',
          lastMessage: 'Wire confirmation attached for Invoice INV-2026-081.',
          timestamp: 'Aug 29',
          dealId: 'Q-1042',
          dealAmount: '$124,500',
          customer: 'Acme Corp',
          contactEmail: 'customer@acme.com',
          messages: [
            {
              id: 'm-7',
              senderName: 'John Davis',
              senderRole: 'Customer Finance',
              isSelf: false,
              timestamp: 'Aug 29',
              text: 'Hi David, our treasury department initiated wire transfer #WT-9921 for the setup invoices. Please confirm receipt.',
            },
          ],
        },
      ]
    : [
        /* ── Sales Manager Initial Conversations ── */
        {
          id: 'conv-mgr-1',
          name: 'Jane Smith (Sales Rep)',
          roleLabel: 'Sales Representative',
          lastMessage: 'Manager approval requested for Q-1042 18% discount.',
          timestamp: '11:10 AM',
          unreadCount: 1,
          dealId: 'Q-1042',
          dealAmount: '$124,500',
          customer: 'Acme Corp',
          contactEmail: 'sales@dealflow360.com',
          messages: [
            {
              id: 'm-10',
              senderName: 'Jane Smith',
              senderRole: 'Sales Rep',
              isSelf: false,
              timestamp: '11:05 AM',
              text: 'Alex, Acme Corp wants to close this quarter but their VP requested an 18% discount on the hardware package. Normal rep limit is 12%. Need your manager sign-off.',
              linkedDeal: 'Q-1042 ($124,500)',
            },
            {
              id: 'm-11',
              senderName: 'Alex Rivera',
              senderRole: 'Sales Manager',
              isSelf: true,
              timestamp: '11:08 AM',
              text: 'Checking the risk score. Blended risk is at 80 (Low). Can we lock them into a 2-year cloud subscription in exchange for the hardware discount?',
            },
            {
              id: 'm-12',
              senderName: 'Jane Smith',
              senderRole: 'Sales Rep',
              isSelf: false,
              timestamp: '11:10 AM',
              text: 'Yes! They already agreed to annual recurring terms for CloudScale Engine. Ready for your review.',
            },
          ],
        },
        {
          id: 'conv-mgr-2',
          name: 'Carlos Mendez (Sales Rep)',
          roleLabel: 'Sales Representative',
          lastMessage: 'Closing Beta Industries deal Q-1039 today.',
          timestamp: '9:30 AM',
          dealId: 'Q-1039',
          dealAmount: '$86,200',
          customer: 'Beta Industries',
          contactEmail: 'carlos.m@dealflow360.com',
          messages: [
            {
              id: 'm-13',
              senderName: 'Carlos Mendez',
              senderRole: 'Sales Rep',
              isSelf: false,
              timestamp: '9:25 AM',
              text: 'Alex, quotation Q-1039 is ready. All lines fall within the standard 10% rep threshold. Customer will sign by 3 PM.',
              linkedDeal: 'Q-1039 ($86,200)',
            },
            {
              id: 'm-14',
              senderName: 'Alex Rivera',
              senderRole: 'Sales Manager',
              isSelf: true,
              timestamp: '9:30 AM',
              text: 'Great work Carlos. That puts your monthly quota at 108% of target!',
            },
          ],
        },
        {
          id: 'conv-mgr-3',
          name: 'David Miller (Financial Officer)',
          roleLabel: 'Financial Officer',
          lastMessage: 'Verified payment terms and margin floor for Q-1042.',
          timestamp: 'Yesterday',
          dealId: 'Q-1042',
          dealAmount: '$124,500',
          customer: 'Acme Corp',
          contactEmail: 'finance@dealflow360.com',
          messages: [
            {
              id: 'm-15',
              senderName: 'David Miller',
              senderRole: 'Finance Officer',
              isSelf: false,
              timestamp: 'Yesterday',
              text: 'Alex, Finance confirmed the margin floor for Acme Corp. As long as discount is under 20%, blended margin remains healthy at 36.4%.',
            },
          ],
        },
        {
          id: 'conv-mgr-4',
          name: 'Elena Rostova (VP Sales)',
          roleLabel: 'Executive VP',
          lastMessage: 'Q3 pipeline pacing looks strong at 114%.',
          timestamp: 'Sep 2',
          dealId: 'Q-1035',
          dealAmount: '$210,000',
          customer: 'Nova Retail Group',
          contactEmail: 'elena.r@dealflow360.com',
          messages: [
            {
              id: 'm-16',
              senderName: 'Elena Rostova',
              senderRole: 'VP Sales',
              isSelf: false,
              timestamp: 'Sep 2',
              text: 'Alex, great job managing team discounts this cycle. High-risk deal count dropped from 5 to 1.',
            },
          ],
        },
      ]

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
