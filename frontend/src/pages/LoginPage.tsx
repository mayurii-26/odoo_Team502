import { useState } from 'react'
import styles from './LoginPage.module.css'

/* ── Types ───────────────────────────────────────────── */
type Tab = 'login' | 'signup'

/* ── Sub-forms ───────────────────────────────────────── */
function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }
    setError('')
    setLoading(true)
    // TODO: connect to FastAPI /auth/login
    setTimeout(() => {
      setLoading(false)
      setError('Invalid email or password.')   // placeholder until backend
    }, 1000)
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {error && (
        <div className={styles.errorBox} role="alert">
          <span className={styles.errorIcon}>⚠</span> {error}
        </div>
      )}

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
            required
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="login-password" className={styles.label}>Password</label>
          <input
            id="login-password"
            type="password"
            className={styles.input}
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
      </div>

      <div className={styles.actions}>
        <button
          id="btn-login"
          type="submit"
          className={styles.btnPrimary}
          disabled={loading}
        >
          {loading ? <span className={styles.spinner} /> : 'Log In'}
        </button>
        <button
          id="btn-forgot"
          type="button"
          className={styles.btnGhost}
          onClick={() => alert('Password reset — coming soon.')}
        >
          Forgot Password?
        </button>
      </div>

      <div className={styles.infoBox}>
        <span className={styles.infoIcon}>ℹ</span>
        After login, internal users land on the Sales Dashboard. Customers land on their Quotation Portal.
      </div>

      <ul className={styles.noteList}>
        <li>Company / team context resolved from your account</li>
        <li>Basic validation on email and password fields</li>
        <li>Role is determined server-side — not selectable at login</li>
      </ul>
    </form>
  )
}

function SignupForm() {
  const [step, setStep] = useState<'choose' | 'customer'>('choose')
  const [form, setForm] = useState({
    fullName: '',
    companyName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

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
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    // TODO: connect to FastAPI /auth/register/customer
    setTimeout(() => {
      setLoading(false)
      setSuccess(true)
    }, 1000)
  }

  if (success) {
    return (
      <div className={styles.successBox}>
        <div className={styles.successIcon}>✓</div>
        <h3 className={styles.successTitle}>Account created!</h3>
        <p className={styles.successText}>
          We've sent a verification email to <strong>{form.email}</strong>.<br />
          Please verify your address to access the Customer Portal.
        </p>
      </div>
    )
  }

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
            <span className={styles.typeIcon}>👤</span>
            <span className={styles.typeLabel}>Customer</span>
            <span className={styles.typeDesc}>View and negotiate your quotations</span>
          </button>

          <div className={styles.typeCardDisabled}>
            <span className={styles.typeIcon}>🏢</span>
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

  // Customer form
  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <button
        type="button"
        className={styles.backBtn}
        onClick={() => { setStep('choose'); setError('') }}
      >
        ← Back
      </button>

      <p className={styles.formTitle}>Create Customer Account</p>

      {error && (
        <div className={styles.errorBox} role="alert">
          <span className={styles.errorIcon}>⚠</span> {error}
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
            required
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
            required
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
          required
        />
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="su-password" className={styles.label}>Password</label>
          <input
            id="su-password"
            type="password"
            className={styles.input}
            placeholder="Min. 8 characters"
            value={form.password}
            onChange={e => update('password', e.target.value)}
            autoComplete="new-password"
            required
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
            required
          />
        </div>
      </div>

      <div className={styles.actions}>
        <button
          id="btn-create-account"
          type="submit"
          className={styles.btnPrimary}
          disabled={loading}
        >
          {loading ? <span className={styles.spinner} /> : 'Create Account'}
        </button>
      </div>

      <div className={styles.portalNote}>
        <span className={styles.infoIcon}>ℹ</span>
        You will have access to the Customer Quotation Portal only. Internal dashboards require an admin invite.
      </div>
    </form>
  )
}

/* ── Main Page ───────────────────────────────────────── */
export default function LoginPage() {
  const [tab, setTab] = useState<Tab>('login')

  return (
    <div className={styles.page}>
      {/* Background grid pattern */}
      <div className={styles.bgGrid} aria-hidden="true" />

      <div className={styles.wrapper}>
        {/* Header bar */}
        <header className={styles.header}>
          <div className={styles.logo}>
            <span className={styles.logoMark}>D</span>
            <span className={styles.logoText}>DealFlow<span className={styles.logoAccent}>360</span></span>
          </div>
          <span className={styles.headerTag}>B2B Sales Platform</span>
        </header>

        {/* Main card */}
        <main className={styles.card}>
          <div className={styles.cardHeader}>
            <h1 className={styles.cardTitle}>
              {tab === 'login' ? 'Login / Signup' : 'Create Account'}
            </h1>
            <p className={styles.cardSubtitle}>
              Entry point for internal users and customers
            </p>
          </div>

          {/* Tab switcher */}
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

          {/* Tab content */}
          <div role="tabpanel">
            {tab === 'login' ? <LoginForm /> : <SignupForm />}
          </div>
        </main>

        {/* Footer */}
        <footer className={styles.footer}>
          <span>© 2026 DealFlow360</span>
          <span>·</span>
          <a href="#" className={styles.footerLink}>Privacy</a>
          <span>·</span>
          <a href="#" className={styles.footerLink}>Terms</a>
        </footer>
      </div>
    </div>
  )
}
