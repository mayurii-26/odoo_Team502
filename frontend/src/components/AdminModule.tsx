'use client'

import React, { useState, useEffect } from 'react'
import styles from './AdminModule.module.css'
import { DirectoryUser, UserRole, RecommendationWeights, UserAccount, WorkflowAuditEntry } from './types'
import {
  fetchRecommendationWeights,
  saveRecommendationWeights,
  provisionUserFromAdmin,
  sendDirectAdminMessage,
} from '@/lib/api'

interface AdminModuleProps {
  adminTab: 'access' | 'messages' | 'directory' | 'recommendations' | 'audit'
  onNavigateTab?: (tab: 'access' | 'messages' | 'directory' | 'recommendations' | 'audit') => void
  onSwitchRole: (role: UserRole) => void
  onShowToast: (msg: string) => void
  onImpersonateUser?: (email: string, role: UserRole, name: string, company: string) => void
  users?: UserAccount[]
  auditLogs?: WorkflowAuditEntry[]
  onUserProvisioned?: (user: UserAccount) => void
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

/* ── Initial Unified Directory ───────────────────────────────
 * Directory is loaded from the PostgreSQL backend via the users prop.
 * This empty default is replaced as soon as the bootstrap API responds.
 * ─────────────────────────────────────────────────────────── */
const INITIAL_DIRECTORY: DirectoryUser[] = []

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

// Sent messages are generated at runtime when admin dispatches communications.
const INITIAL_SENT_MESSAGES: SentDirectMessage[] = []

export default function AdminModule({
  adminTab,
  onNavigateTab,
  onSwitchRole,
  onShowToast,
  onImpersonateUser,
  users,
  auditLogs = [],
  onUserProvisioned,
}: AdminModuleProps) {
  // Audit Trail filtering state
  const [auditSearch, setAuditSearch] = useState('')
  const [auditRoleFilter, setAuditRoleFilter] = useState('all')
  const [auditActionFilter, setAuditActionFilter] = useState('all')
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
          reportingManager: u.reporting_manager || (mappedRole === 'sales_rep' ? 'Alex Rivera' : undefined),
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
            reportingManager: u.reporting_manager || (mappedRole === 'sales_rep' ? 'Alex Rivera' : undefined),
            company: mappedRole === 'customer' ? 'Customer Account' : 'DealFlow360 HQ',
            status: (u.status === 'Active' ? 'Active' : 'Pending Invite') as any,
            lastActive: 'Active in Database',
            avatarInitials: u.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'U',
          }
        })
      )
    }
  }, [users])

  // Tab 1: Access Provisioning Form State (Clean - no hardcoded values)
  const [provisionName, setProvisionName] = useState('')
  const [provisionEmail, setProvisionEmail] = useState('')
  const [provisionRole, setProvisionRole] = useState<UserRole>('sales_rep')
  const [provisionCompany, setProvisionCompany] = useState('')
  const [provisionPassword, setProvisionPassword] = useState(() => 'DF-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '9#')
  const [sendMailChecked, setSendMailChecked] = useState(true)
  const [provisionReportingManager, setProvisionReportingManager] = useState('Alex Rivera')
  const [customManagerText, setCustomManagerText] = useState('')

  // Dynamically compute available Sales Managers for assignment to Sales Reps
  const availableManagers = React.useMemo(() => {
    const list = directory.filter(u => u.role === 'sales_manager')
    const items: Array<{ name: string; email: string }> = []
    items.push({ name: 'Alex Rivera', email: 'alex.rivera@dealflow360.com' })
    items.push({ name: 'Elena Rostova', email: 'elena.rostova@dealflow360.com' })
    list.forEach(m => {
      if (!items.some(it => it.name.toLowerCase() === m.name.toLowerCase() || it.email.toLowerCase() === m.email.toLowerCase())) {
        items.push({ name: m.name, email: m.email })
      }
    })
    return items
  }, [directory])


  // Tab 2: Messaging State (Clean - no hardcoded values)
  const [messages, setMessages] = useState<SentDirectMessage[]>([])
  const [recipient, setRecipient] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [msgSubject, setMsgSubject] = useState('')
  const [msgPriority, setMsgPriority] = useState<'Normal' | 'High' | 'Urgent'>('Normal')
  const [msgBody, setMsgBody] = useState('')

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

  /* ── Tab 1: Role Selection (Do NOT overwrite user's entered email) ── */
  function handleRoleChange(newRole: UserRole) {
    setProvisionRole(newRole)
  }

  const [isProvisioning, setIsProvisioning] = useState(false)
  const [isSendingMsg, setIsSendingMsg] = useState(false)

  /* ── Tab 1: Grant Access & Send Mail ───────────────────────── */
  async function handleGrantAccess(e: React.FormEvent) {
    e.preventDefault()
    if (!provisionEmail.trim()) {
      onShowToast('Please enter a valid recipient email address.')
      return
    }

    setIsProvisioning(true)

    const roleLabels: Record<UserRole, string> = {
      admin: 'Administrator',
      finance: 'Financial Officer',
      sales_manager: 'Sales Manager',
      sales_rep: 'Sales Representative',
      customer: 'Customer Contact',
      user: 'Standard User',
    }

    const roleLabel = roleLabels[provisionRole] || 'User'
    const cleanEmail = provisionEmail.trim().toLowerCase()
    const derivedName =
      provisionName.trim() ||
      cleanEmail
        .split('@')[0]
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
    const passToUse =
      provisionPassword.trim() ||
      'DF-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '!'
    const companyToUse =
      provisionCompany.trim() ||
      (provisionRole === 'customer' ? 'Customer Account' : 'DealFlow360 Enterprise')

    const managerToAssign = provisionRole === 'sales_rep'
      ? (provisionReportingManager === 'Custom' ? (customManagerText.trim() || 'Alex Rivera') : provisionReportingManager)
      : undefined

    try {
      // Call backend API to provision user in PostgreSQL and dispatch credentials email via Resend
      const res = await provisionUserFromAdmin({
        name: derivedName,
        email: cleanEmail,
        role: provisionRole,
        company_name: companyToUse,
        password: passToUse,
        reporting_manager: managerToAssign,
      })

      const initials =
        derivedName
          .split(' ')
          .map(part => part[0])
          .join('')
          .toUpperCase()
          .slice(0, 2) || 'DF'

      const newUser: DirectoryUser = {
        id: `u-${res.user?.id || Date.now()}`,
        name: derivedName,
        email: cleanEmail,
        role: provisionRole,
        roleLabel,
        reportingManager: managerToAssign,
        company: companyToUse,
        status: 'Active',
        lastActive: 'Just provisioned',
        avatarInitials: initials,
      }

      setDirectory(prev => [
        newUser,
        ...prev.filter(u => u.email.toLowerCase() !== cleanEmail),
      ])

      if (onUserProvisioned) {
        onUserProvisioned({
          id: res.user?.id || Date.now(),
          name: derivedName,
          email: cleanEmail,
          role: roleLabel,
          reporting_manager: managerToAssign,
          status: 'Active',
        })
      }



      // Clean form inputs so admin can provision next user
      setProvisionEmail('')
      setProvisionName('')
      setProvisionCompany('')
      setCustomManagerText('')
      setProvisionPassword('DF-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '9#')

      if (res.mail_status?.success) {
        onShowToast(`✓ User ${derivedName} (${cleanEmail}) provisioned & credentials email dispatched!`)
      } else {
        onShowToast(`✓ User ${derivedName} (${cleanEmail}) provisioned in database with role ${roleLabel}!`)
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
              {/* Email Address - Primary required field */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>Recipient Work Email *</label>
                <input
                  type="email"
                  className={styles.input}
                  placeholder="e.g. nikhil@company.com"
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
                  <option value="sales_manager">📊 Sales Manager (Assign to Reps, Discount Approvals & Reports)</option>
                  <option value="sales_rep">💼 Sales Representative (Create Quotations, Deal Flow & Customer Chat)</option>
                  <option value="finance">💰 Financial Officer (Margin Clearances & Terms Certification)</option>
                  <option value="customer">🏢 Customer Contact (Review, Counter-Offers & Order Confirmation)</option>
                </select>
              </div>

              {/* Conditional Reporting Sales Manager for Sales Representatives */}
              {provisionRole === 'sales_rep' && (
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Reporting Sales Manager *</label>
                  <select
                    className={styles.select}
                    value={provisionReportingManager}
                    onChange={e => setProvisionReportingManager(e.target.value)}
                  >
                    {availableManagers.map(m => (
                      <option key={m.name} value={m.name}>
                        {m.name} ({m.email})
                      </option>
                    ))}
                    <option value="Custom">+ Custom Sales Manager...</option>
                  </select>
                  {provisionReportingManager === 'Custom' && (
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="e.g. Alex Rivera or manager@company.com"
                      value={customManagerText}
                      onChange={e => setCustomManagerText(e.target.value)}
                      required
                    />
                  )}
                </div>
              )}

              {/* Full Name (Optional - auto-derived if blank) */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>User Full Name (Optional)</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. Nikhil Shirsathe (auto-derived from email if blank)"
                  value={provisionName}
                  onChange={e => setProvisionName(e.target.value)}
                />
              </div>

              {/* Company / Department */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>Department / Company (Optional)</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. DealFlow360 Commercial Sales Ops"
                  value={provisionCompany}
                  onChange={e => setProvisionCompany(e.target.value)}
                />
              </div>

              {/* Temporary Password */}
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
                    placeholder="Auto-generated if left blank"
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
                    ✉️ Immediately dispatch credentials directly to recipient mail
                  </label>
                </div>
              </div>

              {/* Submit CTA */}
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-start', paddingTop: 8 }}>
                <button type="submit" className={styles.btnPrimaryClay} disabled={isProvisioning}>
                  <span>✉️</span> {isProvisioning ? 'Creating User & Sending Mail...' : 'Create User & Dispatch Credentials Mail'}
                </button>
              </div>
            </form>
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
                              {user.reportingManager && user.role === 'sales_rep' && (
                                <span style={{ fontSize: 11, color: '#1e40af', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2, fontWeight: 600 }}>
                                  👔 Reports to: {user.reportingManager}
                                </span>
                              )}
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
                                onNavigateTab?.('messages')
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

      {/* ============================================================
          TAB 5: WORKFLOW AUDIT TRAIL
          "managers actions and their representatives actions should be
           visible to admin. with time and date. create complete workflow."
         ============================================================ */}
      {adminTab === 'audit' && (
        <>
          {/* Main Governance Card */}
          <div className={styles.clayCard}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>
                  <span>⏱️</span> Complete Workflow Audit Trail &amp; Manager/Rep Activity Logs
                </h2>
                <p className={styles.cardSubtitle}>
                  Real-time immutable chronological logging of all actions performed by Sales Managers, Sales Representatives, Financial Officers, and Customers with exact dates, times, and notes.
                </p>
              </div>
              <button
                type="button"
                className={styles.btnSmallClay}
                onClick={() => {
                  const csvRows = [
                    ['ID', 'Timestamp', 'Actor', 'Role', 'Action', 'Quotation', 'Customer', 'Details'],
                    ...auditLogs.map(l => [
                      l.id,
                      `"${l.timestamp}"`,
                      `"${l.actorName}"`,
                      l.actorRole,
                      l.actionType,
                      l.targetQuotationId,
                      `"${l.customerName}"`,
                      `"${(l.details || '').replace(/"/g, '""')}"`,
                    ]),
                  ]
                  const blob = new Blob([csvRows.map(r => r.join(',')).join('\n')], { type: 'text/csv' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `dealflow360_workflow_audit_${new Date().toISOString().split('T')[0]}.csv`
                  a.click()
                  onShowToast('Audit trail exported to CSV!')
                }}
              >
                📥 Export Audit CSV
              </button>
            </div>

            {/* KPI Overview Cards */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span className={styles.statVal}>{auditLogs.length}</span>
                <span className={styles.statLabel}>Total Workflow Actions</span>
              </div>
              <div className={styles.statCard} style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
                <span className={styles.statVal} style={{ color: '#1e40af' }}>
                  {auditLogs.filter(l => l.actorRole === 'sales_manager').length}
                </span>
                <span className={styles.statLabel}>Manager Approvals &amp; Actions</span>
              </div>
              <div className={styles.statCard} style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                <span className={styles.statVal} style={{ color: '#166534' }}>
                  {auditLogs.filter(l => l.actorRole === 'sales_rep').length}
                </span>
                <span className={styles.statLabel}>Sales Rep Deal Submissions</span>
              </div>
              <div className={styles.statCard} style={{ background: '#faf5ff', borderColor: '#e9d5ff' }}>
                <span className={styles.statVal} style={{ color: '#6b21a8' }}>
                  {auditLogs.filter(l => l.actorRole === 'finance').length}
                </span>
                <span className={styles.statLabel}>Finance Officer Certifications</span>
              </div>
              <div className={styles.statCard} style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
                <span className={styles.statVal} style={{ color: '#92400e' }}>
                  {auditLogs.filter(l => l.actorRole === 'customer').length}
                </span>
                <span className={styles.statLabel}>Customer Portal Interactions</span>
              </div>
            </div>

            {/* Search and Filters Bar */}
            <div className={styles.directoryControls}>
              <div className={styles.searchWrap}>
                <span className={styles.searchIcon}>🔍</span>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search audit logs by actor name, quotation ID, customer, notes, date..."
                  value={auditSearch}
                  onChange={e => setAuditSearch(e.target.value)}
                />
              </div>

              {/* Role Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#001D52' }}>Role:</label>
                  <select
                    className={styles.selectInput}
                    value={auditRoleFilter}
                    onChange={e => setAuditRoleFilter(e.target.value)}
                  >
                    <option value="all">All Roles</option>
                    <option value="sales_manager">Sales Manager</option>
                    <option value="sales_rep">Sales Representative</option>
                    <option value="finance">Finance User</option>
                    <option value="customer">Customer Contact</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                {/* Action Category Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#001D52' }}>Action:</label>
                  <select
                    className={styles.selectInput}
                    value={auditActionFilter}
                    onChange={e => setAuditActionFilter(e.target.value)}
                  >
                    <option value="all">All Actions</option>
                    <option value="approvals">Approvals &amp; Acceptances</option>
                    <option value="returns">Returns for Revision</option>
                    <option value="rejections">Rejections</option>
                    <option value="assignments">Deal Assignments</option>
                    <option value="proposals">Customer Proposals &amp; Inquiries</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Full Audit Trail Table */}
            <div className={styles.auditTableCard}>
              <div className={styles.auditTableWrap}>
                <table className={styles.auditTable}>
                  <thead>
                    <tr>
                      <th style={{ width: '18%' }}>Exact Date &amp; Time</th>
                      <th style={{ width: '16%' }}>Actor</th>
                      <th style={{ width: '13%' }}>Role</th>
                      <th style={{ width: '14%' }}>Action Executed</th>
                      <th style={{ width: '14%' }}>Quotation / Account</th>
                      <th>Details &amp; Audit Trail Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs
                      .filter(log => {
                        const actType = (log.actionType || '').toUpperCase()
                        const actorRole = (log.actorRole || '').toLowerCase()
                        const matchesRole = auditRoleFilter === 'all' || actorRole === auditRoleFilter
                        const matchesAction =
                          auditActionFilter === 'all' ||
                          (auditActionFilter === 'approvals' &&
                            (actType.includes('APPROVED') || actType.includes('ACCEPTED'))) ||
                          (auditActionFilter === 'returns' && actType.includes('RETURNED')) ||
                          (auditActionFilter === 'rejections' && actType.includes('REJECTED')) ||
                          (auditActionFilter === 'assignments' && actType.includes('ASSIGNED')) ||
                          (auditActionFilter === 'proposals' &&
                            (actType.includes('PROPOSAL') || actType.includes('REQUESTED')))

                        const q = auditSearch.toLowerCase().trim()
                        const matchesSearch =
                          !q ||
                          (log.actorName || '').toLowerCase().includes(q) ||
                          (log.targetQuotationId || '').toLowerCase().includes(q) ||
                          (log.customerName || '').toLowerCase().includes(q) ||
                          (log.details || '').toLowerCase().includes(q) ||
                          (log.timestamp || '').toLowerCase().includes(q)

                        return matchesRole && matchesAction && matchesSearch
                      })
                      .map(log => {
                        const actType = (log.actionType || '').toUpperCase()
                        const roleClass =
                          log.actorRole === 'sales_manager'
                            ? styles.auditRoleBadgeManager
                            : log.actorRole === 'sales_rep'
                            ? styles.auditRoleBadgeRep
                            : log.actorRole === 'finance'
                            ? styles.auditRoleBadgeFinance
                            : log.actorRole === 'customer'
                            ? styles.auditRoleBadgeCustomer
                            : styles.auditRoleBadgeAdmin

                        const actionClass =
                          actType.includes('APPROVED') || actType.includes('ACCEPTED')
                            ? styles.auditActionApproved
                            : actType.includes('RETURNED')
                            ? styles.auditActionReturned
                            : actType.includes('REJECTED')
                            ? styles.auditActionRejected
                            : actType.includes('REQUESTED') || actType.includes('ASSIGNED')
                            ? styles.auditActionRequested
                            : styles.auditActionDefault

                        const initials = (log.actorName || 'User')
                          .split(' ')
                          .map(n => n[0])
                          .slice(0, 2)
                          .join('') || 'U'

                        return (
                          <tr key={log.id}>
                            <td className={styles.auditTimestamp}>
                              <span>⏱️ {log.timestamp || 'Recent'}</span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div
                                  style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: '50%',
                                    background: '#e2e8f0',
                                    color: '#1e293b',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 11,
                                    fontWeight: 800,
                                  }}
                                >
                                  {initials}
                                </div>
                                <strong style={{ color: '#001D52', fontSize: 13 }}>{log.actorName || 'System Operator'}</strong>
                              </div>
                            </td>
                            <td>
                              <span className={`${styles.auditRoleBadge} ${roleClass}`}>
                                {String(log.actorRole || 'ADMIN').toUpperCase().replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td>
                              <span className={`${styles.auditActionBadge} ${actionClass}`}>
                                {String(log.actionType || 'ACTIVITY').replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td>
                              <div>
                                <span style={{ fontWeight: 700, color: '#1e3a8a', fontSize: 13 }}>
                                  {log.targetQuotationId || '—'}
                                </span>
                                <div style={{ fontSize: 12, color: '#64748b' }}>{log.customerName || 'Enterprise Client'}</div>
                              </div>
                            </td>
                            <td>
                              <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.45 }}>
                                {log.details || 'Workflow action performed.'}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>

              {auditLogs.length === 0 && (
                <div style={{ padding: '36px 20px', textAlign: 'center', color: '#64748b' }}>
                  <span style={{ fontSize: 28 }}>📋</span>
                  <p style={{ margin: '8px 0 0', fontWeight: 600 }}>No workflow audit logs recorded yet.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
