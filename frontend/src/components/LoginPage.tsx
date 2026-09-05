'use client'

import { useState, useEffect } from 'react'
import styles from './LoginPage.module.css'
import AppShell from './AppShell'
import { UserSession, UserRole } from './types'

/* ── Types ────────────────────────────────────────────────────────── */
type Tab = 'login' | 'signup'

/* ── Pre-configured Demo Test Accounts ────────────────────────────── */
export const DEMO_ACCOUNTS = [
  {
    email: 'sales@dealflow360.com',
    password: 'password123',
    fullName: 'Jane Smith',
    role: 'sales_rep' as const,
    companyName: 'DealFlow360',
    label: 'Sales Representative',
    desc: 'Access all sales operations tabs',
    icon: '💼',
  },
]

/* ── Login Form ───────────────────────────────────────────────────── */
function LoginForm({ onLoginSuccess }: { onLoginSuccess: (user: UserSession) => void }) {
  const [email, setEmail] = useState('sales@dealflow360.com')
  const [password, setPassword] = useState('password123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function quickFill(acc: typeof DEMO_ACCOUNTS[0]) {
    setEmail(acc.email)
    setPassword(acc.password)
    setError('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }
    setError('')
    setLoading(true)

    setTimeout(() => {
      setLoading(false)
      const cleanEmail = email.trim().toLowerCase()

      // 1. Check predefined demo accounts
      const matchedDemo = DEMO_ACCOUNTS.find(
        a => a.email.toLowerCase() === cleanEmail
      )
      if (matchedDemo) {
        if (password === matchedDemo.password || password === 'admin123' || password === 'password123') {
          onLoginSuccess({
            email: matchedDemo.email,
            fullName: matchedDemo.fullName,
            role: matchedDemo.role,
            companyName: matchedDemo.companyName,
          })
          return
        } else {
          setError(`Incorrect password for ${matchedDemo.email}. Demo password is: ${matchedDemo.password}`)
          return
        }
      }

      // 2. Check local custom registered accounts
      try {
        const stored = localStorage.getItem('dealflow_registered_users')
        if (stored) {
          const customUsers = JSON.parse(stored) as Array<{
            email: string
            password: string
            fullName: string
            companyName: string
          }>
          const matchedUser = customUsers.find(u => u.email.toLowerCase() === cleanEmail)
          if (matchedUser) {
            if (matchedUser.password === password) {
              onLoginSuccess({
                email: matchedUser.email,
                fullName: matchedUser.fullName,
                role: 'customer',
                companyName: matchedUser.companyName,
              })
              return
            } else {
              setError('Incorrect password for this account.')
              return
            }
          }
        }
      } catch {
        // ignore storage error
      }

      // 3. Fallback: If user enters an arbitrary valid-looking email with password, log in as sales rep for testing
      if (cleanEmail.includes('@') && password.length >= 6) {
        onLoginSuccess({
          email: cleanEmail,
          fullName: cleanEmail.split('@')[0],
          role: 'sales_rep',
        })
        return
      }

      setError('Invalid credentials. Use demo: admin@dealflow360.com / password123')
    }, 450)
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {error && (
        <div className={styles.errorBox} role="alert">
          <span className={styles.errorIcon}>⚠️</span> {error}
        </div>
      )}

      {/* Demo Test Credentials Selector */}
      <div className={styles.demoBox}>
        <div className={styles.demoBoxTitle}>
          <span>⚡ Test Credentials (Click to fill):</span>
          <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>Password: password123</span>
        </div>
        <div className={styles.demoBadgeGrid}>
          {DEMO_ACCOUNTS.map(acc => (
            <button
              key={acc.email}
              type="button"
              className={styles.demoBadgeBtn}
              onClick={() => quickFill(acc)}
            >
              <span className={styles.demoRole}>
                {acc.icon} {acc.label}
              </span>
              <span className={styles.demoCreds}>{acc.email}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Two-column row — Email | Password */}
      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="login-email" className={styles.label}>Email</label>
          <input
            id="login-email"
            type="email"
            className={styles.input}
            placeholder="you@company.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="login-password" className={styles.label}>Password</label>
          <input
            id="login-password"
            type="password"
            className={styles.input}
            placeholder="password123"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
      </div>

      <div className={styles.actions}>
        <button id="btn-login" type="submit" className={styles.btnPrimary} disabled={loading}>
          {loading ? <span className={styles.spinner} /> : 'Log In'}
        </button>
        <button
          id="btn-quick-admin"
          type="button"
          className={styles.btnGhost}
          onClick={() => {
            onLoginSuccess({
              email: 'admin@dealflow360.com',
              fullName: 'Sarah Connor',
              role: 'admin',
            })
          }}
        >
          1-Click Admin Demo
        </button>
      </div>

      {/* Amber info box */}
      <div className={styles.infoBox}>
        <span className={styles.infoIcon}>ℹ️</span>
        After login, internal users land on the Sales/Admin Workspace. Customers land on the Quotation Portal.
      </div>

      <ul className={styles.noteList}>
        <li>Pre-loaded with 4 enterprise roles: Admin, Sales Rep, Sales Manager, Customer</li>
        <li>Self-governing discount, approval routing, and deal health tracking</li>
        <li>Sign Up creates a new customer portal account instantly</li>
      </ul>
    </form>
  )
}

/* ── Signup Form ──────────────────────────────────────────────────── */
function SignupForm({ onSignupSuccess }: { onSignupSuccess: (user: UserSession) => void }) {
  const [step, setStep] = useState<'choose' | 'customer'>('choose')
  const [form, setForm] = useState({
    fullName: '', companyName: '', email: '', password: '', confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdUser, setCreatedUser] = useState<UserSession | null>(null)

  function update(field: keyof typeof form, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.fullName || !form.companyName || !form.email || !form.password || !form.confirmPassword) {
      setError('Please fill in all fields.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)

    setTimeout(() => {
      setLoading(false)
      const newUser: UserSession = {
        email: form.email,
        fullName: form.fullName,
        role: 'customer',
        companyName: form.companyName,
      }

      try {
        const stored = localStorage.getItem('dealflow_registered_users')
        const list = stored ? JSON.parse(stored) : []
        list.push({ ...form })
        localStorage.setItem('dealflow_registered_users', JSON.stringify(list))
      } catch {}

      setCreatedUser(newUser)
    }, 600)
  }

  if (createdUser) {
    return (
      <div className={styles.successBox}>
        <div className={styles.successIcon}>✓</div>
        <h3 className={styles.successTitle}>Customer Account Created!</h3>
        <p className={styles.successText}>
          Welcome, <strong>{createdUser.fullName}</strong> ({createdUser.companyName}).
          Your access to the Quotation Portal is ready.
        </p>
        <div style={{ marginTop: 18 }}>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => onSignupSuccess(createdUser)}
          >
            Enter Customer Portal Now →
          </button>
        </div>
      </div>
    )
  }

  /* Step 1 — Choose account type */
  if (step === 'choose') {
    return (
      <div className={styles.chooseWrap}>
        <p className={styles.chooseSubtitle}>Choose your account type to get started</p>
        <div className={styles.chooseGrid}>
          <button
            id="btn-signup-customer"
            type="button"
            className={styles.typeCard}
            onClick={() => setStep('customer')}
          >
            <span className={styles.typeIcon}>🏢</span>
            <span className={styles.typeLabel}>Customer</span>
            <span className={styles.typeDesc}>View and negotiate your quotations</span>
          </button>
          <div className={styles.typeCardDisabled}>
            <span className={styles.typeIcon}>👤</span>
            <span className={styles.typeLabel}>Employee</span>
            <span className={styles.typeDesc}>Internal team member</span>
            <span className={styles.typeBadge}>By invitation only</span>
          </div>
        </div>
        <p className={styles.inviteNote}>
          Internal team member?{' '}
          <span className={styles.inviteHighlight}>
            Your administrator will send you an invite link by email.
          </span>
        </p>
      </div>
    )
  }

  /* Step 2 — Customer registration form */
  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 2 }}>
        <button type="button" className={styles.backBtn} onClick={() => { setStep('choose'); setError('') }}>
          ← Back
        </button>
        <span className={styles.formTitle}>Create Customer Account</span>
      </div>

      {error && (
        <div className={styles.errorBox} role="alert">
          <span className={styles.errorIcon}>⚠️</span> {error}
        </div>
      )}

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="su-name" className={styles.label}>Full Name</label>
          <input
            id="su-name"
            type="text"
            className={styles.input}
            placeholder="Jane Smith"
            value={form.fullName}
            onChange={e => update('fullName', e.target.value)}
            autoComplete="name"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="su-company" className={styles.label}>Company Name</label>
          <input
            id="su-company"
            type="text"
            className={styles.input}
            placeholder="Acme Corp"
            value={form.companyName}
            onChange={e => update('companyName', e.target.value)}
            autoComplete="organization"
          />
        </div>
      </div>

      <div className={styles.fieldFull}>
        <label htmlFor="su-email" className={styles.label}>Email</label>
        <input
          id="su-email"
          type="email"
          className={styles.input}
          placeholder="you@company.com"
          value={form.email}
          onChange={e => update('email', e.target.value)}
          autoComplete="email"
        />
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="su-password" className={styles.label}>Password</label>
          <input
            id="su-password"
            type="password"
            className={styles.input}
            placeholder="Min. 6 characters"
            value={form.password}
            onChange={e => update('password', e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="su-confirm" className={styles.label}>Confirm Password</label>
          <input
            id="su-confirm"
            type="password"
            className={styles.input}
            placeholder="••••••••"
            value={form.confirmPassword}
            onChange={e => update('confirmPassword', e.target.value)}
            autoComplete="new-password"
          />
        </div>
      </div>

      <div className={styles.actions}>
        <button id="btn-create-account" type="submit" className={styles.btnPrimary} disabled={loading}>
          {loading ? <span className={styles.spinner} /> : 'Create Account'}
        </button>
      </div>

      <div className={styles.portalNote}>
        <span className={styles.infoIcon}>ℹ️</span>
        You will have access to the Customer Quotation Portal only. Internal dashboards require an admin invite.
      </div>
    </form>
  )
}

/* ── Main Exported Page Component ─────────────────────────────────── */
export default function LoginPage() {
  const [tab, setTab] = useState<Tab>('login')
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    try {
      const saved = localStorage.getItem('dealflow_active_user')
      if (saved) {
        const parsed = JSON.parse(saved)
        parsed.role = 'sales_rep'
        parsed.fullName = parsed.fullName && !parsed.fullName.includes('Sarah') ? parsed.fullName : 'Jane Smith (Sales Rep)'
        parsed.email = 'sales@dealflow360.com'
        setCurrentUser(parsed)
        localStorage.setItem('dealflow_active_user', JSON.stringify(parsed))
      }
    } catch {
      // ignore
    }
  }, [])

  function handleLoginSuccess(user: UserSession) {
    setCurrentUser(user)
    try {
      localStorage.setItem('dealflow_active_user', JSON.stringify(user))
    } catch {}
  }

  function handleLogout() {
    setCurrentUser(null)
    try {
      localStorage.removeItem('dealflow_active_user')
    } catch {}
  }

  function handleSwitchRole(newRole: UserRole) {
    if (!currentUser) return
    const updated: UserSession = { ...currentUser, role: newRole }
    setCurrentUser(updated)
    try {
      localStorage.setItem('dealflow_active_user', JSON.stringify(updated))
    } catch {}
  }

  // Prevent SSR hydration mismatch
  if (!isClient) {
    return null
  }

  // If user is authenticated, render the interactive workspace with all modules
  if (currentUser) {
    return (
      <AppShell
        user={currentUser}
        onLogout={handleLogout}
        onSwitchRole={handleSwitchRole}
      />
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        {/* Header bar */}
        <header className={styles.header}>
          <div className={styles.logo}>
            <span className={styles.logoMark}>D</span>
            <span className={styles.logoText}>
              DealFlow<span className={styles.logoAccent}>360</span>
            </span>
          </div>
          <span className={styles.headerTag}>B2B Sales Platform</span>
        </header>

        {/* Main card */}
        <main className={styles.card}>
          <div className={styles.cardHeader}>
            <h1 className={styles.cardTitle}>Login / Signup</h1>
            <p className={styles.cardSubtitle}>Entry point for internal users and customers</p>
          </div>

          <div className={styles.tabs} role="tablist">
            <button
              id="tab-login"
              role="tab"
              aria-selected={tab === 'login'}
              className={`${styles.tab} ${tab === 'login' ? styles.tabActive : ''}`}
              onClick={() => setTab('login')}
            >
              Log In
            </button>
            <button
              id="tab-signup"
              role="tab"
              aria-selected={tab === 'signup'}
              className={`${styles.tab} ${tab === 'signup' ? styles.tabActive : ''}`}
              onClick={() => setTab('signup')}
            >
              Sign Up
            </button>
          </div>

          <div role="tabpanel">
            {tab === 'login' ? (
              <LoginForm onLoginSuccess={handleLoginSuccess} />
            ) : (
              <SignupForm onSignupSuccess={handleLoginSuccess} />
            )}
          </div>
        </main>

        <footer className={styles.footer}>
          <span>© 2026 DealFlow360</span>
          <span>•</span>
          <a href="#" className={styles.footerLink}>Privacy</a>
          <span>•</span>
          <a href="#" className={styles.footerLink}>Terms</a>
        </footer>
      </div>
    </div>
  )
}
