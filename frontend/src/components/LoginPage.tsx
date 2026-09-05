'use client'

import { useState, useEffect } from 'react'
import styles from './LoginPage.module.css'
import AppShell from './AppShell'
import { UserSession, UserRole } from './types'
import { IconEye, IconEyeOff } from './Icons'
import { registerCustomer, resendVerification, verifyEmailToken, loginUser } from '@/lib/api'

/* ── Pre-configured Demo Test Accounts (Clean - No Icons) ─────────── */
export const DEMO_ACCOUNTS = [
  {
    email: 'admin@dealflow360.com',
    password: 'password123',
    fullName: 'Sarah Connor',
    role: 'admin' as const,
    companyName: 'DealFlow360 HQ',
    label: 'Administrator',
  },
  {
    email: 'sales@dealflow360.com',
    password: 'password123',
    fullName: 'Jane Smith',
    role: 'sales_rep' as const,
    companyName: 'DealFlow360',
    label: 'Sales Rep',
  },
  {
    email: 'customer@acme.com',
    password: 'password123',
    fullName: 'John Davis (rk)',
    role: 'customer' as const,
    companyName: 'Acme Corp',
    label: 'Customer',
  },
  {
    email: 'manager@dealflow360.com',
    password: 'password123',
    fullName: 'Alex Rivera',
    role: 'sales_manager' as const,
    companyName: 'DealFlow360 Sales Ops',
    label: 'Sales Manager',
  },
  {
    email: 'finance@dealflow360.com',
    password: 'password123',
    fullName: 'David Miller',
    role: 'finance' as const,
    companyName: 'DealFlow360 Finance',
    label: 'Financial Officer',
  },
  {
    email: 'user@dealflow360.com',
    password: 'password123',
    fullName: 'Alex User',
    role: 'user' as const,
    companyName: 'DealFlow360 User',
    label: 'User',
  },
]

/* ── DealFlow360 Official Brand Logo ──────────────────────────────── */
function BrandLogo() {
  return (
    <div className={styles.brandLogo}>
      <img
        src="/dealflow360-logo.jpg"
        alt="DealFlow360"
        className={styles.brandImg}
      />
    </div>
  )
}

