// ============================================================
// DealFlow360 - Frontend API Client (Live PostgreSQL Backend)
// ============================================================
import { Quotation, Product, Warehouse, UserAccount, GovernanceRule, UserRole, RecommendationWeights } from '@/components/types'

export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }
  if (typeof window !== 'undefined' && window.location.hostname) {
    return `http://${window.location.hostname}:8000`
  }
  return 'http://127.0.0.1:8000'
}

function extractErrorMessage(errData: any, fallback: string): string {
  if (!errData) return fallback
  if (typeof errData.detail === 'string') return errData.detail
  if (Array.isArray(errData.detail)) {
    return errData.detail.map((e: any) => e.msg || e.message || JSON.stringify(e)).join(', ')
  }
  if (typeof errData.detail === 'object' && errData.detail !== null) {
    return errData.detail.msg || errData.detail.message || JSON.stringify(errData.detail)
  }
  if (typeof errData.message === 'string') return errData.message
  return fallback
}

export interface UserProfile {
  id?: number
  email: string
  full_name?: string
  fullName?: string
  role: UserRole
  company_name?: string
  companyName?: string
  token?: string
}

export interface BootstrapResponse {
  status: string
  data: {
    quotations: Quotation[]
    products: Product[]
    warehouses: Warehouse[]
    invoices: any[]
    subscriptions: any[]
    approvals: any[]
    users: UserAccount[]
    governance?: GovernanceRule
    reports: {
      total_revenue: number
      active_pipeline: number
      total_quotes: number
      win_rate: number
      avg_deal_size: number
      avg_discount: number
      avg_margin: number
    }
    audit_logs?: any[]
  }
}

/**
 * Authentication login helper supporting backend and demo accounts
 */
export async function loginUser(credentials: { email: string; password: string }): Promise<UserProfile> {
  const cleanEmail = credentials.email.trim().toLowerCase()
  const apiBase = getApiBaseUrl()
  
  // Try live backend login
  try {
    const res = await fetch(`${apiBase}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    })
    if (res.ok) {
      const data = await res.json()
      return {
        id: data.user?.id,
        email: data.user?.email || cleanEmail,
        fullName: data.user?.name || data.user?.full_name || cleanEmail,
        full_name: data.user?.name || data.user?.full_name || cleanEmail,
        role: (data.user?.role?.toLowerCase() as UserRole) || 'sales_rep',
        token: data.access_token,
      }
    }
    const errData = await res.json().catch(() => ({}))
    throw new Error(extractErrorMessage(errData, 'Invalid email or password.'))
  } catch (err: any) {
    throw new Error(err.message || 'Login failed. Please check your network and credentials.')
  }
}

/**
 * Customer registration
 */
export async function registerCustomer(payload: {
  email: string
  password: string
  full_name: string
  company_name: string
}): Promise<{
  success: boolean
  email: string
  message: string
  access_token?: string
  token_type?: string
  user?: {
    id: number
    name: string
    email: string
    role: UserRole
    status: string
    company_name?: string
  }
  mail_status?: {
    success: boolean
    error?: string
    token?: string
    verification_url?: string
  }
  verification_url?: string
}> {
  const apiBase = getApiBaseUrl()
  const res = await fetch(`${apiBase}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(extractErrorMessage(data, 'Registration failed.'))
  }
  return data
}

/**
 * Resend email verification
 */
export async function resendVerification(email: string): Promise<{
  success: boolean
  email: string
  message: string
  mail_status?: any
  verification_url?: string
}> {
  const apiBase = getApiBaseUrl()
  const res = await fetch(`${apiBase}/api/v1/auth/resend-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(extractErrorMessage(data, 'Failed to resend verification email.'))
  }
  return data
}

/**
 * Verify token and activate account
 */
export async function verifyEmailToken(token: string): Promise<{
  success: boolean
  email: string
  message: string
}> {
  const apiBase = getApiBaseUrl()
  const res = await fetch(`${apiBase}/api/v1/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(extractErrorMessage(data, 'Invalid or expired verification token.'))
  }
  return data
}

/**
 * Fetch all workspace live dataset in one fast call
 */
export async function fetchWorkspaceBootstrap(): Promise<BootstrapResponse['data'] | null> {
  const apiBase = getApiBaseUrl()
  try {
    const res = await fetch(`${apiBase}/api/v1/workspace/bootstrap`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })
    if (!res.ok) {
      return null
    }
    const json: BootstrapResponse = await res.json()
    return json.data
  } catch (err) {
    // Backend offline: seamless fallback to local mock data
    return null
  }
}

/**
 * Save full quotation with line items directly to PostgreSQL DB
 */
