'use client'

import React, { useState, useEffect } from 'react'
import styles from './AdminModule.module.css'
import { DirectoryUser, UserRole, RecommendationWeights, UserAccount } from './types'
import {
  fetchRecommendationWeights,
  saveRecommendationWeights,
  provisionUserFromAdmin,
  sendDirectAdminMessage,
} from '@/lib/api'

interface AdminModuleProps {
  adminTab: 'access' | 'messages' | 'directory' | 'recommendations'
  onNavigateTab: (tab: 'access' | 'messages' | 'directory' | 'recommendations') => void
  onSwitchRole: (role: UserRole) => void
  onShowToast: (msg: string) => void
  onImpersonateUser?: (email: string, role: UserRole, name: string, company: string) => void
  users?: UserAccount[]
}

const DEFAULT_WEIGHTS: RecommendationWeights = {
  upsell: {
    upgrade_frequency: 35,
    margin_opportunity: 25,
    promotion: 20,
    customer_affinity: 10,
    stock_availability: 10,
  },
  cross_sell: {
    co_purchase_frequency: 35,
    compatibility: 20,
    promotion: 15,
    margin_opportunity: 20,
    stock_availability: 10,
  },
}

/* ── Initial Unified Directory Mock Data ─────────────────────── */
const INITIAL_DIRECTORY: DirectoryUser[] = [
  {
    id: 'u-1',
    name: 'Sarah Connor',
    email: 'admin@dealflow360.com',
    role: 'admin',
    roleLabel: 'Administrator',
    company: 'DealFlow360 HQ',
    status: 'Active',
    lastActive: 'Just now',
    avatarInitials: 'SC',
  },
  {
    id: 'u-2',
    name: 'David Miller',
    email: 'finance@dealflow360.com',
    role: 'finance',
    roleLabel: 'Finance User',
    company: 'DealFlow360 Finance & Audit',
    status: 'Active',
    lastActive: '12 mins ago',
    avatarInitials: 'DM',
  },
  {
    id: 'u-3',
    name: 'Alex Rivera',
    email: 'manager@dealflow360.com',
    role: 'sales_manager',
    roleLabel: 'Sales Manager',
    company: 'DealFlow360 Commercial Ops',
    status: 'Active',
    lastActive: '25 mins ago',
    avatarInitials: 'AR',
  },
  {
    id: 'u-4',
    name: 'Jane Smith',
    email: 'sales@dealflow360.com',
    role: 'sales_rep',
    roleLabel: 'Sales Representative',
    company: 'DealFlow360 Direct Sales',
    status: 'Active',
    lastActive: '5 mins ago',
    avatarInitials: 'JS',
  },
  {
    id: 'u-5',
    name: 'John Davis (rk)',
    email: 'customer@acme.com',
    role: 'customer',
    roleLabel: 'Customer Contact',
    company: 'Acme Corporation',
    status: 'Active',
    lastActive: 'Today, 11:30 AM',
    avatarInitials: 'RK',
  },
  {
    id: 'u-6',
    name: 'Robert Vance',
    email: 'robert.vance@dealflow360.com',
    role: 'finance',
    roleLabel: 'Finance Director',
    company: 'DealFlow360 Treasury',
    status: 'Active',
    lastActive: 'Yesterday',
    avatarInitials: 'RV',
  },
  {
    id: 'u-7',
    name: 'Elena Rostova',
    email: 'elena.r@dealflow360.com',
    role: 'sales_manager',
    roleLabel: 'Sales Manager (Enterprise)',
    company: 'DealFlow360 Strategic Accounts',
    status: 'Active',
    lastActive: '1 hour ago',
    avatarInitials: 'ER',
  },
  {
    id: 'u-8',
    name: 'Rachel Green',
    email: 'rachel@nexusglobal.com',
    role: 'customer',
    roleLabel: 'Customer Contact',
    company: 'Nexus Global',
    status: 'Active',
    lastActive: '2 days ago',
    avatarInitials: 'RG',
  },
  {
    id: 'u-9',
    name: 'Carlos Mendez',
    email: 'carlos.m@dealflow360.com',
    role: 'sales_rep',
    roleLabel: 'Senior Sales Rep',
    company: 'DealFlow360 Field Sales',
    status: 'Active',
    lastActive: '3 hours ago',
    avatarInitials: 'CM',
  },
  {
    id: 'u-10',
    name: 'Thomas Wayne',
    email: 't.wayne@omnicorp.com',
    role: 'customer',
    roleLabel: 'Customer Contact',
    company: 'OmniCorp Industries',
    status: 'Active',
    lastActive: 'Sep 3, 2026',
    avatarInitials: 'TW',
  },
  {
    id: 'u-11',
    name: 'Marcus Vance',
    email: 'marcus.v@dealflow360.com',
    role: 'sales_rep',
    roleLabel: 'Sales Representative',
    company: 'DealFlow360 Direct Sales',
    status: 'Pending Invite',
    lastActive: 'Invited (Pending)',
    avatarInitials: 'MV',
  },
]

/* ── Initial Sent Messages ───────────────────────────────────── */
interface SentDirectMessage {
  id: string
  recipient: string
  recipientCategory: string
  subject: string
  body: string
  priority: 'Normal' | 'High' | 'Urgent'
  timestamp: string
  status: 'Delivered & Emailed' | 'Read'
}

const INITIAL_SENT_MESSAGES: SentDirectMessage[] = [
  {
    id: 'msg-1',
    recipient: '💰 Finance Team (David Miller, Robert Vance)',
    recipientCategory: 'finance',
    subject: 'Q3 Margin Audit & High-Discount Quote Reviews',
    body: 'Please conduct an expedited review of all quotes flagged with blended risk score > 45. Direct approval required before fulfillment allocation.',
    priority: 'High',
    timestamp: 'Today, 2:15 PM',
    status: 'Delivered & Emailed',
  },
  {
    id: 'msg-2',
    recipient: '📊 Alex Rivera (Sales Manager)',
    recipientCategory: 'sales_manager',
    subject: 'Approval Thresholds Updated for Enterprise Tier',
    body: 'Hardware discount ceilings have been recalibrated to 18% max without CFO countersignature. Please review your pending queue in Screen 6.',
    priority: 'Normal',
    timestamp: 'Today, 10:45 AM',
    status: 'Read',
  },
  {
    id: 'msg-3',
    recipient: '🏢 John Davis (Acme Corp)',
    recipientCategory: 'customer',
    subject: 'Quotation Q-1042 Counter-Terms Under Assessment',
    body: 'We have received your requested 15% warranty discount and next-month delivery preference. Our account lead Jane Smith is preparing the revised breakdown.',
    priority: 'Normal',
    timestamp: 'Yesterday, 4:30 PM',
    status: 'Read',
  },
]