/* ── Vector DealFlow360 Platform Promo Illustration ─────────────────── */
function DealFlowIllustration() {
  return (
    <div className={styles.illustrationWrap}>
      <svg width="290" height="205" viewBox="0 0 340 240" fill="none" className={styles.mfaSvg}>
        {/* Soft cloud backdrop */}
        <path d="M120 180 C90 180 70 160 70 135 C70 115 85 95 110 90 C120 60 150 40 185 40 C225 40 255 65 260 100 C285 105 305 125 305 150 C305 175 285 195 260 195 L120 195 Z" fill="#F8FAFC" />
        
        {/* Smartphone body */}
        <rect x="155" y="60" width="85" height="142" rx="12" fill="#001D52" stroke="#70A2FF" strokeWidth="2.5" />
        <rect x="160" y="65" width="75" height="132" rx="8" fill="#0A1938" />
        
        {/* Phone screen DealFlow Telemetry (Ascending bars + swoosh) */}
        <g transform="translate(170, 96)">
          <rect x="0" y="24" width="8" height="20" rx="2" fill="#10B981" />
          <rect x="12" y="14" width="8" height="30" rx="2" fill="#10B981" />
          <rect x="24" y="4" width="8" height="40" rx="2" fill="#059669" />
          {/* Swoosh arrow */}
          <path d="M -5 32 Q 18 48 38 12" stroke="#34D399" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <polyline points="34,12 38,12 38,16" stroke="#34D399" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </g>
        
        {/* Metric badge inside phone */}
        <text x="175" y="172" fill="#70A2FF" fontSize="9" fontWeight="bold">+34% MRR</text>

        {/* Floating Quotation / Deal Approval Card */}
        <g filter="drop-shadow(0 4px 12px rgba(0,29,82,0.12))">
          <rect x="205" y="92" width="105" height="48" rx="7" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
          {/* Header pill */}
          <rect x="213" y="100" width="34" height="12" rx="3" fill="#DCFCE7" />
          <text x="216" y="109" fill="#166534" fontSize="8" fontWeight="bold">Q-1042</text>
          
          <text x="253" y="109" fill="#001D52" fontSize="9.5" fontWeight="800">$124,500</text>
          
          {/* Status check pill */}
          <rect x="213" y="118" width="52" height="12" rx="3" fill="#E0F2FE" />
          <text x="217" y="127" fill="#0369A1" fontSize="8" fontWeight="600">✓ Approved</text>

          {/* Sparkline */}
          <path d="M272 124 L278 120 L284 126 L292 117 L298 122" stroke="#10B981" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </g>

        {/* Standing female analyst figure pointing to metrics */}
        <g id="figure">
          {/* Hair */}
          <path d="M142 58 C137 58 133 62 133 68 C133 74 135 80 135 84 L149 84 C149 80 151 74 151 68 C151 62 147 58 142 58 Z" fill="#1E293B" />
          {/* Head */}
          <circle cx="142" cy="70" r="6" fill="#FED7AA" />
          {/* Torso & blouse */}
          <path d="M136 80 L148 80 L146 122 L138 122 Z" fill="#70A2FF" />
          {/* Arms */}
          <path d="M136 82 L124 98 L128 99 L137 86 Z" fill="#FED7AA" />
          <path d="M148 82 L158 96 L155 98 L146 86 Z" fill="#FED7AA" />
          <circle cx="123" cy="99" r="2.5" fill="#FED7AA" />
          {/* Pants */}
          <path d="M138 122 L134 165 L140 165 L142 135 L144 165 L150 165 L146 122 Z" fill="#001D52" />
          {/* Shoes */}
          <ellipse cx="137" cy="166" rx="4" ry="2" fill="#FED7AA" />
          <ellipse cx="147" cy="166" rx="4" ry="2" fill="#FED7AA" />
        </g>

        {/* Floating DealFlow360 platform capability badges */}
        {/* Deal Health Anomaly Pulse Badge */}
        <circle cx="95" cy="98" r="14" fill="#0284C7" />
        <polyline points="87,98 91,98 94,93 97,103 100,98 103,98" stroke="#FFFFFF" strokeWidth="1.8" fill="none" strokeLinecap="round" />

        {/* Governance Shield Badge */}
        <circle cx="130" cy="55" r="14" fill="#10B981" />
        <path d="M130 49 L136 52 V56 C136 60 130 63 130 63 C130 63 124 60 124 56 V52 Z" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
        <polyline points="127,56 129,58 133,54" stroke="#FFFFFF" strokeWidth="1.3" fill="none" strokeLinecap="round" />

        {/* Quotations / Invoicing Document Badge */}
        <circle cx="215" cy="55" r="14" fill="#6366F1" />
        <rect x="210" y="49" width="10" height="12" rx="2" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
        <line x1="213" y1="53" x2="217" y2="53" stroke="#FFFFFF" strokeWidth="1.2" />
        <line x1="213" y1="56" x2="217" y2="56" stroke="#FFFFFF" strokeWidth="1.2" />

        {/* Multi-Warehouse Fulfillment Box Badge */}
        <circle cx="270" cy="85" r="14" fill="#2563EB" />
        <rect x="264" y="80" width="12" height="10" rx="1.5" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
        <line x1="264" y1="84" x2="276" y2="84" stroke="#FFFFFF" strokeWidth="1.2" />

        {/* Recurring Subscriptions Sync Badge */}
        <circle cx="85" cy="155" r="14" fill="#059669" />
        <path d="M80 155 A5 5 0 0 1 88 152 M90 155 A5 5 0 0 1 82 158" stroke="#FFFFFF" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <polyline points="88,150 88,152 86,152" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
        <polyline points="82,160 82,158 84,158" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
      </svg>
    </div>
  )
}

