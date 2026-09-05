'use client'

import React, { useState, useMemo } from 'react'
import styles from './UsersModule.module.css'
import { UserAccount } from './types'

interface UsersModuleProps {
  users: UserAccount[]
  onAddUser: (u: UserAccount) => void
  onShowToast: (msg: string) => void
}

const ROLE_PREVIEWS: Record<string, string> = {
  'Sales Rep': 'Can draft quotations, bundle products, apply discounts within tier ceilings, and request escalations.',
  'Sales Manager': 'Can approve deal discounts up to 20%, monitor deal health telemetry, and coach sales reps.',
  'Finance': 'Can review gross margins, approve credit exceptions, manage invoices, and inspect fulfillment.',
  'Admin': 'Full platform governance, RBAC management, enterprise rule settings, and sales audit oversight.',
  'Customer': 'Read-only access to customer quotation portal, document review, and direct messaging with sales.',
}

export default function UsersModule({
  users,
  onAddUser,
  onShowToast,
}: UsersModuleProps) {
  // Modal states
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('Sales Rep')

  // Edit Role modal state
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null)
  const [newRole, setNewRole] = useState('')

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL')

  // Stats calculation
  const totalUsers = users.length
  const activeCount = users.filter(u => u.status === 'Active').length
  const pendingCount = users.filter(u => u.status === 'Pending Invite').length

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesRole =
        selectedRoleFilter === 'ALL' ||
        u.role.toLowerCase() === selectedRoleFilter.toLowerCase()

      const matchesStatus =
        selectedStatusFilter === 'ALL' ||
        (selectedStatusFilter === 'ACTIVE' && u.status === 'Active') ||
        (selectedStatusFilter === 'PENDING' && u.status === 'Pending Invite')

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, searchQuery, selectedRoleFilter, selectedStatusFilter])

  function handleSendInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail) return

    const derivedName = inviteName.trim() || inviteEmail.split('@')[0]
    const newAccount: UserAccount = {
      id: Date.now(),
      name: derivedName,
      email: inviteEmail.trim().toLowerCase(),
      role: inviteRole,
      status: 'Pending Invite',
      inviteExpires: '48 hours',
    }

    onAddUser(newAccount)
    setIsInviteOpen(false)
    setInviteName('')
    setInviteEmail('')
    onShowToast(`Secure activation invite dispatched to ${inviteEmail} (Assigned Role: ${inviteRole}).`)
  }

  function handleOpenEditRole(user: UserAccount) {
    setEditingUser(user)
    setNewRole(user.role)
  }

  function handleSaveEditRole(e: React.FormEvent) {
    e.preventDefault()
    if (!editingUser) return

    // Mutate in place or notify
    editingUser.role = newRole
    setEditingUser(null)
    onShowToast(`Updated system RBAC permissions for ${editingUser.name} to ${newRole}.`)
  }

  function handleCopyEmail(email: string) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(email)
      onShowToast(`Copied ${email} to clipboard!`)
    }
  }

  function getAvatarGradient(name: string, role: string) {
    const r = role.toLowerCase()
    if (r.includes('admin')) return 'linear-gradient(135deg, #001D52 0%, #1E3A8A 100%)'
    if (r.includes('manager')) return 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)'
    if (r.includes('finance')) return 'linear-gradient(135deg, #059669 0%, #10B981 100%)'
    if (r.includes('customer')) return 'linear-gradient(135deg, #7E22CE 0%, #A855F7 100%)'
    return 'linear-gradient(135deg, #2563EB 0%, #38BDF8 100%)'
  }

  function getRoleBadgeClass(role: string) {
    const r = role.toLowerCase()
    if (r.includes('admin')) return styles.roleAdmin
    if (r.includes('manager')) return styles.roleSalesManager
    if (r.includes('finance')) return styles.roleFinance
    if (r.includes('customer')) return styles.roleCustomer
    return styles.roleSalesRep
  }

  return (
    <div className={styles.container}>
      {/* ── Module Header ── */}
      <div className={styles.headerBar}>
        <div className={styles.titleArea}>
          <div className={styles.titleRow}>
            <div className={styles.titleIconWrap}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h1 className={styles.title}>Internal User Governance &amp; Access Control</h1>
            <span className={styles.titleBadge}>RBAC Governance Active</span>
          </div>
          <p className={styles.subtitle}>
            Admin-governed Role-Based Access Control: Internal employee accounts require an explicit activation token. External customers remain strictly isolated to their dedicated quotation portal.
          </p>
        </div>

        <div>
          <button
            type="button"
            className={styles.btnPrimaryClay}
            onClick={() => setIsInviteOpen(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            + Invite Internal Team Member
          </button>
        </div>
      </div>

      {/* ── KPI Metric Stats Cards ── */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#EFF6FF', color: '#2563EB' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Total Members</span>
            <span className={styles.statValue}>{totalUsers}</span>
            <span className={styles.statMeta}>Internal &amp; Customer Accounts</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#ECFDF5', color: '#059669' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Active Accounts</span>
            <span className={styles.statValue}>{activeCount}</span>
            <span className={styles.statMeta} style={{ color: '#059669' }}>Verified &amp; Authenticated</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#FEF3C7', color: '#D97706' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Pending Invites</span>
            <span className={styles.statValue}>{pendingCount}</span>
            <span className={styles.statMeta} style={{ color: '#D97706' }}>Awaiting Activation</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#F5F3FF', color: '#7C3AED' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>RBAC Roles Configured</span>
            <span className={styles.statValue}>5 Security Roles</span>
            <span className={styles.statMeta} style={{ color: '#7C3AED' }}>Enforced on API Gateway</span>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className={styles.filterBar}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by user name or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.roleFilterPills}>
          {['ALL', 'Sales Rep', 'Sales Manager', 'Finance', 'Admin', 'Customer'].map(role => (
            <button
              key={role}
              type="button"
              className={`${styles.filterPill} ${selectedRoleFilter === role ? styles.filterPillActive : ''}`}
              onClick={() => setSelectedRoleFilter(role)}
            >
              {role === 'ALL' ? 'All Roles' : role}
            </button>
          ))}
        </div>
      </div>

      {/* ── Users Table Card ── */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>
            <span>Directory of Workspace Accounts</span>
            <span className={styles.countBadge}>{filteredUsers.length} shown</span>
          </h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className={styles.btnSecondaryClay}
              onClick={() => {
                setSelectedRoleFilter('ALL')
                setSelectedStatusFilter('ALL')
                setSearchQuery('')
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User Account</th>
                <th>Work Email Address</th>
                <th>Assigned Role</th>
                <th>Account Status</th>
                <th>Token Expiry / Active Since</th>
                <th style={{ textAlign: 'right' }}>Security Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.emptyState}>
                    No workspace members match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className={styles.userCell}>
                        <div
                          className={styles.userAvatar}
                          style={{ background: getAvatarGradient(u.name, u.role) }}
                        >
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className={styles.userNameGroup}>
                          <span className={styles.userName}>{u.name}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className={styles.userEmail}>
                        <span>{u.email}</span>
                        <button
                          type="button"
                          className={styles.copyEmailBtn}
                          onClick={() => handleCopyEmail(u.email)}
                          title="Copy email to clipboard"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                          </svg>
                        </button>
                      </div>
                    </td>

                    <td>
                      <span className={`${styles.roleBadge} ${getRoleBadgeClass(u.role)}`}>
                        {u.role}
                      </span>
                    </td>

                    <td>
                      {u.status === 'Active' ? (
                        <span className={styles.statusActive}>
                          <span className={styles.pulseDot} />
                          Active
                        </span>
                      ) : (
                        <span className={styles.statusPending}>
                          <span className={styles.clockDot} />
                          Pending Invite
                        </span>
                      )}
                    </td>

                    <td>
                      <span style={{ fontSize: 12.5, color: '#64748B' }}>
                        {u.inviteExpires ? `Expires ${u.inviteExpires}` : 'N/A (Active)'}
                      </span>
                    </td>

                    <td className={styles.actionCell}>
                      <div className={styles.actionGroup}>
                        {u.status === 'Pending Invite' ? (
                          <button
                            type="button"
                            className={`${styles.btnActionSmall} ${styles.btnActionPending}`}
                            onClick={() => onShowToast(`Resent secure activation token to ${u.email}`)}
                          >
                            Resend Token
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={styles.btnActionSmall}
                            onClick={() => handleOpenEditRole(u)}
                          >
                            Edit Role
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Invite Internal User Modal ── */}
      {isInviteOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Invite Internal Team Member</h3>
                <p className={styles.modalSubtitle}>
                  A one-time activation token will be generated and emailed to the user.
                </p>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsInviteOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendInvite} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Jordan Miller"
                  className={styles.formInput}
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Employee Work Email *</label>
                <input
                  type="email"
                  placeholder="name@dealflow360.com"
                  className={styles.formInput}
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Assigned Role *</label>
                <select
                  className={styles.formSelect}
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value)}
                >
                  <option value="Sales Rep">Sales Representative</option>
                  <option value="Sales Manager">Sales Manager</option>
                  <option value="Finance">Finance / Operations</option>
                  <option value="Admin">Administrator</option>
                </select>
              </div>

              <div className={styles.rolePreviewBox}>
                <strong>Role Permissions: </strong>
                {ROLE_PREVIEWS[inviteRole] || 'Standard enterprise workspace permissions.'}
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnSecondaryClay}
                  onClick={() => setIsInviteOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.btnPrimaryClay}>
                  Dispatch Invite Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Role Modal ── */}
      {editingUser && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Modify Role: {editingUser.name}</h3>
                <p className={styles.modalSubtitle}>
                  Update role permissions for {editingUser.email}
                </p>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setEditingUser(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditRole} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Select New Role</label>
                <select
                  className={styles.formSelect}
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                >
                  <option value="Sales Rep">Sales Representative</option>
                  <option value="Sales Manager">Sales Manager</option>
                  <option value="Finance">Finance / Operations</option>
                  <option value="Admin">Administrator</option>
                  <option value="Customer">Customer</option>
                </select>
              </div>

              <div className={styles.rolePreviewBox}>
                <strong>Updated Capabilities: </strong>
                {ROLE_PREVIEWS[newRole] || 'Standard enterprise workspace permissions.'}
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnSecondaryClay}
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.btnPrimaryClay}>
                  Save Updated Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
