'use client'

import React, { useState, useEffect } from 'react'
import styles from './LoginPage.module.css'
import { loginUser, registerCustomer, resendVerification, UserProfile } from '../lib/api'
import AppShell from './AppShell'
import { UserRole } from './types'

type AuthMode = 'signin' | 'signup'

/* ── Minimal SVG Icons ────────────────────────────────────── */
function PulseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function ZapIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

function SparklesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function BuildingIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" /><path d="M16 6h.01" />
      <path d="M8 10h.01" /><path d="M16 10h.01" />
      <path d="M8 14h.01" /><path d="M16 14h.01" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

/* ── Main Component ────────────────────────────────────────── */
export default function LoginPage() {
  const [mounted, setMounted] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>('signin')

  // Sign In Form States
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [resendStatus, setResendStatus] = useState('')
  const [resending, setResending] = useState(false)
  const [loggedInUser, setLoggedInUser] = useState<UserProfile | null>(null)

  // Sign Up Form States
  const [signupForm, setSignupForm] = useState({
    fullName: '',
    companyName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showSignupPassword, setShowSignupPassword] = useState(false)
  const [signupLoading, setSignupLoading] = useState(false)
  const [signupError, setSignupError] = useState('')
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem('dealflow_active_user')
      if (saved) {
        setLoggedInUser(JSON.parse(saved))
      }
    } catch {}
  }, [])

  function updateSignup(field: keyof typeof signupForm, value: string) {
    setSignupForm(f => ({ ...f, [field]: value }))
  }

  // Handle Login
  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoginError('')
    setResendStatus('')
    if (!email.trim() || !password) {
      setLoginError('Please enter both your email address and password.')
      return
    }
    setLoginLoading(true)
    try {
      const res = await loginUser({ email: email.trim(), password })
      setLoggedInUser(res)
      try {
        localStorage.setItem('dealflow_active_user', JSON.stringify(res))
      } catch {}
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoginLoading(false)
    }
  }

  // Handle Resend Verification
  async function handleResendVerification() {
    if (!email.trim()) {
      setLoginError('Please enter your email address above to resend verification.')
      return
    }
    setResending(true)
    setResendStatus('')
    try {
      await resendVerification(email.trim())
      setResendStatus('Verification link sent! Please check your inbox.')
    } catch (err: any) {
      setLoginError(err.message || 'Failed to resend verification email.')
    } finally {
      setResending(false)
    }
  }

  // Handle Signup
  async function handleSignupSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSignupError('')
    if (!signupForm.fullName.trim() || !signupForm.companyName.trim() || !signupForm.email.trim() || !signupForm.password || !signupForm.confirmPassword) {
      setSignupError('Please fill in all required fields.')
      return
    }
    if (signupForm.password !== signupForm.confirmPassword) {
      setSignupError('Passwords do not match.')
      return
    }
    if (signupForm.password.length < 6) {
      setSignupError('Password must be at least 6 characters.')
      return
    }
    setSignupLoading(true)
    try {
      const res = await registerCustomer({
        email: signupForm.email.trim(),
        password: signupForm.password,
        full_name: signupForm.fullName.trim(),
        company_name: signupForm.companyName.trim(),
      })
      setRegisteredEmail(res.email || signupForm.email.trim())
    } catch (err: any) {
      setSignupError(err.message || 'Registration failed.')
    } finally {
      setSignupLoading(false)
    }
  }

  const isUnverifiedError = loginError.toLowerCase().includes('verify your email')

  if (!mounted) {
    return <div className={styles.container} style={{ minHeight: '100vh', background: '#ffffff' }} />
  }

  // Render workspace upon successful login
  if (loggedInUser) {
    return (
      <AppShell
        user={{
          email: loggedInUser.email,
          fullName: loggedInUser.full_name || loggedInUser.fullName || 'Jane Smith',
          role: (loggedInUser.role as UserRole) || 'sales_rep',
          companyName: loggedInUser.company_name || loggedInUser.companyName || 'DealFlow360',
        }}
        onLogout={() => {
          setLoggedInUser(null)
          try {
            localStorage.removeItem('dealflow_active_user')
            localStorage.removeItem('dealflow_token')
          } catch {}
        }}
        onSwitchRole={(newRole) => {
          const updated: UserProfile = { ...loggedInUser, role: newRole }
          setLoggedInUser(updated)
          try {
            localStorage.setItem('dealflow_active_user', JSON.stringify(updated))
          } catch {}
        }}
      />
    )
  }

  return (
    <div className={styles.container} suppressHydrationWarning>
      {/* ── Left Branded Hero Panel ────────────────────────── */}
      <aside className={styles.leftPanel}>
        <div className={styles.circleGraphicTop} />
        <div className={styles.circleGraphicBottom} />

        <div className={styles.heroContent}>
          <div className={styles.logoBadge}>
            <PulseIcon />
          </div>

          <h1 className={styles.brandTitle}>DealFlow360</h1>
          <p className={styles.brandSubtitle}>Smart CPQ &amp; Sales Operations Platform</p>

          <ul className={styles.featureList}>
            <li className={styles.featureItem}>
              <span className={styles.featureBulletIcon}>
                <ShieldIcon />
              </span>
              <span className={styles.featureText}>Role-Governed Pricing &amp; Margin Guardrails</span>
            </li>
            <li className={styles.featureItem}>
              <span className={styles.featureBulletIcon}>
                <ZapIcon />
              </span>
              <span className={styles.featureText}>Automated Quotation Approvals &amp; E-Sign</span>
            </li>
            <li className={styles.featureItem}>
              <span className={styles.featureBulletIcon}>
                <SparklesIcon />
              </span>
              <span className={styles.featureText}>AI-Powered Recommendations &amp; Upsell</span>
            </li>
          </ul>
        </div>
      </aside>

      {/* ── Right Minimal Form Panel ───────────────────────── */}
      <main className={styles.rightPanel}>
        <div className={styles.formCard} suppressHydrationWarning>
          {registeredEmail ? (
            /* Email Verification Needed */
            <div className={styles.feedbackBox}>
              <div className={styles.feedbackIconWrap}>
                <CheckIcon />
              </div>
              <h2 className={styles.title}>Check your inbox</h2>
              <p className={styles.subtitle}>
                We sent a verification link to <span className={styles.emailPill}>{registeredEmail}</span>.
                Please verify your email address to activate your account.
              </p>
              <button
                type="button"
                className={styles.submitBtn}
                style={{ marginTop: 20 }}
                onClick={() => {
                  setRegisteredEmail(null)
                  setAuthMode('signin')
                }}
              >
                Proceed to Sign In
              </button>
            </div>
          ) : authMode === 'signin' ? (
            /* ── Sign In ── */
            <>
              <header className={styles.header}>
                <h2 className={styles.title}>Welcome back</h2>
                <p className={styles.subtitle}>Sign in to continue to your dashboard</p>
              </header>

              {loginError && (
                <div className={styles.errorBanner} role="alert">
                  <span className={styles.errorIcon}>⚠</span>
                  <div>{loginError}</div>
                </div>
              )}

              {resendStatus && (
                <div className={styles.successBanner}>
                  <span>✓</span>
                  <div>{resendStatus}</div>
                </div>
              )}

              {isUnverifiedError && (
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={handleResendVerification}
                  disabled={resending}
                  style={{ marginBottom: 16 }}
                >
                  <MailIcon />
                  {resending ? 'Sending link...' : 'Resend Verification Link'}
                </button>
              )}

              <form className={styles.form} onSubmit={handleLoginSubmit} noValidate>
                <div className={styles.fieldGroup}>
                  <label htmlFor="login-email" className={styles.label}>Email Address</label>
                  <div className={styles.inputBox}>
                    <span className={styles.inputLeadIcon}><MailIcon /></span>
                    <input
                      id="login-email"
                      type="email"
                      className={styles.textInput}
                      placeholder="name@company.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="login-password" className={styles.label}>Password</label>
                  <div className={styles.inputBox}>
                    <span className={styles.inputLeadIcon}><LockIcon /></span>
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      className={`${styles.textInput} ${styles.textInputWithTrail}`}
                      placeholder="••••••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      className={styles.trailBtn}
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                <div className={styles.controlsRow}>
                  <label className={styles.rememberLabel}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className={styles.checkboxInput}
                    />
                    <span>Remember me</span>
                  </label>
                  <a href="#forgot" className={styles.forgotAnchor}>Forgot password?</a>
                </div>

                <button
                  id="btn-login-submit"
                  type="submit"
                  className={styles.submitBtn}
                  disabled={loginLoading}
                >
                  {loginLoading ? (
                    <>
                      <span className={styles.btnSpinner} />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              <footer className={styles.formFooter}>
                <span>Don&apos;t have an account? </span>
                <button
                  type="button"
                  className={styles.inlineActionBtn}
                  onClick={() => {
                    setAuthMode('signup')
                    setSignupError('')
                  }}
                >
                  Create one
                </button>
              </footer>
            </>
          ) : (
            /* ── Sign Up ── */
            <>
              <header className={styles.header}>
                <h2 className={styles.title}>Create an account</h2>
                <p className={styles.subtitle}>Register for DealFlow360 Customer Portal</p>
              </header>

              {signupError && (
                <div className={styles.errorBanner} role="alert">
                  <span className={styles.errorIcon}>⚠</span>
                  <div>{signupError}</div>
                </div>
              )}

              <form className={styles.form} onSubmit={handleSignupSubmit} noValidate>
                <div className={styles.twoColRow}>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="su-name" className={styles.label}>Full Name</label>
                    <div className={styles.inputBox}>
                      <span className={styles.inputLeadIcon}><UserIcon /></span>
                      <input
                        id="su-name"
                        type="text"
                        className={styles.textInput}
                        placeholder="Jane Smith"
                        value={signupForm.fullName}
                        onChange={e => updateSignup('fullName', e.target.value)}
                        autoComplete="name"
                        required
                      />
                    </div>
                  </div>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="su-company" className={styles.label}>Company</label>
                    <div className={styles.inputBox}>
                      <span className={styles.inputLeadIcon}><BuildingIcon /></span>
                      <input
                        id="su-company"
                        type="text"
                        className={styles.textInput}
                        placeholder="Acme Global"
                        value={signupForm.companyName}
                        onChange={e => updateSignup('companyName', e.target.value)}
                        autoComplete="organization"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="su-email" className={styles.label}>Business Email</label>
                  <div className={styles.inputBox}>
                    <span className={styles.inputLeadIcon}><MailIcon /></span>
                    <input
                      id="su-email"
                      type="email"
                      className={styles.textInput}
                      placeholder="jane@acme.com"
                      value={signupForm.email}
                      onChange={e => updateSignup('email', e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <div className={styles.twoColRow}>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="su-password" className={styles.label}>Password</label>
                    <div className={styles.inputBox}>
                      <span className={styles.inputLeadIcon}><LockIcon /></span>
                      <input
                        id="su-password"
                        type={showSignupPassword ? 'text' : 'password'}
                        className={`${styles.textInput} ${styles.textInputWithTrail}`}
                        placeholder="Min. 8 chars"
                        value={signupForm.password}
                        onChange={e => updateSignup('password', e.target.value)}
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        className={styles.trailBtn}
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        tabIndex={-1}
                      >
                        {showSignupPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="su-confirm" className={styles.label}>Confirm</label>
                    <div className={styles.inputBox}>
                      <span className={styles.inputLeadIcon}><LockIcon /></span>
                      <input
                        id="su-confirm"
                        type={showSignupPassword ? 'text' : 'password'}
                        className={styles.textInput}
                        placeholder="Confirm password"
                        value={signupForm.confirmPassword}
                        onChange={e => updateSignup('confirmPassword', e.target.value)}
                        autoComplete="new-password"
                        required
                      />
                    </div>
                  </div>
                </div>

                <button
                  id="btn-create-account"
                  type="submit"
                  className={styles.submitBtn}
                  disabled={signupLoading}
                  style={{ marginTop: 6 }}
                >
                  {signupLoading ? (
                    <>
                      <span className={styles.btnSpinner} />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>

              <div className={styles.infoBanner}>
                <span>ℹ</span>
                <span>An email verification link will be sent to activate your account.</span>
              </div>

              <footer className={styles.formFooter}>
                <span>Already have an account? </span>
                <button
                  type="button"
                  className={styles.inlineActionBtn}
                  onClick={() => {
                    setAuthMode('signin')
                    setSignupError('')
                  }}
                >
                  Sign in
                </button>
              </footer>
            </>
          )}
        </div>
      </main>
    </div>
  )
}