export async function saveFullQuotationToDb(
  quoteId: string | number,
  payload: {
    customer_name?: string
    customer_company?: string
    status?: string
    notes?: string
    lines: Array<{
      id?: any
      product_id?: number
      product_name?: string
      quantity: number
      unit_price: number
      discount_percent: number
      unit_cost?: number
    }>
  }
): Promise<any | null> {
  const apiBase = getApiBaseUrl()
  try {
    const res = await fetch(`${apiBase}/api/v1/workspace/quotations/${quoteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      console.warn('Failed to save quotation to DB:', res.status)
      return null
    }
    return await res.json()
  } catch (err) {
    console.warn('Backend offline, quotation saved locally in session.')
    return null
  }
}

/**
 * Create a new quotation with line items in PostgreSQL DB
 */
export async function createFullQuotationInDb(
  payload: {
    customer_name?: string
    customer_company?: string
    status?: string
    notes?: string
    lines: Array<{
      product_id?: number
      product_name?: string
      quantity: number
      unit_price: number
      discount_percent: number
      unit_cost?: number
    }>
  }
): Promise<any | null> {
  const apiBase = getApiBaseUrl()
  try {
    const res = await fetch(`${apiBase}/api/v1/workspace/quotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      console.warn('Failed to create quotation in DB:', res.status)
      return null
    }
    return await res.json()
  } catch (err) {
    console.warn('Backend offline, quotation created locally in session.')
    return null
  }
}

/**
 * Update quotation status or discount in PostgreSQL
 */
export async function updateQuotationLive(
  quoteId: string | number,
  payload: { status?: string; discount_percent?: number; notes?: string }
): Promise<Quotation | null> {
  const apiBase = getApiBaseUrl()
  try {
    const res = await fetch(`${apiBase}/api/v1/workspace/quotations/${quoteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) return null
    return await res.json()
  } catch (err) {
    console.warn('Backend offline, quotation updated locally.')
    return null
  }
}

/**
 * Provision role access and dispatch credentials email from Admin
 */
export async function provisionUserFromAdmin(payload: {
  name: string
  email: string
  role: UserRole
  company_name?: string
  password?: string
  reporting_manager?: string
}): Promise<{
  success: boolean
  action: string
  user: any
  credentials: { email: string; password: string }
  mail_status: { success: boolean; error?: string; to?: string }
  message: string
}> {
  const apiBase = getApiBaseUrl()
  const res = await fetch(`${apiBase}/api/v1/users/provision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(extractErrorMessage(data, 'Provisioning failed.'))
  }
  return data
}

/**
 * Dispatch an executive direct message email from Admin Console
 */
export async function sendDirectAdminMessage(payload: {
  recipient_name: string
  recipient_email: string
  subject: string
  message: string
  priority?: string
  sender_name?: string
}): Promise<{
  success: boolean
  recipient: string
  subject: string
  mail_status: { success: boolean; error?: string }
  message: string
}> {
  const apiBase = getApiBaseUrl()
  const res = await fetch(`${apiBase}/api/v1/users/send-message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(extractErrorMessage(data, 'Failed to dispatch message email.'))
  }
  return data
}

/**
 * Recommendation scoring weights config (Admin)
 */
export async function fetchRecommendationWeights(): Promise<RecommendationWeights | null> {
  const apiBase = getApiBaseUrl()
  try {
    const res = await fetch(`${apiBase}/api/admin/recommendation-weights`)
    if (!res.ok) return null
    return await res.json()
  } catch (err) {
    console.warn('Backend offline or failed fetching recommendation weights:', err)
    return null
  }
}

export async function saveRecommendationWeights(
  weights: RecommendationWeights
): Promise<{ success: boolean; message?: string }> {
  const apiBase = getApiBaseUrl()
  try {
    const res = await fetch(`${apiBase}/api/admin/recommendation-weights`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(weights),
    })
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      return {
        success: false,
        message: extractErrorMessage(errData, 'Failed to save weights to backend'),
      }
    }
    return { success: true }
  } catch (err: any) {
    console.warn('Backend error saving recommendation weights:', err)
    return { success: false, message: err?.message || 'Network error saving weights' }
  }
}

/**
 * Record a timestamped workflow action into PostgreSQL audit_logs table
 */
export async function recordWorkflowAuditLog(payload: {
  user_id?: number
  actor_name: string
  actor_role: string
  action: string
  entity_type?: string
  entity_id?: number
  target_quotation_id?: string
  customer_name?: string
  details?: string
}): Promise<{ success: boolean; log?: any }> {
  const apiBase = getApiBaseUrl()
  try {
    const res = await fetch(`${apiBase}/api/v1/workspace/audit-log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) return { success: false }
    const data = await res.json().catch(() => ({}))
    return { success: true, log: data.log }
  } catch (err) {
    console.warn('Could not persist audit log to backend:', err)
    return { success: false }
  }
}