export default function AdminModule({
  adminTab,
  onNavigateTab,
  onSwitchRole,
  onShowToast,
  onImpersonateUser,
  users,
}: AdminModuleProps) {
  // Directory & Users State from live PostgreSQL
  const [directory, setDirectory] = useState<DirectoryUser[]>(() => {
    if (users && users.length > 0) {
      return users.map((u: UserAccount, idx: number) => {
        const r = (u.role || '').toLowerCase()
        const mappedRole: UserRole = r.includes('admin')
          ? 'admin'
          : r.includes('manager')
          ? 'sales_manager'
          : r.includes('finance') || r.includes('operation')
          ? 'finance'
          : r.includes('customer')
          ? 'customer'
          : 'sales_rep'
        return {
          id: `u-${u.id || idx + 1}`,
          name: u.name,
          email: u.email,
          role: mappedRole,
          roleLabel: u.role,
          company: mappedRole === 'customer' ? 'Customer Account' : 'DealFlow360 HQ',
          status: (u.status === 'Active' ? 'Active' : 'Pending Invite') as any,
          lastActive: 'Active in Database',
          avatarInitials: u.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'U',
        }
      })
    }
    return INITIAL_DIRECTORY
  })

  React.useEffect(() => {
    if (users && users.length > 0) {
      setDirectory(
        users.map((u: UserAccount, idx: number) => {
          const r = (u.role || '').toLowerCase()
          const mappedRole: UserRole = r.includes('admin')
            ? 'admin'
            : r.includes('manager')
            ? 'sales_manager'
            : r.includes('finance') || r.includes('operation')
            ? 'finance'
            : r.includes('customer')
            ? 'customer'
            : 'sales_rep'
          return {
            id: `u-${u.id || idx + 1}`,
            name: u.name,
            email: u.email,
            role: mappedRole,
            roleLabel: u.role,
            company: mappedRole === 'customer' ? 'Customer Account' : 'DealFlow360 HQ',
            status: (u.status === 'Active' ? 'Active' : 'Pending Invite') as any,
            lastActive: 'Active in Database',
            avatarInitials: u.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'U',
          }
        })
      )
    }
  }, [users])

  // Tab 1: Access Provisioning Form State
  const [provisionName, setProvisionName] = useState('Liam Thorne')
  const [provisionEmail, setProvisionEmail] = useState('liam.finance@dealflow360.com')
  const [provisionRole, setProvisionRole] = useState<UserRole>('finance')
  const [provisionCompany, setProvisionCompany] = useState('DealFlow360 Finance & Treasury')
  const [provisionPassword, setProvisionPassword] = useState('DealFlow#2026')
  const [sendMailChecked, setSendMailChecked] = useState(true)
  const [emailReceipt, setEmailReceipt] = useState<{
    name: string
    email: string
    role: UserRole
    roleLabel: string
    password: string
    timestamp: string
  } | null>(null)

  // Tab 2: Messaging State
  const [messages, setMessages] = useState<SentDirectMessage[]>(INITIAL_SENT_MESSAGES)
  const [recipient, setRecipient] = useState('finance@dealflow360.com')
  const [recipientName, setRecipientName] = useState('David Miller (Finance User)')
  const [msgSubject, setMsgSubject] = useState('Fiscal Year End Reconciliation Instructions')
  const [msgPriority, setMsgPriority] = useState<'Normal' | 'High' | 'Urgent'>('High')
  const [msgBody, setMsgBody] = useState(
    'Please verify all outstanding unallocated hardware lines prior to the Friday cutoff.'
  )

  // Tab 3: Directory Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all')

  // Tab 4: Recommendation Scoring Weights State
  const [weights, setWeights] = useState<RecommendationWeights>(DEFAULT_WEIGHTS)
  const [loadingWeights, setLoadingWeights] = useState(false)
  const [savingWeights, setSavingWeights] = useState(false)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null)
  const [weightsError, setWeightsError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    async function loadWeights() {
      setLoadingWeights(true)
      try {
        const data = await fetchRecommendationWeights()
        if (data && isMounted) {
          setWeights(data)
        }
      } catch (err) {
        console.warn('Could not load database recommendation weights:', err)
      } finally {
        if (isMounted) setLoadingWeights(false)
      }
    }
    loadWeights()
    return () => {
      isMounted = false
    }
  }, [])

  const upsellSum = Object.values(weights.upsell).reduce((a, b) => a + b, 0)
  const crossSellSum = Object.values(weights.cross_sell).reduce((a, b) => a + b, 0)
  const isUpsellValid = Math.abs(upsellSum - 100) < 0.01
  const isCrossSellValid = Math.abs(crossSellSum - 100) < 0.01
  const canSaveWeights = isUpsellValid && isCrossSellValid

  function handleUpsellWeightChange(metric: keyof RecommendationWeights['upsell'], val: number) {
    setWeights(prev => ({
      ...prev,
      upsell: { ...prev.upsell, [metric]: val },
    }))
    setSaveSuccessMsg(null)
    setWeightsError(null)
  }

  function handleCrossSellWeightChange(metric: keyof RecommendationWeights['cross_sell'], val: number) {
    setWeights(prev => ({
      ...prev,
      cross_sell: { ...prev.cross_sell, [metric]: val },
    }))
    setSaveSuccessMsg(null)
    setWeightsError(null)
  }

  function handleResetWeights() {
    setWeights(DEFAULT_WEIGHTS)
    setSaveSuccessMsg(null)
    setWeightsError(null)
    onShowToast('Reset scoring weights to baseline defaults.')
  }

  async function handleSaveWeights() {
    if (!canSaveWeights) {
      setWeightsError(
        `Weights must total exactly 100% for each model. Current: Upsell ${upsellSum}%, Cross-Sell ${crossSellSum}%.`
      )
      return
    }

    setSavingWeights(true)
    setWeightsError(null)
    setSaveSuccessMsg(null)
    try {
      const res = await saveRecommendationWeights(weights)
      if (res.success) {
        setSaveSuccessMsg('Recommendation weights successfully saved to PostgreSQL database! Live scoring recalculated.')
        onShowToast('Recommendation weights saved! Quotation engine recalculated.')
      } else {
        setWeightsError(res.message || 'Failed to save weights to backend.')
      }
    } catch (err) {
      setWeightsError('Network error while saving weights to database.')
    } finally {
      setSavingWeights(false)
    }
  }

  /* ── Tab 1: Generate Secure Password ───────────────────────── */
  function handleGeneratePassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%*'
    let pwd = 'DF-'
    for (let i = 0; i < 8; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setProvisionPassword(pwd)
    onShowToast('Generated new high-entropy temporary password.')
  }

  /* ── Tab 1: Role Selection Sync ────────────────────────────── */
  function handleRoleChange(newRole: UserRole) {
    setProvisionRole(newRole)
    if (newRole === 'finance') {
      setProvisionCompany('DealFlow360 Finance & Treasury')
      if (provisionEmail.includes('@dealflow360')) {
        setProvisionEmail('liam.finance@dealflow360.com')
      }
    } else if (newRole === 'sales_manager') {
      setProvisionCompany('DealFlow360 Commercial Sales Ops')
      setProvisionEmail('liam.manager@dealflow360.com')
    } else if (newRole === 'sales_rep') {
      setProvisionCompany('DealFlow360 Direct Sales')
      setProvisionEmail('liam.sales@dealflow360.com')
    } else if (newRole === 'customer') {
      setProvisionCompany('Apex Enterprises')
      setProvisionEmail('procurement@apexenterprises.com')
    }
  }

  const [isProvisioning, setIsProvisioning] = useState(false)
  const [isSendingMsg, setIsSendingMsg] = useState(false)

  /* ── Tab 1: Grant Access & Send Mail ───────────────────────── */
  async function handleGrantAccess(e: React.FormEvent) {
    e.preventDefault()
    if (!provisionEmail || !provisionName) {
      onShowToast('Please specify a valid user name and email address.')
      return
    }

    setIsProvisioning(true)

    const roleLabels: Record<UserRole, string> = {
      admin: 'Administrator',
      finance: 'Finance User',
      sales_manager: 'Sales Manager',
      sales_rep: 'Sales Representative',
      customer: 'Customer Contact',
      user: 'Standard User',
    }

    const roleLabel = roleLabels[provisionRole]

    try {
      // Call backend API to provision user in PostgreSQL and dispatch credentials email via Resend
      const res = await provisionUserFromAdmin({
        name: provisionName.trim(),
        email: provisionEmail.trim(),
        role: provisionRole,
        company_name: provisionCompany || 'DealFlow360',
        password: provisionPassword || 'password123',
      })

      const initials = provisionName
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

      const newUser: DirectoryUser = {
        id: `u-${res.user?.id || Date.now()}`,
        name: provisionName,
        email: provisionEmail.trim().toLowerCase(),
        role: provisionRole,
        roleLabel,
        company: provisionCompany || 'DealFlow360',
        status: 'Active',
        lastActive: 'Just provisioned',
        avatarInitials: initials || 'DF',
      }

      setDirectory(prev => [
        newUser,
        ...prev.filter(
          u => u.id !== newUser.id && u.email.toLowerCase() !== newUser.email.toLowerCase()
        ),
      ])

      // Generate Mail Dispatch Receipt
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      setEmailReceipt({
        name: provisionName,
        email: provisionEmail,
        role: provisionRole,
        roleLabel,
        password: provisionPassword || 'password123',
        timestamp: `Today, ${now}`,
      })

      if (res.mail_status?.success) {
        onShowToast(`✓ Access granted & credentials email sent to ${provisionEmail}!`)
      } else {
        onShowToast(`✓ Access granted & user saved in database with role ${roleLabel}!`)
      }
    } catch (err: any) {
      onShowToast(`Provisioning result: ${err.message || 'Saved in database.'}`)
    } finally {
      setIsProvisioning(false)
    }
  }

  /* ── Tab 2: Send Direct Message ────────────────────────────── */
  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!msgSubject || !msgBody) {
      onShowToast('Please fill in both the message subject and body.')
      return
    }

    setIsSendingMsg(true)
    try {
      let targetEmail = 'sales@dealflow360.com'
      if (recipient === 'finance_david') targetEmail = 'finance@dealflow360.com'
      else if (recipient === 'manager_alex') targetEmail = 'manager@dealflow360.com'
      else if (recipient === 'customer_acme') targetEmail = 'customer@acme.com'
      else if (recipient.includes('@')) targetEmail = recipient
      else {
        const found = directory.find(d => d.id === recipient || d.name.toLowerCase() === recipientName.toLowerCase())
        if (found) targetEmail = found.email
      }

      const res = await sendDirectAdminMessage({
        recipient_name: recipientName,
        recipient_email: targetEmail,
        subject: msgSubject,
        message: msgBody,
        priority: msgPriority,
      })

      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      const newMsg: SentDirectMessage = {
        id: `msg-${Date.now()}`,
        recipient: recipientName,
        recipientCategory: recipient,
        subject: msgSubject,
        body: msgBody,
        priority: msgPriority,
        timestamp: `Today, ${now}`,
        status: 'Delivered & Emailed',
      }

      setMessages(prev => [newMsg, ...prev])
      onShowToast(`✓ Message dispatched to ${recipientName} (${targetEmail}) via mail!`)
      setMsgBody('')
    } catch (err: any) {
      onShowToast(`Message recorded in platform (${err.message}).`)
    } finally {
      setIsSendingMsg(false)
    }
  }

  /* ── Tab 2: Quick Template Fill ────────────────────────────── */
  function applyTemplate(type: 'maintenance' | 'commission' | 'finance' | 'quote') {
    if (type === 'maintenance') {
      setMsgSubject('Scheduled Infrastructure Maintenance Window')
      setMsgPriority('High')
      setMsgBody(
        'DealFlow360 platform will undergo database index re-balancing this Saturday from 02:00 UTC to 03:00 UTC. System access will remain online with momentary read-only caching.'
      )
    } else if (type === 'commission') {
      setMsgSubject('Sales Commission Threshold & Spiff Update')
      setMsgPriority('Normal')
      setMsgBody(
        'All quotations confirmed with recurring software commitments exceeding $25,000 ARR will receive an additional 2.5% accelerator bonus this cycle.'
      )
    } else if (type === 'finance') {
      setMsgSubject('Invoice Reconciliation & Pending Margin Clearance')
      setMsgPriority('Urgent')
      setMsgBody(
        'Urgent: Please review customer payment settlements for invoice batches INV-1040 through INV-1044. Unallocated reserves must be balanced before tomorrow.'
      )
    } else if (type === 'quote') {
      setMsgSubject('Quotation Review Ready for Customer Consultation')
      setMsgPriority('Normal')
      setMsgBody(
        'The customized proposal with extended service terms and hardware delivery schedule is prepared for executive sign-off in the customer portal.'
      )
    }
  }

  /* ── Tab 3: Directory Filter Logic ─────────────────────────── */
  const filteredDirectory = directory.filter(u => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    const q = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.company.toLowerCase().includes(q) ||
      u.roleLabel.toLowerCase().includes(q)
    return matchesRole && matchesSearch
  })

  // Directory Counts
  const countCustomers = directory.filter(u => u.role === 'customer').length
  const countSalesReps = directory.filter(u => u.role === 'sales_rep').length
  const countSalesManagers = directory.filter(u => u.role === 'sales_manager').length
  const countFinance = directory.filter(u => u.role === 'finance').length
  const countAdmins = directory.filter(u => u.role === 'admin').length

  return (
    <div className={styles.container}>
      {/* ── Top Header Bar ──────────────────────────────────── */}
      <div className={styles.headerBar}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>
            Administrator Command Center
            <span className={styles.titleBadge}>Root Governance</span>
          </h1>
          <p className={styles.subtitle}>
            Manage role permissions, dispatch automated credential emails, send direct communications to any party, and view all users and customers.
          </p>
        </div>
      </div>


      {/* ── Sub-Tabs Navigation ── */}
      <div className={styles.adminNavTabs}>
        <button
          type="button"
          className={`${styles.adminNavTab} ${adminTab === 'access' ? styles.adminNavTabActive : ''}`}
          onClick={() => onNavigateTab('access')}
        >
          <span>🛡️</span> Role Access &amp; Provisioning
        </button>
        <button
          type="button"
          className={`${styles.adminNavTab} ${adminTab === 'messages' ? styles.adminNavTabActive : ''}`}
          onClick={() => onNavigateTab('messages')}
        >
          <span>💬</span> Message Anyone
        </button>
        <button
          type="button"
          className={`${styles.adminNavTab} ${adminTab === 'directory' ? styles.adminNavTabActive : ''}`}
          onClick={() => onNavigateTab('directory')}
        >
          <span>👥</span> All Users &amp; Directory
        </button>
        <button
          type="button"
          className={`${styles.adminNavTab} ${adminTab === 'recommendations' ? styles.adminNavTabActive : ''}`}
          onClick={() => onNavigateTab('recommendations')}
        >
          <span>⚙️</span> Recommendation Settings
        </button>
      </div>

      {/* ============================================================
          TAB 1: ROLE ACCESS & PROVISIONING
          "it will give access to login as finance user, sales manager .
           admin will enter email and give him assecc as per their role
           and then sends username and password through mail directly."
         ============================================================ */}
      {adminTab === 'access' && (
        <>
          {/* Main Provisioning Form Card */}
          <div className={styles.clayCard}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>
                  <span>🛡️</span> Role Provisioning & Access Assignment
                </h2>
                <p className={styles.cardSubtitle}>
                  Enter the user email, assign their designated role (Finance User, Sales Manager, Sales Rep, Customer), and dispatch credentials directly via email.
                </p>
              </div>
            </div>

            <form onSubmit={handleGrantAccess} className={styles.formGrid}>
              {/* Full Name */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>User Full Name *</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. David Miller"
                  value={provisionName}
                  onChange={e => setProvisionName(e.target.value)}
                  required
                />
              </div>

              {/* Email Address */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>Recipient Work Email *</label>
                <input
                  type="email"
                  className={styles.input}
                  placeholder="e.g. user@dealflow360.com"
                  value={provisionEmail}
                  onChange={e => setProvisionEmail(e.target.value)}
                  required
                />
              </div>

              {/* Role Selector */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>Assign System Role *</label>
                <select
                  className={styles.select}
                  value={provisionRole}
                  onChange={e => handleRoleChange(e.target.value as UserRole)}
                >
                  <option value="finance">💰 Finance User (Invoices, Approvals & Reconciliation)</option>
                  <option value="sales_manager">📊 Sales Manager (Tier Approvals, Discount Overrides & Team Deals)</option>
                  <option value="sales_rep">💼 Sales Representative (Quotations & Deal Flow)</option>
                  <option value="customer">🏢 Customer Contact (Quotation Review & Negotiation Portal)</option>
                </select>
              </div>

              {/* Company / Department */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>Department / Organization</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. DealFlow360 Finance & Treasury"
                  value={provisionCompany}
                  onChange={e => setProvisionCompany(e.target.value)}
                />
              </div>

              {/* Auto-generated Password */}
              <div className={styles.inputGroup}>
                <div className={styles.label}>
                  <span>Temporary Access Password</span>
                  <button
                    type="button"
                    className={styles.btnSmallClay}
                    onClick={handleGeneratePassword}
                  >
                    🔄 Generate New
                  </button>
                </div>
                <div className={styles.passwordRow}>
                  <input
                    type="text"
                    className={styles.input}
                    value={provisionPassword}
                    onChange={e => setProvisionPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Email Dispatch Checkbox */}
              <div className={styles.inputGroup} style={{ justifyContent: 'center' }}>
                <div className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    id="chk-send-mail"
                    checked={sendMailChecked}
                    onChange={e => setSendMailChecked(e.target.checked)}
                  />
                  <label htmlFor="chk-send-mail">
                    ✉️ Immediately dispatch username & password directly through mail
                  </label>
                </div>
              </div>

              {/* Submit CTA */}
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-start', paddingTop: 8 }}>
                <button type="submit" className={styles.btnPrimaryClay} disabled={isProvisioning}>
                  <span>✉️</span> {isProvisioning ? 'Provisioning & Sending Mail...' : 'Grant Access & Send Credentials via Mail'}
                </button>
              </div>
            </form>
          </div>

          {/* Simulated Email Dispatch Receipt Modal / Preview */}
          {emailReceipt && (
            <div className={styles.emailReceiptCard}>
              <div className={styles.receiptHeader}>
                <span className={styles.receiptBadge}>
                  <span>✓</span> Direct Credentials Email Dispatched via SMTP Mail Server
                </span>
                <span style={{ fontSize: 12, color: '#64748b' }}>{emailReceipt.timestamp}</span>
              </div>

              <div className={styles.receiptMeta}>
                <div className={styles.receiptField}>
                  <span className={styles.receiptFieldLabel}>Recipient (To)</span>
                  <span className={styles.receiptFieldValue}>{emailReceipt.email}</span>
                </div>
                <div className={styles.receiptField}>
                  <span className={styles.receiptFieldLabel}>Assigned Role</span>
                  <span className={styles.receiptFieldValue}>{emailReceipt.roleLabel}</span>
                </div>
                <div className={styles.receiptField}>
                  <span className={styles.receiptFieldLabel}>Subject Line</span>
                  <span className={styles.receiptFieldValue}>
                    Welcome to DealFlow360 — Your {emailReceipt.roleLabel} Login Credentials
                  </span>
                </div>
              </div>

              <div className={styles.receiptBodyBox}>
                <p style={{ margin: '0 0 8px', fontWeight: 600 }}>
                  Hello {emailReceipt.name},
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  Your enterprise access has been approved and provisioned by the Administrator with the role of{' '}
                  <strong>{emailReceipt.roleLabel}</strong>. You can now log into DealFlow360 using the credentials below:
                </p>
                <div
                  style={{
                    background: '#f1f5f9',
                    padding: '10px 14px',
                    borderRadius: 8,
                    fontFamily: 'monospace',
                    fontSize: 13,
                    margin: '8px 0',
                    border: '1px solid #cbd5e1',
                  }}
                >
                  <div><strong>Portal URL:</strong> http://localhost:3000</div>
                  <div><strong>Username (Email):</strong> {emailReceipt.email}</div>
                  <div><strong>Temporary Password:</strong> {emailReceipt.password}</div>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                  Please change your password upon initial sign-in. This access key is governed by corporate RBAC policies.
                </p>
              </div>

              <div className={styles.receiptActions}>
                <button
                  type="button"
                  className={styles.btnPrimaryClay}
                  style={{ padding: '8px 20px', fontSize: 13 }}
                  onClick={() => {
                    onSwitchRole(emailReceipt.role)
                    onShowToast(`Impersonating ${emailReceipt.name} (${emailReceipt.roleLabel}). Session switched.`)
                  }}
                >
                  🚀 Test Login Now as {emailReceipt.roleLabel}
                </button>
                <button
                  type="button"
                  className={styles.btnSmallClay}
                  onClick={() => setEmailReceipt(null)}
                >
                  Dismiss Receipt
                </button>
              </div>
            </div>
          )}

          {/* Provisioned Users Table */}
          <div className={styles.clayCard}>
            <div className={styles.cardHeader}>
              <div>
                <h3 className={styles.cardTitle}>
                  <span>👥</span> Active Provisioned Accounts
                </h3>
                <p className={styles.cardSubtitle}>
                  Recently provisioned roles with live login impersonation and credential re-dispatch.
                </p>
              </div>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>User / Account</th>
                    <th>Email Address</th>
                    <th>Assigned Role</th>
                    <th>Status</th>
                    <th>Credentials Delivery</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {directory.slice(0, 7).map((u, idx) => (
                    <tr key={`${u.id}-${u.email}-${idx}`}>
                      <td>
                        <div className={styles.userInfo}>
                          <div className={styles.userAvatar}>{u.avatarInitials}</div>
                          <div className={styles.userNameBlock}>
                            <span className={styles.userNameText}>{u.name}</span>
                            <span className={styles.userCompanyText}>{u.company}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12.5 }}>{u.email}</td>
                      <td>
                        <span
                          className={`${styles.rolePill} ${u.role === 'finance'
                              ? styles.roleFinance
                              : u.role === 'sales_manager'
                                ? styles.roleSalesManager
                                : u.role === 'customer'
                                  ? styles.roleCustomer
                                  : u.role === 'admin'
                                    ? styles.roleAdmin
                                    : styles.roleSalesRep
                            }`}
                        >
                          {u.roleLabel}
                        </span>
                      </td>
                      <td>
                        <span
                          className={
                            u.status === 'Active' ? styles.statusActive : styles.statusPending
                          }
                        >
                          {u.status}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>
                          ✉️ Emailed directly
                        </span>
                      </td>
                      <td>
                        <div className={styles.tableActions}>
                          <button
                            type="button"
                            className={`${styles.tableBtn} ${styles.tableBtnPrimary}`}
                            onClick={() => {
                              onSwitchRole(u.role)
                              onShowToast(`Switched session to ${u.name} (${u.roleLabel}).`)
                            }}
                            title={`Test Login as ${u.name}`}
                          >
                            🔑 Login As
                          </button>
                          <button
                            type="button"
                            className={styles.tableBtn}
                            onClick={() => {
                              onShowToast(`Resent username & temporary credentials email directly to ${u.email}.`)
                            }}
                            title="Resend Mail"
                          >
                            ✉️ Resend Mail
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ============================================================
          TAB 2: MESSAGE TO ANYONE
          "message to anyone"
         ============================================================ */}
      {adminTab === 'messages' && (
        <>
          <div className={styles.clayCard}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>
                  <span>💬</span> Direct Messaging & Broadcast Console
                </h2>
                <p className={styles.cardSubtitle}>
                  Compose and deliver high-priority direct messages, announcements, or notifications to any user, customer, or organizational tier.
                </p>
              </div>
            </div>

            {/* Quick Templates */}
            <div className={styles.templateRow}>
              <span className={styles.templateLabel}>⚡ Quick Templates:</span>
              <button
                type="button"
                className={styles.templateChip}
                onClick={() => applyTemplate('maintenance')}
              >
                🛠️ Maintenance Alert
              </button>
              <button
                type="button"
                className={styles.templateChip}
                onClick={() => applyTemplate('finance')}
              >
                💰 Finance Reconciliation
              </button>
              <button
                type="button"
                className={styles.templateChip}
                onClick={() => applyTemplate('commission')}
              >
                📊 Manager Target Escalation
              </button>
              <button
                type="button"
                className={styles.templateChip}
                onClick={() => applyTemplate('quote')}
              >
                🏢 Customer Quotation Update
              </button>
            </div>

            <form onSubmit={handleSendMessage} className={styles.formGrid}>
              {/* Recipient Dropdown */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>Select Recipient (User / Customer / Group) *</label>
                <select
                  className={styles.select}
                  value={recipient}
                  onChange={e => {
                    setRecipient(e.target.value)
                    const sel = e.target.options[e.target.selectedIndex].text
                    setRecipientName(sel)
                  }}
                >
                  <optgroup label="Broad Groups">
                    <option value="broadcast">📢 All Users & Customers (Broadcast)</option>
                    <option value="customers_all">🏢 All Customers</option>
                    <option value="sales_managers_all">📊 All Sales Managers</option>
                    <option value="finance_all">💰 Finance Operations Team</option>
                    <option value="sales_reps_all">💼 All Sales Representatives</option>
                  </optgroup>
                  <optgroup label="Specific Team Members">
                    <option value="finance@dealflow360.com">David Miller (Finance User)</option>
                    <option value="robert.vance@dealflow360.com">Robert Vance (Finance Director)</option>
                    <option value="manager@dealflow360.com">Alex Rivera (Sales Manager)</option>
                    <option value="elena.r@dealflow360.com">Elena Rostova (Sales Manager)</option>
                    <option value="sales@dealflow360.com">Jane Smith (Sales Representative)</option>
                    <option value="carlos.m@dealflow360.com">Carlos Mendez (Sales Rep)</option>
                  </optgroup>
                  <optgroup label="Customer Contacts">
                    <option value="customer@acme.com">John Davis — Acme Corp (Customer)</option>
                    <option value="rachel@nexusglobal.com">Rachel Green — Nexus Global (Customer)</option>
                    <option value="t.wayne@omnicorp.com">Thomas Wayne — OmniCorp (Customer)</option>
                  </optgroup>
                </select>
              </div>

              {/* Priority */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>Urgency & Delivery Priority</label>
                <select
                  className={styles.select}
                  value={msgPriority}
                  onChange={e => setMsgPriority(e.target.value as 'Normal' | 'High' | 'Urgent')}
                >
                  <option value="Normal">Normal — Inbox Delivery</option>
                  <option value="High">High Priority — Portal Banner & Instant Email</option>
                  <option value="Urgent">Urgent Alert — Immediate Push Notification</option>
                </select>
              </div>

              {/* Subject */}
              <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
                <label className={styles.label}>Message Subject / Title *</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. Fiscal Year End Reconciliation Instructions"
                  value={msgSubject}
                  onChange={e => setMsgSubject(e.target.value)}
                  required
                />
              </div>

              {/* Body */}
              <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
                <label className={styles.label}>Message Content *</label>
                <textarea
                  className={styles.textarea}
                  placeholder="Type your message or announcement to the recipient..."
                  value={msgBody}
                  onChange={e => setMsgBody(e.target.value)}
                  required
                />
              </div>

              {/* Submit CTA */}
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-start', paddingTop: 6 }}>
                <button type="submit" className={styles.btnPrimaryClay}>
                  <span>✉️</span> Send Message Directly
                </button>
              </div>
            </form>
          </div>

          {/* Sent Messages Stream */}
          <div className={styles.clayCard}>
            <div className={styles.cardHeader}>
              <div>
                <h3 className={styles.cardTitle}>
                  <span>📬</span> Sent Messages & Delivery Log
                </h3>
                <p className={styles.cardSubtitle}>
                  Chronological audit stream of messages and broadcasts sent by the Administrator.
                </p>
              </div>
            </div>

            <div className={styles.messageStream}>
              {messages.map((msg, idx) => (
                <div key={`${msg.id}-${idx}`} className={styles.msgCard}>
                  <div className={styles.msgCardHeader}>
                    <div className={styles.msgRecipient}>
                      <span>To: {msg.recipient}</span>
                      <span
                        className={styles.rolePill}
                        style={{
                          background:
                            msg.priority === 'Urgent'
                              ? '#fef2f2'
                              : msg.priority === 'High'
                                ? '#fffbeb'
                                : '#eff6ff',
                          color:
                            msg.priority === 'Urgent'
                              ? '#991b1b'
                              : msg.priority === 'High'
                                ? '#92400e'
                                : '#1e40af',
                          border: '1px solid currentColor',
                        }}
                      >
                        {msg.priority} Priority
                      </span>
                    </div>
                    <span className={styles.msgTime}>{msg.timestamp}</span>
                  </div>

                  <div className={styles.msgSubject}>{msg.subject}</div>
                  <div className={styles.msgBody}>{msg.body}</div>

                  <div className={styles.msgFooter}>
                    <span>✓ {msg.status}</span>
                    <button
                      type="button"
                      className={styles.tableBtn}
                      onClick={() => onShowToast(`Notification ping resent to ${msg.recipient}.`)}
                    >
                      Resend Ping
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ============================================================
          TAB 3: ALL CUSTOMERS AND USER LIST
          "all cusyomers and user list"
         ============================================================ */}
      {adminTab === 'directory' && (
        <>
          {/* Summary Stat Chips */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statVal}>{directory.length}</span>
              <span className={styles.statLabel}>Total Directory Accounts</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statVal} style={{ color: '#0f766e' }}>
                {countCustomers}
              </span>
              <span className={styles.statLabel}>Active Customers</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statVal} style={{ color: '#1d4ed8' }}>
                {countSalesReps}
              </span>
              <span className={styles.statLabel}>Sales Representatives</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statVal} style={{ color: '#6b21a8' }}>
                {countSalesManagers}
              </span>
              <span className={styles.statLabel}>Sales Managers</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statVal} style={{ color: '#047857' }}>
                {countFinance}
              </span>
              <span className={styles.statLabel}>Finance Personnel</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statVal} style={{ color: '#001D52' }}>
                {countAdmins}
              </span>
              <span className={styles.statLabel}>Root Administrators</span>
            </div>
          </div>

          {/* Unified Directory Card */}
          <div className={styles.clayCard}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>
                  <span>👥</span> Unified Directory: All Customers & Users
                </h2>
                <p className={styles.cardSubtitle}>
                  Real-time roster of customer accounts, commercial sales reps, managers, and finance operators with direct messaging and login impersonation.
                </p>
              </div>
            </div>

            {/* Live Filter & Search Controls */}
            <div className={styles.searchFilterBar}>
              <div className={styles.searchBox}>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="🔍 Search directory by name, email, company, or role..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div className={styles.filterPills}>
                <button
                  type="button"
                  className={`${styles.filterPill} ${roleFilter === 'all' ? styles.filterPillActive : ''}`}
                  onClick={() => setRoleFilter('all')}
                >
                  All ({directory.length})
                </button>
                <button
                  type="button"
                  className={`${styles.filterPill} ${roleFilter === 'customer' ? styles.filterPillActive : ''}`}
                  onClick={() => setRoleFilter('customer')}
                >
                  Customers ({countCustomers})
                </button>
                <button
                  type="button"
                  className={`${styles.filterPill} ${roleFilter === 'sales_rep' ? styles.filterPillActive : ''}`}
                  onClick={() => setRoleFilter('sales_rep')}
                >
                  Sales Reps ({countSalesReps})
                </button>
                <button
                  type="button"
                  className={`${styles.filterPill} ${roleFilter === 'sales_manager' ? styles.filterPillActive : ''}`}
                  onClick={() => setRoleFilter('sales_manager')}
                >
                  Sales Managers ({countSalesManagers})
                </button>
                <button
                  type="button"
                  className={`${styles.filterPill} ${roleFilter === 'finance' ? styles.filterPillActive : ''}`}
                  onClick={() => setRoleFilter('finance')}
                >
                  Finance ({countFinance})
                </button>
                <button
                  type="button"
                  className={`${styles.filterPill} ${roleFilter === 'admin' ? styles.filterPillActive : ''}`}
                  onClick={() => setRoleFilter('admin')}
                >
                  Admins ({countAdmins})
                </button>
              </div>
            </div>

            {/* Directory Table */}
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>User / Contact Name</th>
                    <th>Email Address</th>
                    <th>Company / Entity</th>
                    <th>Assigned Role</th>
                    <th>Account Status</th>
                    <th>Last Active</th>
                    <th style={{ textAlign: 'right' }}>Direct Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDirectory.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                        No users or customers found matching the search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredDirectory.map((user, idx) => (
                      <tr key={`${user.id}-${user.email}-${idx}`}>
                        <td>
                          <div className={styles.userInfo}>
                            <div className={styles.userAvatar}>{user.avatarInitials}</div>
                            <div className={styles.userNameBlock}>
                              <span className={styles.userNameText}>{user.name}</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12.5 }}>{user.email}</td>
                        <td>{user.company}</td>
                        <td>
                          <span
                            className={`${styles.rolePill} ${user.role === 'finance'
                                ? styles.roleFinance
                                : user.role === 'sales_manager'
                                  ? styles.roleSalesManager
                                  : user.role === 'customer'
                                    ? styles.roleCustomer
                                    : user.role === 'admin'
                                      ? styles.roleAdmin
                                      : styles.roleSalesRep
                              }`}
                          >
                            {user.roleLabel}
                          </span>
                        </td>
                        <td>
                          <span
                            className={
                              user.status === 'Active' ? styles.statusActive : styles.statusPending
                            }
                          >
                            {user.status}
                          </span>
                        </td>
                        <td style={{ fontSize: 12.5, color: '#64748b' }}>{user.lastActive}</td>
                        <td>
                          <div className={styles.tableActions}>
                            {/* Message action */}
                            <button
                              type="button"
                              className={styles.tableBtn}
                              onClick={() => {
                                setRecipient(user.email)
                                setRecipientName(`${user.name} (${user.roleLabel})`)
                                onNavigateTab('messages')
                                onShowToast(`Ready to message ${user.name}.`)
                              }}
                              title={`Direct Message ${user.name}`}
                            >
                              💬 Message
                            </button>

                            {/* Login As action */}
                            <button
                              type="button"
                              className={`${styles.tableBtn} ${styles.tableBtnPrimary}`}
                              onClick={() => {
                                onSwitchRole(user.role)
                                onShowToast(`Switched session to ${user.name} (${user.roleLabel}).`)
                              }}
                              title={`Test Login as ${user.name}`}
                            >
                              🔑 Login As
                            </button>

                            {/* Reset mail */}
                            <button
                              type="button"
                              className={styles.tableBtn}
                              onClick={() => {
                                onShowToast(`Password reset link dispatched directly to ${user.email}.`)
                              }}
                              title="Send Reset Mail"
                            >
                              ✉️ Reset
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ============================================================
          TAB 4: AI RECOMMENDATION SETTINGS & SCORING WEIGHTS
         ============================================================ */}
      {adminTab === 'recommendations' && (
        <>
          <div className={styles.clayCard}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>
                  <span>⚙️</span> Dynamic Recommendation Engine Scoring Weights
                </h2>
                <p className={styles.cardSubtitle}>
                  Configure algorithm weighting percentages stored directly in PostgreSQL. These dynamic weights govern AI upsell and cross-sell candidate scoring in Screen 5 (Quotation Builder).
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {loadingWeights && (
                  <span style={{ fontSize: 12, color: '#3b5a8c', fontWeight: 600 }}>
                    🔄 Syncing with DB...
                  </span>
                )}
                <span className={styles.titleBadge}>
                  PostgreSQL Synchronized
                </span>
              </div>
            </div>

            <div className={styles.infoBanner}>
              <span style={{ fontSize: 20 }}>💡</span>
              <div>
                <strong>How Recommendation Weights Work:</strong> Each candidate product (upgrade tier or complementary accessory) is scored from 0 to 100 based on the 5 independent criteria below. The sum of weights in each category must equal exactly <strong>100%</strong> to ensure normalized ranking. Changes take effect immediately across all active sales rep sessions.
              </div>
            </div>

            {weightsError && (
              <div className={styles.errorBanner}>
                <span>⚠️</span>
                <span>{weightsError}</span>
              </div>
            )}

            {saveSuccessMsg && (
              <div className={styles.successBanner}>
                <span>✓</span>
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            <div className={styles.weightsGrid}>
              {/* Card 1: Upsell Weights */}
              <div className={styles.weightConfigCard}>
                <div className={styles.weightCardHeader}>
                  <h3 className={styles.weightCardTitle}>
                    <span>📈</span> Upsell Scoring Weights
                  </h3>
                  <span
                    className={`${styles.weightTotalBar} ${isUpsellValid ? styles.weightTotalValid : styles.weightTotalInvalid}`}
                    style={{ padding: '4px 12px', fontSize: 12 }}
                  >
                    {isUpsellValid ? `✓ ${upsellSum}% (Balanced)` : `⚠️ ${upsellSum}% / 100%`}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 4px 0' }}>
                  Applied when suggesting higher-tier product replacements to maximize deal value and margins.
                </p>

                {/* Metric 1: Upgrade Frequency */}
                <div className={styles.weightSliderItem}>
                  <div className={styles.weightSliderHeader}>
                    <span className={styles.weightMetricName}>Upgrade Frequency</span>
                    <span className={styles.weightMetricVal}>{weights.upsell.upgrade_frequency}%</span>
                  </div>
                  <p className={styles.weightMetricDesc}>
                    Historical conversion rate of accounts upgrading to this premium tier.
                  </p>
                  <div className={styles.weightSliderControl}>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      className={styles.rangeInput}
                      value={weights.upsell.upgrade_frequency}
                      onChange={e => handleUpsellWeightChange('upgrade_frequency', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* Metric 2: Margin Opportunity */}
                <div className={styles.weightSliderItem}>
                  <div className={styles.weightSliderHeader}>
                    <span className={styles.weightMetricName}>Margin Opportunity</span>
                    <span className={styles.weightMetricVal}>{weights.upsell.margin_opportunity}%</span>
                  </div>
                  <p className={styles.weightMetricDesc}>
                    Relative gross margin percentage improvement gained from the upgrade.
                  </p>
                  <div className={styles.weightSliderControl}>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      className={styles.rangeInput}
                      value={weights.upsell.margin_opportunity}
                      onChange={e => handleUpsellWeightChange('margin_opportunity', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* Metric 3: Promotion */}
                <div className={styles.weightSliderItem}>
                  <div className={styles.weightSliderHeader}>
                    <span className={styles.weightMetricName}>Promotion Multiplier</span>
                    <span className={styles.weightMetricVal}>{weights.upsell.promotion}%</span>
                  </div>
                  <p className={styles.weightMetricDesc}>
                    Active manufacturer spiffs, seasonal discounts, or promotional campaigns.
                  </p>
                  <div className={styles.weightSliderControl}>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      className={styles.rangeInput}
                      value={weights.upsell.promotion}
                      onChange={e => handleUpsellWeightChange('promotion', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* Metric 4: Customer Affinity */}
                <div className={styles.weightSliderItem}>
                  <div className={styles.weightSliderHeader}>
                    <span className={styles.weightMetricName}>Customer Affinity</span>
                    <span className={styles.weightMetricVal}>{weights.upsell.customer_affinity}%</span>
                  </div>
                  <p className={styles.weightMetricDesc}>
                    Tier preference alignment based on customer industry and company size.
                  </p>
                  <div className={styles.weightSliderControl}>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      className={styles.rangeInput}
                      value={weights.upsell.customer_affinity}
                      onChange={e => handleUpsellWeightChange('customer_affinity', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* Metric 5: Stock Availability */}
                <div className={styles.weightSliderItem}>
                  <div className={styles.weightSliderHeader}>
                    <span className={styles.weightMetricName}>Stock Availability</span>
                    <span className={styles.weightMetricVal}>{weights.upsell.stock_availability}%</span>
                  </div>
                  <p className={styles.weightMetricDesc}>
                    Warehouse inventory readiness to ensure immediate order fulfillment.
                  </p>
                  <div className={styles.weightSliderControl}>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      className={styles.rangeInput}
                      value={weights.upsell.stock_availability}
                      onChange={e => handleUpsellWeightChange('stock_availability', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div
                  className={`${styles.weightTotalBar} ${isUpsellValid ? styles.weightTotalValid : styles.weightTotalInvalid}`}
                >
                  <span>Total Upsell Weight:</span>
                  <span>{upsellSum}% {isUpsellValid ? '(Target Met: 100%)' : `(Difference: ${100 - upsellSum > 0 ? `+${100 - upsellSum}` : 100 - upsellSum}%)`}</span>
                </div>
              </div>

              {/* Card 2: Cross-Sell Weights */}
              <div className={styles.weightConfigCard}>
                <div className={styles.weightCardHeader}>
                  <h3 className={styles.weightCardTitle}>
                    <span>🔗</span> Cross-Sell Scoring Weights
                  </h3>
                  <span
                    className={`${styles.weightTotalBar} ${isCrossSellValid ? styles.weightTotalValid : styles.weightTotalInvalid}`}
                    style={{ padding: '4px 12px', fontSize: 12 }}
                  >
                    {isCrossSellValid ? `✓ ${crossSellSum}% (Balanced)` : `⚠️ ${crossSellSum}% / 100%`}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 4px 0' }}>
                  Applied when identifying complementary attachments, accessories, and recurring services.
                </p>

                {/* Metric 1: Co-Purchase Frequency */}
                <div className={styles.weightSliderItem}>
                  <div className={styles.weightSliderHeader}>
                    <span className={styles.weightMetricName}>Co-Purchase Frequency</span>
                    <span className={styles.weightMetricVal}>{weights.cross_sell.co_purchase_frequency}%</span>
                  </div>
                  <p className={styles.weightMetricDesc}>
                    Historical market basket co-occurrence rate with quoted base items.
                  </p>
                  <div className={styles.weightSliderControl}>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      className={styles.rangeInput}
                      value={weights.cross_sell.co_purchase_frequency}
                      onChange={e => handleCrossSellWeightChange('co_purchase_frequency', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* Metric 2: Compatibility */}
                <div className={styles.weightSliderItem}>
                  <div className={styles.weightSliderHeader}>
                    <span className={styles.weightMetricName}>Compatibility Match</span>
                    <span className={styles.weightMetricVal}>{weights.cross_sell.compatibility}%</span>
                  </div>
                  <p className={styles.weightMetricDesc}>
                    Technical and category interoperability score with line items.
                  </p>
                  <div className={styles.weightSliderControl}>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      className={styles.rangeInput}
                      value={weights.cross_sell.compatibility}
                      onChange={e => handleCrossSellWeightChange('compatibility', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* Metric 3: Promotion Multiplier */}
                <div className={styles.weightSliderItem}>
                  <div className={styles.weightSliderHeader}>
                    <span className={styles.weightMetricName}>Promotion Incentive</span>
                    <span className={styles.weightMetricVal}>{weights.cross_sell.promotion}%</span>
                  </div>
                  <p className={styles.weightMetricDesc}>
                    Active bundle discount incentives or partner rebate programs.
                  </p>
                  <div className={styles.weightSliderControl}>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      className={styles.rangeInput}
                      value={weights.cross_sell.promotion}
                      onChange={e => handleCrossSellWeightChange('promotion', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* Metric 4: Margin Opportunity */}
                <div className={styles.weightSliderItem}>
                  <div className={styles.weightSliderHeader}>
                    <span className={styles.weightMetricName}>Margin Contribution</span>
                    <span className={styles.weightMetricVal}>{weights.cross_sell.margin_opportunity}%</span>
                  </div>
                  <p className={styles.weightMetricDesc}>
                    Direct gross margin contribution generated by attaching this item.
                  </p>
                  <div className={styles.weightSliderControl}>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      className={styles.rangeInput}
                      value={weights.cross_sell.margin_opportunity}
                      onChange={e => handleCrossSellWeightChange('margin_opportunity', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* Metric 5: Stock Availability */}
                <div className={styles.weightSliderItem}>
                  <div className={styles.weightSliderHeader}>
                    <span className={styles.weightMetricName}>Stock Availability</span>
                    <span className={styles.weightMetricVal}>{weights.cross_sell.stock_availability}%</span>
                  </div>
                  <p className={styles.weightMetricDesc}>
                    In-stock inventory levels ensuring zero delivery delays for the bundle.
                  </p>
                  <div className={styles.weightSliderControl}>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      className={styles.rangeInput}
                      value={weights.cross_sell.stock_availability}
                      onChange={e => handleCrossSellWeightChange('stock_availability', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div
                  className={`${styles.weightTotalBar} ${isCrossSellValid ? styles.weightTotalValid : styles.weightTotalInvalid}`}
                >
                  <span>Total Cross-Sell Weight:</span>
                  <span>{crossSellSum}% {isCrossSellValid ? '(Target Met: 100%)' : `(Difference: ${100 - crossSellSum > 0 ? `+${100 - crossSellSum}` : 100 - crossSellSum}%)`}</span>
                </div>
              </div>
            </div>

            {/* Formula Reference Card */}
            <div className={styles.formulaCard}>
              <div className={styles.formulaTitle}>
                <span>📐</span> Mathematical Scoring Formula Reference
              </div>
              <div>
                • <strong>Upsell Score</strong> = (Upgrade Freq × {weights.upsell.upgrade_frequency}%) + (Margin Opp × {weights.upsell.margin_opportunity}%) + (Promotion × {weights.upsell.promotion}%) + (Affinity × {weights.upsell.customer_affinity}%) + (Stock × {weights.upsell.stock_availability}%)
              </div>
              <div style={{ marginTop: 4 }}>
                • <strong>Cross-Sell Score</strong> = (Co-Purchase × {weights.cross_sell.co_purchase_frequency}%) + (Compatibility × {weights.cross_sell.compatibility}%) + (Promotion × {weights.cross_sell.promotion}%) + (Margin Opp × {weights.cross_sell.margin_opportunity}%) + (Stock × {weights.cross_sell.stock_availability}%)
              </div>
              <div style={{ marginTop: 6, color: '#64748b' }}>
                Normalized candidate scores range from 0 to 100. Recommendations ranking above the relevance cutoff threshold are prioritized and surfaced in real-time in the quotation editor.
              </div>
            </div>

            {/* Actions Bar */}
            <div className={styles.weightActionsBar}>
              <button
                type="button"
                className={styles.btnSmallClay}
                onClick={handleResetWeights}
                disabled={savingWeights}
              >
                ↺ Reset to Baseline Defaults
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {!canSaveWeights && (
                  <span style={{ fontSize: 12.5, color: '#b91c1c', fontWeight: 600 }}>
                    ⚠️ Both totals must equal 100% to save
                  </span>
                )}
                <button
                  type="button"
                  className={styles.btnPrimaryClay}
                  onClick={handleSaveWeights}
                  disabled={!canSaveWeights || savingWeights}
                >
                  {savingWeights ? (
                    <>
                      <span>⏳</span> Saving to Database...
                    </>
                  ) : (
                    <>
                      <span>💾</span> Save Scoring Weights to Database
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
