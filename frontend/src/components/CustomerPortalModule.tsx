'use client'

import React, { useState } from 'react'
import styles from './CustomerPortalWireframe.module.css'
import { Quotation, ActiveModule } from './types'

interface CustomerPortalProps {
  quotation: Quotation
  onUpdateQuotation: (updated: Quotation) => void
  onNavigate: (module: ActiveModule) => void
  onShowToast: (msg: string) => void
  customerTab?: 'quotation' | 'messages' | 'profile'
}

interface NegotiationLine {
  id: string
  line: string
  customerComment: string
}

export default function CustomerPortalModule({
  quotation,
  onUpdateQuotation,
  onNavigate,
  onShowToast,
  customerTab = 'quotation',
}: CustomerPortalProps) {
  // Negotiation items matching wireframe or live quotation items
  const [lines, setLines] = useState<NegotiationLine[]>(() => {
    if (quotation?.items && quotation.items.length > 0) {
      return quotation.items.map((item, idx) => ({
        id: `neg-${item.id || idx + 1}`,
        line: item.name,
        customerComment: idx === 0 ? 'Requesting additional volume discount.' : 'Terms acceptable.',
      }))
    }
    return [
      {
        id: 'neg-1',
        line: 'Extended Warranty',
        customerComment: 'Can this be 15% off instead of 10%?',
      },
      {
        id: 'neg-2',
        line: 'Onsite Setup',
        customerComment: 'Can we push this to next month?',
      },
    ]
  })

  React.useEffect(() => {
    if (quotation?.items && quotation.items.length > 0) {
      setLines(
        quotation.items.map((item, idx) => ({
          id: `neg-${item.id || idx + 1}`,
          line: item.name,
          customerComment: idx === 0 ? 'Requesting additional volume discount.' : 'Terms acceptable.',
        }))
      )
    }
  }, [quotation?.id, quotation?.items])

  const [counterDiscount, setCounterDiscount] = useState('15')
  const [requestedDeliveryDate, setRequestedDeliveryDate] = useState('2026-10-15')
  const [negotiationStatus, setNegotiationStatus] = useState<'Under Negotiation' | 'Confirmed'>('Under Negotiation')

  // Messages Thread State
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState([
    {
      sender: 'Jane Smith (Sales Rep)',
      text: 'Hi John, thank you for reviewing the quote. Please let us know if you have questions regarding the warranty terms.',
      time: '10:30 AM',
      isCustomer: false,
    },
    {
      sender: 'John Davis (Acme Corp)',
      text: 'Thanks Jane. We entered our requested counter-discount and pushed the setup date to mid-October.',
      time: '11:15 AM',
      isCustomer: true,
    },
  ])

  function handleSubmitRequest() {
    onUpdateQuotation({
      ...quotation,
      status: 'Negotiating',
      customerComment: `Counter discount: ${counterDiscount}%, Requested date: ${requestedDeliveryDate}`,
    })
    onShowToast('Negotiation request submitted! Your sales rep has been notified.')
  }

  function handleConfirmQuotation() {
    setNegotiationStatus('Confirmed')
    onUpdateQuotation({
      ...quotation,
      status: 'Confirmed',
    })
    onShowToast('Quotation Confirmed! Order is now approved and moving to fulfillment.')
  }

  function handleSendMessage() {
    if (!chatInput.trim()) return
    setMessages(prev => [
      ...prev,
      {
        sender: 'John Davis (Acme Corp)',
        text: chatInput.trim(),
        time: 'Just now',
        isCustomer: true,
      },
    ])
    setChatInput('')
    onShowToast('Message transmitted to Sales Rep!')
  }

  /* ──────────────────────────────────────────────────────────
     TAB: MESSAGES
     ────────────────────────────────────────────────────────── */
  if (customerTab === 'messages') {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Messages & Communication</h1>
          <p className={styles.subtitle}>Direct live negotiation thread with your dedicated Sales Representative</p>
        </div>

        <div className={styles.cardBox}>
          <div className={styles.chatMessages}>
            {messages.map((m, i) => (
              <div
                key={i}
                className={m.isCustomer ? styles.chatBubbleCustomer : styles.chatBubbleRep}
              >
                <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.8, marginBottom: 4 }}>
                  {m.sender} • {m.time}
                </div>
                <div>{m.text}</div>
              </div>
            ))}
          </div>

          <div className={styles.chatInputRow}>
            <input
              type="text"
              className={styles.chatInput}
              placeholder="Type your message or term adjustment..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
            />
            <button className={styles.btnSend} onClick={handleSendMessage}>
              Send
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ──────────────────────────────────────────────────────────
     TAB: PROFILE
     ────────────────────────────────────────────────────────── */
  if (customerTab === 'profile') {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Customer Account Profile</h1>
          <p className={styles.subtitle}>Registered organization credentials and authorized contract signatories</p>
        </div>

        <div className={styles.cardBox}>
          <div className={styles.profileGrid}>
            <div className={styles.profileItem}>
              <label>Organization / Account</label>
              <span className={styles.profileVal}>Acme Corporation (Tier: Enterprise Platinum)</span>
            </div>

            <div className={styles.profileItem}>
              <label>Authorized Signatory</label>
              <span className={styles.profileVal}>John Davis (VP Procurement)</span>
            </div>

            <div className={styles.profileItem}>
              <label>Registered Email</label>
              <span className={styles.profileVal}>customer@acme.com</span>
            </div>

            <div className={styles.profileItem}>
              <label>Payment Terms</label>
              <span className={styles.profileVal}>Net 30 Days (Direct ACH / Stripe Invoice)</span>
            </div>

            <div className={styles.profileItem}>
              <label>Billing & Delivery Address</label>
              <span className={styles.profileVal}>450 Enterprise Way, Suite 800, Austin, TX 78701</span>
            </div>

            <div className={styles.profileItem}>
              <label>Dedicated Sales Representative</label>
              <span className={styles.profileVal}>Jane Smith (sales@dealflow360.com)</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ──────────────────────────────────────────────────────────
     TAB: MY QUOTATION (Customer Portal Negotiation Screen)
     ────────────────────────────────────────────────────────── */
  return (
    <div className={styles.container}>
      {/* ── Header ────────────────────────────────────────── */}
      <div className={styles.header}>
        <h1 className={styles.title}>Customer Portal Negotiation Screen</h1>
        <p className={styles.subtitle}>
          Customer reviews and negotiates the quote directly, no email needed
        </p>
      </div>

      {/* ── Status Pill ───────────────────────────────────── */}
      <div className={styles.statusBadge}>
        Status: {negotiationStatus}
      </div>

      {/* ── Negotiation Items Table ───────────────────────── */}
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: '35%' }}>Line</th>
              <th>Customer Comment</th>
            </tr>
          </thead>
          <tbody>
            {lines.map(row => (
              <tr key={row.id}>
                <td><strong>{row.line}</strong></td>
                <td>
                  <input
                    type="text"
                    value={row.customerComment}
                    onChange={e => {
                      const val = e.target.value
                      setLines(prev =>
                        prev.map(l => (l.id === row.id ? { ...l, customerComment: val } : l))
                      )
                    }}
                    className={styles.inputBox}
                    style={{ padding: '7px 12px', fontSize: 13.5 }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Counter Discount & Delivery Date Inputs ───────── */}
      <div className={styles.inputsRow}>
        <div className={styles.inputField}>
          <label className={styles.inputLabel}>Counter Discount %</label>
          <input
            type="text"
            className={styles.inputBox}
            value={counterDiscount}
            onChange={e => setCounterDiscount(e.target.value)}
            placeholder="e.g. 15"
          />
        </div>

        <div className={styles.inputField}>
          <label className={styles.inputLabel}>Requested Delivery Date</label>
          <input
            type="date"
            className={styles.inputBox}
            value={requestedDeliveryDate}
            onChange={e => setRequestedDeliveryDate(e.target.value)}
          />
        </div>
      </div>

      {/* ── Actions Row ───────────────────────────────────── */}
      <div className={styles.actionsRow}>
        <button className={styles.btnSubmitRequest} onClick={handleSubmitRequest}>
          Submit Request
        </button>

        <button className={styles.btnConfirm} onClick={handleConfirmQuotation}>
          Confirm Quotation
        </button>
      </div>

      {/* ── Alert Banner ──────────────────────────────────── */}
      <div className={styles.alertBanner}>
        <span>
          If final terms exceed thresholds, the quote automatically re-enters approval (Screen 6).
        </span>
      </div>
    </div>
  )
}