/* ── Project Specific Feature Promotion Slides ─────────────────────── */
const PROMO_SLIDES = [
  {
    title: 'Enterprise Deal Orchestration',
    desc: 'Automate multi-tier quote governance, track real-time deal health telemetry, and streamline B2B fulfillment across operations.',
  },
  {
    title: 'Autonomous Margin & Risk Governance',
    desc: 'Enforce automated approval routing for discount thresholds, payment terms, and delivery schedules before quotation release.',
  },
  {
    title: 'Unified Customer Negotiation Portal',
    desc: 'Empower clients to review line items, propose counter-discounts, and confirm legally-binding quotations in real-time.',
  },
]

/* ── Main Exported Page Component ─────────────────────────────────── */
export default function LoginPage() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null)
  const [isClient, setIsClient] = useState(false)

  // Mode: 'login' or 'signup'
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  // Login Form states
  const [email, setEmail] = useState('sales@dealflow360.com')
  const [password, setPassword] = useState('password123')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeRole, setActiveRole] = useState<UserRole>('sales_rep')

  // Signup Form states
  const [suName, setSuName] = useState('')
  const [suCompany, setSuCompany] = useState('')
  const [suEmail, setSuEmail] = useState('')
  const [suPassword, setSuPassword] = useState('')
  const [suConfirmPassword, setSuConfirmPassword] = useState('')
  const [suShowPassword, setSuShowPassword] = useState(false)

  // Verification states
  const [verificationSent, setVerificationSent] = useState<{
    email: string
    url?: string
    token?: string
    mailSuccess: boolean
    error?: string
  } | null>(null)
  const [verificationSuccess, setVerificationSuccess] = useState<string | null>(null)

  // Carousel state
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    setIsClient(true)

    // 1. Check for verification token in URL
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        const vToken = params.get('verify_token')
        const vEmail = params.get('email')
        if (vToken) {
          verifyEmailToken(vToken)
            .then(res => {
              setVerificationSuccess(res.message || 'Email verified successfully! You may now sign in.')
              setMode('login')
              if (vEmail) setEmail(vEmail)
              window.history.replaceState({}, document.title, window.location.pathname)
            })
            .catch(err => {
              setError(err.message || 'Verification link expired or invalid.')
            })
        }
      }
    } catch {}

    // 2. Restore active session
    try {
      const saved = localStorage.getItem('dealflow_active_user')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && parsed.email && parsed.role) {
          if (typeof window !== 'undefined') {
            const savedModule = localStorage.getItem('dealflow_active_module') || 'dashboard'
            window.history.replaceState({ loggedIn: false, view: 'login' }, '', window.location.pathname)
            window.history.pushState({ loggedIn: true, view: 'app', module: savedModule }, '', window.location.pathname)
          }
          setCurrentUser(parsed)
        }
      } else {
        if (typeof window !== 'undefined' && !window.history.state) {
          window.history.replaceState({ loggedIn: false, view: 'login' }, '', window.location.pathname)
        }
      }
    } catch {
      // ignore
    }
  }, [])

  // Listen for browser Back/Forward navigation
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state
      if (!state || !state.loggedIn) {
        if (currentUser) {
          setCurrentUser(null)
          try {
            localStorage.removeItem('dealflow_active_user')
            localStorage.removeItem('dealflow_active_module')
          } catch {}
        }
        if (state?.view === 'signup') {
          setMode('signup')
        } else {
          setMode('login')
        }
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [currentUser])

  function switchAuthMode(newMode: 'login' | 'signup') {
    setMode(newMode)
    setError('')
    setVerificationSent(null)
    if (typeof window !== 'undefined') {
      window.history.pushState({ loggedIn: false, view: newMode }, '', window.location.pathname)
    }
  }

  function handleLoginSuccess(user: UserSession) {
    setCurrentUser(user)
    try {
      localStorage.setItem('dealflow_active_user', JSON.stringify(user))
      if (typeof window !== 'undefined') {
        const savedModule = localStorage.getItem('dealflow_active_module') || 'dashboard'
        window.history.pushState({ loggedIn: true, view: 'app', module: savedModule }, '', window.location.pathname)
      }
    } catch {}
  }

  function handleLogout() {
    setCurrentUser(null)
    try {
      localStorage.removeItem('dealflow_active_user')
      localStorage.removeItem('dealflow_active_module')
      if (typeof window !== 'undefined') {
        window.history.replaceState({ loggedIn: false, view: 'login' }, '', window.location.pathname)
      }
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

  // Quick switch demo account
  function selectDemoAccount(acc: typeof DEMO_ACCOUNTS[0]) {
    setEmail(acc.email)
    setPassword(acc.password)
    setActiveRole(acc.role)
    setError('')
    setVerificationSuccess(null)
  }

  // "Change" button action: cycles through demo accounts
  function handleChangeEmail() {
    const roles: UserRole[] = ['sales_rep', 'finance', 'sales_manager', 'admin', 'customer']
    const nextIdx = (roles.indexOf(activeRole) + 1) % roles.length
    const nextRole = roles[nextIdx]
    const nextAcc = DEMO_ACCOUNTS.find(a => a.role === nextRole) || DEMO_ACCOUNTS[0]
    selectDemoAccount(nextAcc)
  }

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }
    setError('')
    setVerificationSuccess(null)
    setLoading(true)

    try {
      // Authenticate via live backend API
      const res = await loginUser({ email: email.trim(), password })
      handleLoginSuccess({
        email: res.email,
        fullName: res.fullName || res.full_name || 'Jane Smith',
        role: res.role,
        companyName: res.companyName || res.company_name || 'DealFlow360',
      })
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Select a demo account below.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignupSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!suName || !suCompany || !suEmail || !suPassword || !suConfirmPassword) {
      setError('Please fill in all fields.')
      return
    }
    if (suPassword !== suConfirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (suPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setError('')
    setLoading(true)

    try {
      const res = await registerCustomer({
        email: suEmail.trim(),
        password: suPassword,
        full_name: suName.trim(),
        company_name: suCompany.trim(),
      })

      if (res.user || res.access_token || res.success) {
        handleLoginSuccess({
          email: res.user?.email || suEmail.trim(),
          fullName: res.user?.name || suName.trim(),
          role: 'user',
          companyName: res.user?.company_name || suCompany.trim() || 'DealFlow360',
        })
        return
      }

      setVerificationSent({
        email: suEmail.trim(),
        url: res.verification_url || res.mail_status?.verification_url,
        token: res.mail_status?.token,
        mailSuccess: res.mail_status?.success ?? true,
        error: res.mail_status?.error,
      })
    } catch (err: any) {
      setError(err.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResendVerification() {
    if (!verificationSent?.email) return
    setLoading(true)
    setError('')
    try {
      const res = await resendVerification(verificationSent.email)
      setVerificationSent({
        email: verificationSent.email,
        url: res.verification_url || res.mail_status?.verification_url,
        token: res.mail_status?.token,
        mailSuccess: res.mail_status?.success ?? true,
        error: res.mail_status?.error,
      })
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification link.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDirectVerify() {
    const token = verificationSent?.token
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const res = await verifyEmailToken(token)
      setVerificationSent(null)
      setVerificationSuccess(res.message || 'Email verified successfully! You may now sign in.')
      setMode('login')
      setEmail(verificationSent.email)
    } catch (err: any) {
      setError(err.message || 'Failed to activate account.')
    } finally {
      setLoading(false)
    }
  }

  // Prevent SSR hydration mismatch
  if (!isClient) {
    return null
  }

  // If user is authenticated, render the interactive workspace
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
      <div className={styles.authContainer}>
        {/* ── Left Column: Sign In / Sign Up Form ── */}
        <div className={styles.leftColumn}>
          <BrandLogo />

          <h1 className={styles.title}>
            {mode === 'login' ? 'Sign in' : 'Sign up'}
          </h1>
          <p className={styles.subtitle}>
            {mode === 'login' ? (
              <>to access <span>DealFlow360</span></>
            ) : (
              <>to get started with <span>DealFlow360</span></>
            )}
          </p>

          {mode === 'login' ? (
            /* ── Login Mode ── */
            <form className={styles.form} onSubmit={handleLoginSubmit} noValidate>
              {verificationSuccess && (
                <div className={styles.successBox} role="alert">
                  <span>✓</span>
                  <span>{verificationSuccess}</span>
                </div>
              )}

              {error && (
                <div className={styles.errorBox} role="alert">
                  {error}
                </div>
              )}

              {/* Email Input Field with "Change" button */}
              <div className={styles.inputGroup}>
                <input
                  id="login-email"
                  type="email"
                  className={styles.input}
                  placeholder="patriciaboyle@zylker.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
                <button
                  type="button"
                  className={styles.changeBtn}
                  onClick={handleChangeEmail}
                  title="Switch test account"
                >
                  Change
                </button>
              </div>

              {/* Password Input Field with Eye Toggle */}
              <div className={styles.inputGroup}>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className={styles.input}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <IconEye size={18} /> : <IconEyeOff size={18} />}
                </button>
              </div>

              {/* Forgot Password Link */}
              <div className={styles.forgotRow}>
                <button
                  type="button"
                  className={styles.forgotLink}
                  onClick={() => setError('For demo access, password is: password123')}
                >
                  Forgot password?
                </button>
              </div>

              {/* Sign in Primary Action Button */}
              <button
                id="btn-login"
                type="submit"
                className={styles.signInBtn}
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>

              {/* Toggle to Signup */}
              <div className={styles.switchModeRow}>
                <span>Don&apos;t have an account?</span>
                <button
                  type="button"
                  className={styles.switchModeBtn}
                  onClick={() => switchAuthMode('signup')}
                >
                  Sign up
                </button>
              </div>

              {/* Clean Demo Account Switcher (No Emojis) */}
              <div className={styles.demoSwitchWrap}>
                <span className={styles.demoLabel}>Demo Accounts:</span>
                <div className={styles.demoPills}>
                  {DEMO_ACCOUNTS.map(acc => (
                    <button
                      key={acc.email}
                      type="button"
                      className={`${styles.demoPill} ${activeRole === acc.role ? styles.demoPillActive : ''}`}
                      onClick={() => selectDemoAccount(acc)}
                    >
                      {acc.label}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          ) : verificationSent ? (
            /* ── Verification Sent Confirmation Screen ── */
            <div className={styles.verifyCard}>
              <div className={styles.verifyIconWrap}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>

              <h3 className={styles.verifyTitle}>Verification Email Sent</h3>
              <p className={styles.verifyText}>
                We sent an email verification link to <span className={styles.verifyEmailHighlight}>{verificationSent.email}</span>.
              </p>

              {verificationSent.mailSuccess ? (
                <p className={styles.verifyText} style={{ fontSize: '13px', color: '#16a34a' }}>
                  ✓ Email successfully dispatched via Resend API. Please check your inbox.
                </p>
              ) : (
                <div className={styles.verifySandboxNote}>
                  <strong>Resend Sandbox Notice:</strong> Resend restricts test deliveries to verified domains. You can verify your account instantly using the button below.
                </div>
              )}

              {/* Direct Verify Action */}
              <button
                type="button"
                className={styles.directVerifyBtn}
                onClick={handleDirectVerify}
                disabled={loading}
              >
                {loading ? 'Activating Account...' : 'Direct Verify & Activate Account'}
              </button>

              {/* Resend Action */}
              <button
                type="button"
                className={styles.resendBtn}
                onClick={handleResendVerification}
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Resend Verification Link'}
              </button>

              {/* Back to Sign In */}
              <div className={styles.switchModeRow} style={{ marginTop: '8px' }}>
                <button
                  type="button"
                  className={styles.switchModeBtn}
                  onClick={() => {
                    setMode('login')
                    setEmail(verificationSent.email)
                    setVerificationSent(null)
                  }}
                >
                  Return to Sign in
                </button>
              </div>
            </div>
          ) : (
            /* ── Sign Up Mode ── */
            <form className={styles.form} onSubmit={handleSignupSubmit} noValidate>
              {error && (
                <div className={styles.errorBox} role="alert">
                  {error}
                </div>
              )}

              {/* Row 1: Full Name & Company Name */}
              <div className={styles.rowTwo}>
                <div className={styles.inputGroup}>
                  <input
                    id="su-name"
                    type="text"
                    className={styles.input}
                    placeholder="Full Name"
                    value={suName}
                    onChange={e => setSuName(e.target.value)}
                    autoComplete="name"
                  />
                </div>
                <div className={styles.inputGroup}>
                  <input
                    id="su-company"
                    type="text"
                    className={styles.input}
                    placeholder="Company Name"
                    value={suCompany}
                    onChange={e => setSuCompany(e.target.value)}
                    autoComplete="organization"
                  />
                </div>
              </div>

              {/* Row 2: Work Email */}
              <div className={styles.inputGroup}>
                <input
                  id="su-email"
                  type="email"
                  className={styles.input}
                  placeholder="Work Email"
                  value={suEmail}
                  onChange={e => setSuEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              {/* Row 3: Password & Confirm Password */}
              <div className={styles.rowTwo}>
                <div className={styles.inputGroup}>
                  <input
                    id="su-password"
                    type={suShowPassword ? 'text' : 'password'}
                    className={styles.input}
                    placeholder="Password (min 6)"
                    value={suPassword}
                    onChange={e => setSuPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setSuShowPassword(!suShowPassword)}
                    title={suShowPassword ? 'Hide password' : 'Show password'}
                  >
                    {suShowPassword ? <IconEye size={18} /> : <IconEyeOff size={18} />}
                  </button>
                </div>
                <div className={styles.inputGroup}>
                  <input
                    id="su-confirm"
                    type={suShowPassword ? 'text' : 'password'}
                    className={styles.input}
                    placeholder="Confirm Password"
                    value={suConfirmPassword}
                    onChange={e => setSuConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {/* Sign Up Primary Action Button */}
              <button
                id="btn-create-account"
                type="submit"
                className={styles.signInBtn}
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>

              {/* Toggle to Sign In */}
              <div className={styles.switchModeRow}>
                <span>Already have an account?</span>
                <button
                  type="button"
                  className={styles.switchModeBtn}
                  onClick={() => switchAuthMode('login')}
                >
                  Sign in
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ── Right Column: DealFlow360 Platform Promo & Telemetry ── */}
        <div className={styles.rightColumn}>
          <DealFlowIllustration />

          <h3 className={styles.promoTitle}>{PROMO_SLIDES[currentSlide].title}</h3>
          <p className={styles.promoDesc}>{PROMO_SLIDES[currentSlide].desc}</p>

          <button
            type="button"
            className={styles.learnMoreBtn}
            onClick={() => setCurrentSlide((currentSlide + 1) % PROMO_SLIDES.length)}
          >
            Explore Platform
          </button>

          {/* Carousel Dots */}
          <div className={styles.carouselDots}>
            {PROMO_SLIDES.map((_, idx) => (
              <span
                key={idx}
                className={idx === currentSlide ? styles.dotActive : styles.dotInactive}
                onClick={() => setCurrentSlide(idx)}
                style={{ cursor: 'pointer' }}
                title={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
