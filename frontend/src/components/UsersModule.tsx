'use client'

import React, { useState } from 'react'
import styles from './AppShell.module.css'
import { UserAccount } from './types'

interface UsersModuleProps {
  users: UserAccount[]
  onAddUser: (u: UserAccount) => void
  onShowToast: (msg: string) => void
}

export default function UsersModule({
  users,
  onAddUser,
  onShowToast,
}: UsersModuleProps) {
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('Sales Rep')

  function handleSendInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail) return

    const newAccount: UserAccount = {
      id: Date.now(),
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      status: 'Pending Invite',
      inviteExpires: '48 hours',
    }

    onAddUser(newAccount)
    setIsInviteOpen(false)
    setInviteEmail('')
    onShowToast(`Secure activation invite dispatched to ${inviteEmail} (Role: ${inviteRole}).`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className={styles.moduleHeader}>
        <div>
          <h1 className={styles.moduleTitle}>Internal User Governance & Access Control</h1>
          <p className={styles.moduleSubtitle}>
            Admin-governed RBAC: Internal roles require an explicit invitation token. Customers are isolated to their quotation portal.
          </p>
        </div>
        <div className={styles.btnGroup}>
          <button className={styles.btnPrimary} onClick={() => setIsInviteOpen(true)}>
            + Invite Internal User
          </button>
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99,
          }}
        >
          <form
            onSubmit={handleSendInvite}
            style={{
              background: '#fff',
              borderRadius: 8,
              padding: 24,
              maxWidth: 420,
              width: '90%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
              Invite Internal Team Member
            </h3>
            <p style={{ fontSize: 12.5, color: '#64748b', marginBottom: 16 }}>
              A one-time activation link will be generated and emailed to the user.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                  className={styles.formInput}
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value)}
                >
                  <option value="Sales Rep">Sales Representative</option>
                  <option value="Sales Manager">Sales Manager</option>
                  <option value="Finance">Finance / Operations</option>
                  <option value="Admin">Administrator</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setIsInviteOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  Dispatch Invite Token
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className={styles.card}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User Name</th>
                <th>Email Address</th>
                <th>Assigned Role</th>
                <th>Account Status</th>
                <th>Token Expiry</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.email}</td>
                  <td>
                    <span className={styles.badge} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1' }}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        u.status === 'Active' ? styles.badgeConfirmed : styles.badgeReview
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 12, color: '#64748b' }}>
                      {u.inviteExpires || 'N/A (Active)'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {u.status === 'Pending Invite' ? (
                      <button
                        className={styles.btnSecondary}
                        style={{ padding: '3px 8px', fontSize: 12 }}
                        onClick={() => onShowToast(`Resent activation link to ${u.email}`)}
                      >
                        Resend Token
                      </button>
                    ) : (
                      <button
                        className={styles.btnSecondary}
                        style={{ padding: '3px 8px', fontSize: 12 }}
                        onClick={() => onShowToast(`Updated permissions for ${u.name}`)}
                      >
                        Edit Role
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
