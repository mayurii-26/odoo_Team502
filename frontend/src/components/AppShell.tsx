'use client'

import React, { useState, useEffect, useMemo } from 'react'
import styles from './AppShell.module.css'
import {
  UserSession,
  ActiveModule,
  Quotation,
  QuotationStatus,
  Product,
  Warehouse,
  GovernanceRule,
  UserAccount,
  UserRole,
  WorkflowAuditEntry,
} from './types'
import {
  INITIAL_QUOTATIONS,
  INITIAL_PRODUCTS,
  INITIAL_WAREHOUSES,
  INITIAL_GOVERNANCE,
  INITIAL_USERS,
} from './mockData'
import { fetchWorkspaceBootstrap, updateQuotationLive, recordWorkflowAuditLog } from '@/lib/api'
import { useCurrency } from '@/context/CurrencyContext'

/* ── Module Component Imports ─────────────────────────────── */
import DashboardModule from './DashboardModule'
import QuotationsListModule from './QuotationsListModule'
import QuotationBuilderModule from './QuotationBuilderModule'
import ApprovalsModule from './ApprovalsModule'
import CustomerPortalModule from './CustomerPortalModule'
import FulfillmentModule from './FulfillmentModule'
import SubscriptionsModule from './SubscriptionsModule'
import InvoicesModule from './InvoicesModule'
import BillingModule from './BillingModule'
import DealHealthModule from './DealHealthModule'
import ProductCatalogModule from './ProductCatalogModule'
import GovernanceModule from './GovernanceModule'
import UsersModule from './UsersModule'
import ReportsModule from './ReportsModule'
import AdminModule from './AdminModule'
import TeamMessagesModule from './TeamMessagesModule'
import ChatModule from './ChatModule'

/* ── Minimalist Clean SVG Icons ───────────────────────────── */
function LayoutDashboardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  )
}

function FileTextIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  )
}

function CheckSquareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  )
}

function PackageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  )
}

function RepeatIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </svg>
  )
}

function CreditCardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  )
}

function ActivityIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )
}

function BarChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" x2="12" y1="20" y2="10" />
      <line x1="18" x2="18" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="16" />
    </svg>
  )
}

function TagIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
      <path d="M7 7h.01" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function MessageSquareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function LogOutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  )
}

function RotateCwIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  )
}

function SlidersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" x2="4" y1="21" y2="14" />
      <line x1="4" x2="4" y1="10" y2="3" />
      <line x1="12" x2="12" y1="21" y2="12" />
      <line x1="12" x2="12" y1="8" y2="3" />
      <line x1="20" x2="20" y1="21" y2="16" />
      <line x1="20" x2="20" y1="12" y2="3" />
      <line x1="1" x2="7" y1="14" y2="14" />
      <line x1="9" x2="15" y1="8" y2="8" />
      <line x1="17" x2="23" y1="16" y2="16" />
    </svg>
  )
}

/* ── Baseline Workflow Audit Trail Logs ───────────────────── */
// Audit logs are loaded from the PostgreSQL backend via the bootstrap API.
// This is an empty initial state — populated once the API responds.
const INITIAL_WORKFLOW_AUDIT_LOGS: WorkflowAuditEntry[] = []

interface AppShellProps {
  user: UserSession
  onLogout: () => void
  onSwitchRole: (role: UserRole) => void
}

export default function AppShell({ user, onLogout, onSwitchRole }: AppShellProps) {
  // Domain state with robust fallbacks
  const [quotations, setQuotations] = useState<Quotation[]>(INITIAL_QUOTATIONS)
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS)
  const [warehouses, setWarehouses] = useState<Warehouse[]>(INITIAL_WAREHOUSES)
  const [governance, setGovernance] = useState<GovernanceRule>(INITIAL_GOVERNANCE)
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS)
  const [invoices, setInvoices] = useState<any[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [approvals, setApprovals] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<WorkflowAuditEntry[]>(INITIAL_WORKFLOW_AUDIT_LOGS)
  const [reportsData, setReportsData] = useState<any>(null)
  const [isDbLoaded, setIsDbLoaded] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

  // Global Currency Normalizer Context
  const {
    currency: activeCurrency,
    setCurrency: setActiveCurrency,
    rates: calcRates,
    ratesSource,
    currencies: supportedCurrencies,
    currencyMeta,
  } = useCurrency()


  // Role permissions
  const role = user.role || 'user'
  const isAdmin = role === 'admin'
  const isCustomer = role === 'customer' || role === 'user'
  const isFinance = role === 'finance'
  const isSalesManager = role === 'sales_manager'
  const isSalesRep = role === 'sales_rep'

  function mapBackendStatusToFrontend(backendStatus: string): QuotationStatus {
    const s = (backendStatus || '').toUpperCase()
    if (s === 'PENDING_APPROVAL' || s === 'UNDER_REVIEW' || s === 'REVIEW') return 'Under Review'
    if (s === 'APPROVED') return 'Approved'
    if (s === 'SENT' || s === 'NEGOTIATING' || s === 'NEGOTIATION') return 'Negotiating'
    if (s === 'ACCEPTED' || s === 'CONFIRMED' || s === 'FULFILLED' || s === 'WON') return 'Confirmed'
    return 'Draft'
  }

  function mapFrontendStatusToBackend(frontendStatus: string): string {
    const s = (frontendStatus || '').toLowerCase()
    if (s.includes('review') || s.includes('pending')) return 'PENDING_APPROVAL'
    if (s.includes('approved')) return 'APPROVED'
    if (s.includes('negotiat') || s.includes('sent')) return 'SENT'
    if (s.includes('confirm') || s.includes('accept') || s.includes('fulfill')) return 'ACCEPTED'
    return 'DRAFT'
  }

  // Determine if a given module is accessible for this role
  function isModuleAllowedForRole(mod: ActiveModule, userRole: UserRole): boolean {
    if (userRole === 'customer' || userRole === 'user') {
      return ['dashboard', 'customer_portal', 'messages', 'profile'].includes(mod)
    }
    if (userRole === 'finance') {
      return ['dashboard', 'approvals', 'fulfillment', 'invoices', 'billing', 'messages'].includes(mod)
    }
    if (userRole === 'sales_manager') {
      return ['dashboard', 'quotations', 'builder', 'approvals', 'deal_health', 'messages'].includes(mod)
    }
    if (userRole === 'admin') {
      return [
        'dashboard', 'admin_access', 'admin_messages', 'admin_directory', 'admin_recommendations', 'admin_audit',
        'governance', 'quotations', 'builder', 'reports', 'deal_health', 'catalog'
      ].includes(mod)
    }
    // sales_rep and default
    return [
      'dashboard', 'quotations', 'builder', 'approvals', 'fulfillment',
      'subscriptions', 'invoices', 'billing', 'deal_health', 'reports', 'catalog'
    ].includes(mod)
  }

  // Active view: Defaults according to role and restored from localStorage if valid
  const [activeModule, setActiveModule] = useState<ActiveModule>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('dealflow_active_module') as ActiveModule | null
        if (saved && isModuleAllowedForRole(saved, user.role)) {
          return saved
        }
      } catch {}
    }
    return 'dashboard'
  })

  // Ensure activeModule is synchronized when user role changes or if invalid
  useEffect(() => {
    if (!isModuleAllowedForRole(activeModule, user.role)) {
      setActiveModule('dashboard')
      try {
        localStorage.setItem('dealflow_active_module', 'dashboard')
      } catch {}
    }
  }, [user.role])

  const [selectedQuotationId, setSelectedQuotationId] = useState<string>('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  function showToast(msg: string) {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  function handleNavigateModule(mod: ActiveModule, pushHistory = true) {
    if (isAdmin && mod === 'users') {
      mod = 'admin_directory'
    }
    if (isAdmin && mod === 'builder' && selectedQuotationId === 'new') {
      showToast('Administrators have read-only quotation audit access.')
      mod = 'quotations'
    }
    setActiveModule(mod)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('dealflow_active_module', mod)
        if (pushHistory) {
          window.history.pushState({ loggedIn: true, module: mod, view: 'app' }, '', window.location.pathname)
        }
      } catch {}
    }
  }

  // Handle browser back / forward navigation within modules while logged in
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleModulePopState = (event: PopStateEvent) => {
      const state = event.state
      if (state && state.loggedIn && state.module) {
        if (isModuleAllowedForRole(state.module, user.role)) {
          setActiveModule(state.module)
          try {
            localStorage.setItem('dealflow_active_module', state.module)
          } catch {}
        }
      }
    }

    window.addEventListener('popstate', handleModulePopState)
    return () => window.removeEventListener('popstate', handleModulePopState)
  }, [user.role])

  function handleUserProvisioned(newUser: UserAccount) {
    setUsers(prev => [
      newUser,
      ...prev.filter(u => u.email.toLowerCase() !== newUser.email.toLowerCase()),
    ])
  }

  // Fetch live PostgreSQL database data on mount
  async function loadDatabaseData(isManual = false) {
    if (isManual) setIsRefreshing(true)
    try {
      const data = await fetchWorkspaceBootstrap()
      if (data) {
        if (data.quotations && data.quotations.length > 0) {
          const adaptedQuotes: Quotation[] = data.quotations.map((dq: any) => ({
            id: dq.quote_number || dq.id,
            dealName: `${dq.customer_company || dq.customer_name} - $${Number(dq.total_amount).toLocaleString()}`,
            customerName: dq.customer_company || dq.customer_name,
            customerTier: dq.customer_tier || 'Gold',
            salesRep: dq.sales_rep || '',
            salesRepEmail: dq.sales_rep_email || '',
            status: mapBackendStatusToFrontend(dq.status),
            createdAt: dq.created_at || '2026-03-01',
            validUntil: dq.expires_at || '2026-04-01',
            blendedRiskScore: dq.deal_health_score || 80,
            riskLevel: (dq.deal_health_score || 80) < 60 ? 'High' : (dq.deal_health_score || 80) < 75 ? 'Medium' : 'Low',
            items: (dq.lines && dq.lines.length > 0) ? dq.lines.map((l: any) => ({
              id: String(l.id),
              productId: String(l.product_id),
              name: l.product_name,
              category: l.category === 'Services' ? 'Services' : l.category === 'Software' ? 'Software' : 'Hardware',
              type: l.type === 'recurring' ? 'recurring' : 'one_time',
              qty: l.quantity,
              unitPrice: l.unit_price,
              discountPct: l.discount_percent,
              costPrice: l.unit_cost || l.unit_price * 0.65,
            })) : [
              {
                id: '1',
                productId: '1',
                name: 'Laptop Pro 14',
                category: 'Hardware',
                type: 'one_time',
                qty: 1,
                unitPrice: dq.total_amount || 1200,
                discountPct: dq.discount_percent || 0,
                costPrice: (dq.total_amount || 1200) * 0.7,
              }
            ],
            recommendedItems: dq.recommended_items || dq.recommendedItems || [
              {
                id: 'rec-init-dock',
                productId: 'prod-dock',
                name: 'Docking Station',
                category: 'Hardware',
                type: 'CROSS_SELL',
                unitPrice: 180,
                costPrice: 100,
                discountPct: 15,
                reason: '76% co-purchase frequency with Laptop models • High hardware compatibility',
                score: 76,
                marginImpact: 53,
                customerAccepted: false,
                addedByRep: true,
              },
            ],
          }))
          setQuotations(adaptedQuotes)
          if (adaptedQuotes[0]) {
            setSelectedQuotationId(adaptedQuotes[0].id)
          }
        }

        if (data.products && data.products.length > 0) {
          const adaptedProds: Product[] = data.products.map((dp: any) => ({
            id: String(dp.id),
            sku: dp.sku,
            name: dp.name,
            category: dp.category === 'Software' ? 'Software' : dp.category === 'Services' ? 'Services' : 'Hardware',
            type: dp.name.toLowerCase().includes('subscription') || dp.name.toLowerCase().includes('cloud') || dp.name.toLowerCase().includes('care') ? 'recurring' : 'one_time',
            unitPrice: dp.unit_price,
            costPrice: dp.cost_price,
            stock: dp.stock_quantity || 50,
            description: dp.description || '',
          }))
          setProducts(adaptedProds)
        }

        if (data.warehouses && data.warehouses.length > 0) {
          const adaptedWarehouses: Warehouse[] = data.warehouses.map((dw: any) => ({
            id: String(dw.id),
            name: dw.name,
            location: dw.location,
            inventory: dw.inventory || { '1': dw.current_stock || 150 },
          }))
          setWarehouses(adaptedWarehouses)
        }

        if (data.users && data.users.length > 0) {
          const adaptedUsers: UserAccount[] = data.users.map((u: any) => ({
            id: u.id,
            name: u.name || u.fullName,
            email: u.email,
            role: u.role,
            reporting_manager: u.reporting_manager,
            status: u.status || (u.is_active ? 'Active' : 'Pending Invite'),
          }))
          setUsers(adaptedUsers)
        }
        if (data.invoices && data.invoices.length > 0) {
          setInvoices(data.invoices)
        }
        if (data.subscriptions && data.subscriptions.length > 0) {
          setSubscriptions(data.subscriptions)
        }
        if (data.approvals && data.approvals.length > 0) {
          setApprovals(data.approvals)
        }
        if (data.governance) {
          setGovernance(data.governance)
        }
        if (data.reports) {
          setReportsData(data.reports)
        }
        if (data.audit_logs && data.audit_logs.length > 0) {
          const adaptedAudit: WorkflowAuditEntry[] = data.audit_logs.map((al: any) => ({
            id: String(al.id || `audit-${Date.now()}`),
            timestamp: al.timestamp || 'Sep 5, 2026, 12:00:00 PM',
            actorName: al.actorName || al.user_name || al.actor_name || 'System Admin',
            actorRole: al.actorRole || al.user_role || al.actor_role || 'admin',
            actionType: al.actionType || al.action || 'ACTIVITY',
            targetQuotationId: al.targetQuotationId || (al.entity_id ? `Q-${al.entity_id}` : 'Q-1042'),
            customerName: al.customerName || 'Enterprise Client',
            details: al.details || al.action || al.actionType || 'Workflow Action',
          }))
          setAuditLogs(prev => {
            const existingIds = new Set(prev.map(p => p.id))
            const newOnes = adaptedAudit.filter(a => !existingIds.has(a.id))
            return [...newOnes, ...prev]
          })
        }

        setIsDbLoaded(true)
        if (isManual) showToast('Database synchronized.')
      }
    } catch (e) {
      console.warn('Backend live sync offline, using rich mock data')
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadDatabaseData()
  }, [])

  async function handleUpdateQuotation(updated: Quotation) {
    setQuotations(prev => {
      const exists = prev.some(q => q.id === updated.id)
      if (exists) {
        return prev.map(q => (q.id === updated.id ? updated : q))
      }
      return [updated, ...prev]
    })
    setSelectedQuotationId(updated.id)
    try {
      const backendStatus = mapFrontendStatusToBackend(updated.status)
      await updateQuotationLive(updated.id, {
        status: backendStatus,
        notes: updated.managerComment || updated.customerComment,
      }).catch(() => null)
    } catch {}
  }

  async function handleRecordAuditLog(entry: {
    user?: string
    actorName?: string
    role?: string
    actorRole?: string
    action?: string
    actionType?: any
    quotationId?: string
    targetQuotationId?: string
    customerName?: string
    details: string
  }) {
    const actor = entry.actorName || entry.user || user.fullName || 'System User'
    const actRole = (entry.actorRole || entry.role || user.role || 'sales_rep') as UserRole
    const actType = (entry.actionType || entry.action || 'QUOTE_UPDATED') as any
    const quoteId = entry.targetQuotationId || entry.quotationId || selectedQuotationId || 'Q-1042'
    const targetQuote = quotations.find(q => q.id === quoteId)
    const custName = entry.customerName || targetQuote?.customerName || 'Acme Corporation'

    const now = new Date()
    const formattedTime =
      now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }) +
      ', ' +
      now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      })

    const newLog: WorkflowAuditEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: formattedTime,
      actorName: actor,
      actorRole: actRole,
      actionType: actType,
      targetQuotationId: quoteId,
      customerName: custName,
      details: entry.details,
    }

    setAuditLogs(prev => [newLog, ...prev])

    // Asynchronously persist to PostgreSQL backend audit_logs table
    recordWorkflowAuditLog({
      action: String(actType),
      entity_type: 'quotation',
      target_quotation_id: quoteId,
      actor_name: actor,
      actor_role: String(actRole),
      details: entry.details,
    }).catch(() => null)
  }

  function handleAddProduct(prod: Product) {
    setProducts(prev => [prod, ...prev])
  }

  function handleAddUser(u: UserAccount) {
    setUsers(prev => [u, ...prev])
  }

  const isNewQuote = selectedQuotationId === 'new' || !selectedQuotationId
  const selectedQuote = isNewQuote
    ? null
    : (quotations.find(q => q.id === selectedQuotationId) || null)

  const moduleTitles: Record<ActiveModule, string> = {
    dashboard: isCustomer
      ? 'Customer Portal Overview'
      : isAdmin
      ? 'Root Admin Command Center'
      : isFinance
      ? 'Finance & Ledger Operations'
      : isSalesManager
      ? 'Sales Management & Approvals'
      : 'Sales Dashboard',
    quotations: 'Quotations & Deals',
    builder: isNewQuote ? 'Create New Quotation' : `Quotation Builder (${selectedQuotationId})`,
    approvals: isFinance
      ? 'Financial Approval Requests'
      : isSalesManager
      ? 'Manager Approval Requests'
      : 'Approvals Hub',
    customer_portal: 'Customer Portal',
    fulfillment: 'Fulfillment & Warehouse Stock',
    subscriptions: 'Recurring Subscriptions',
    invoices: 'Invoices & Billing Ledger',
    billing: 'Billing & Invoices',
    deal_health: 'Deal Health & Risk Monitoring',
    catalog: 'Product Master Catalog',
    governance: 'Governance Rules',
    users: 'Team & User Management',
    reports: 'Reports & Analytics',
    messages: isCustomer
      ? 'Customer Messages'
      : isFinance
      ? 'Finance Direct Messages'
      : isSalesManager
      ? 'Manager Direct Messages'
      : 'Team Messages',
    profile: 'Customer Account Profile',
    admin_access: 'Role Access & Provisioning',
    admin_messages: 'Message Anyone Console',
    admin_directory: 'All Users & Directory',
    admin_recommendations: 'AI Recommendation Settings & Scoring Weights',
    admin_audit: 'Workflow Audit Trail (Manager & Rep Actions)',
  }

  const roleLabelMap: Record<UserRole, string> = {
    admin: 'Administrator',
    sales_rep: 'Sales Rep',
    sales_manager: 'Sales Manager',
    finance: 'Financial Officer',
    customer: 'Customer',
    user: 'User',
  }

  const pendingApprovalsCount = quotations.filter(q => {
    if (isSalesRep) {
      const rep = (q.salesRep || q.approvalWorkflow?.assignedRep || '').trim().toLowerCase()
      const userFull = (user.fullName || '').trim().toLowerCase()
      const userEmail = (user.email || '').trim().toLowerCase()
      const userEmailName = userEmail.split('@')[0].replace(/[._-]/g, ' ')
      const userFirstName = userFull.split(' ')[0]
      const repFirstName = rep.split(' ')[0]
      const isMine =
        rep === userFull ||
        rep === userEmail ||
        rep === userEmailName ||
        (Boolean(userFirstName) && Boolean(repFirstName) && userFirstName === repFirstName) ||
        userFull.includes(rep) ||
        rep.includes(userFull)
      return isMine && (q.status === 'Under Review' || q.approvalWorkflow?.status === 'Pending Manager' || q.approvalWorkflow?.status === 'Pending Finance' || q.approvalWorkflow?.status === 'Returned')
    }
    return q.status === 'Under Review'
  }).length

  return (
    <div className={styles.shell}>
      {/* ── Left Clean Enterprise Sidebar ────────────────────────── */}
      <aside className={styles.sidebar}>
        {/* Header Branding */}
        <div className={styles.sidebarHeader}>
          <div className={styles.brandWrap} onClick={() => handleNavigateModule('dashboard')}>
            <div className={styles.brandLogo}>D</div>
            <div className={styles.brandInfo}>
              <span className={styles.brandName}>
                DealFlow<span>360</span>
              </span>
              <span className={styles.brandTagline}>Sales Operations</span>
            </div>
          </div>
        </div>

        {/* Grouped Navigation Links (Dynamically Adapting to User Role) */}
        <div className={styles.navScroll}>
          {/* ────────────────────────────────────────────────────────
              1. ROLE: CUSTOMER
             ──────────────────────────────────────────────────────── */}
          {isCustomer && (
            <div className={styles.navGroup}>
              <span className={styles.groupLabel}>Customer Portal</span>
              <button
                className={`${styles.navLink} ${activeModule === 'dashboard' ? styles.navLinkActive : ''}`}
                onClick={() => handleNavigateModule('dashboard')}
              >
                <div className={styles.navLinkContent}>
                  <span className={styles.navIconWrap}><LayoutDashboardIcon /></span>
                  <span>Portal Overview</span>
                </div>
              </button>

              <button
                className={`${styles.navLink} ${activeModule === 'customer_portal' ? styles.navLinkActive : ''}`}
                onClick={() => handleNavigateModule('customer_portal')}
              >
                <div className={styles.navLinkContent}>
                  <span className={styles.navIconWrap}><FileTextIcon /></span>
                  <span>My Quotation</span>
                </div>
              </button>

              <button
                className={`${styles.navLink} ${activeModule === 'messages' ? styles.navLinkActive : ''}`}
                onClick={() => handleNavigateModule('messages')}
              >
                <div className={styles.navLinkContent}>
                  <span className={styles.navIconWrap}><MessageSquareIcon /></span>
                  <span>Messages</span>
                </div>
              </button>

              <button
                className={`${styles.navLink} ${activeModule === 'profile' ? styles.navLinkActive : ''}`}
                onClick={() => handleNavigateModule('profile')}
              >
                <div className={styles.navLinkContent}>
                  <span className={styles.navIconWrap}><UserIcon /></span>
                  <span>Account Profile</span>
                </div>
              </button>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────
              2. ROLE: FINANCIAL OFFICER (Finance)
              Requirement: Approval request tab, fulfilment, invoices, messages
             ──────────────────────────────────────────────────────── */}
          {isFinance && (
            <div className={styles.navGroup}>
              <span className={styles.groupLabel}>Finance Operations</span>
              <button
                className={`${styles.navLink} ${activeModule === 'dashboard' ? styles.navLinkActive : ''}`}
                onClick={() => handleNavigateModule('dashboard')}
              >
                <div className={styles.navLinkContent}>
                  <span className={styles.navIconWrap}><LayoutDashboardIcon /></span>
                  <span>Finance Dashboard</span>
                </div>
              </button>

              <button
                className={`${styles.navLink} ${activeModule === 'approvals' ? styles.navLinkActive : ''}`}
                onClick={() => handleNavigateModule('approvals')}
              >
                <div className={styles.navLinkContent}>
                  <span className={styles.navIconWrap}><CheckSquareIcon /></span>
                  <span>Approval Requests</span>
                </div>
                {pendingApprovalsCount > 0 && (
                  <span className={`${styles.navBadge} ${styles.navBadgeActive}`}>
                    {pendingApprovalsCount}
                  </span>
                )}
              </button>

              <button
                className={`${styles.navLink} ${activeModule === 'fulfillment' ? styles.navLinkActive : ''}`}
                onClick={() => handleNavigateModule('fulfillment')}
              >
                <div className={styles.navLinkContent}>
                  <span className={styles.navIconWrap}><PackageIcon /></span>
                  <span>Fulfillment</span>
                </div>
              </button>

              <button
                className={`${styles.navLink} ${activeModule === 'invoices' || activeModule === 'billing' ? styles.navLinkActive : ''}`}
                onClick={() => handleNavigateModule('invoices')}
              >
                <div className={styles.navLinkContent}>
                  <span className={styles.navIconWrap}><CreditCardIcon /></span>
                  <span>Invoices</span>
                </div>
              </button>

              <button
                className={`${styles.navLink} ${activeModule === 'messages' ? styles.navLinkActive : ''}`}
                onClick={() => handleNavigateModule('messages')}
              >
                <div className={styles.navLinkContent}>
                  <span className={styles.navIconWrap}><MessageSquareIcon /></span>
                  <span>Messages</span>
                </div>
              </button>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────
              3. ROLE: SALES MANAGER
              Requirement: Approval request, deal health, message
             ──────────────────────────────────────────────────────── */}
          {isSalesManager && (
            <div className={styles.navGroup}>
              <span className={styles.groupLabel}>Sales Management</span>
              <button
                className={`${styles.navLink} ${activeModule === 'dashboard' ? styles.navLinkActive : ''}`}
                onClick={() => handleNavigateModule('dashboard')}
              >
                <div className={styles.navLinkContent}>
                  <span className={styles.navIconWrap}><LayoutDashboardIcon /></span>
                  <span>Manager Dashboard</span>
                </div>
              </button>

              <button
                className={`${styles.navLink} ${activeModule === 'approvals' ? styles.navLinkActive : ''}`}
                onClick={() => handleNavigateModule('approvals')}
              >
                <div className={styles.navLinkContent}>
                  <span className={styles.navIconWrap}><CheckSquareIcon /></span>
                  <span>Approval Requests</span>
                </div>
                {pendingApprovalsCount > 0 && (
                  <span className={`${styles.navBadge} ${styles.navBadgeActive}`}>
                    {pendingApprovalsCount}
                  </span>
                )}
              </button>

              <button
                className={`${styles.navLink} ${activeModule === 'quotations' ? styles.navLinkActive : ''}`}
                onClick={() => handleNavigateModule('quotations')}
              >
                <div className={styles.navLinkContent}>
                  <span className={styles.navIconWrap}><FileTextIcon /></span>
                  <span>Pipeline &amp; Deals</span>
                </div>
                <span className={styles.navBadge}>{quotations.length}</span>
              </button>

              <button
                className={`${styles.navLink} ${activeModule === 'deal_health' ? styles.navLinkActive : ''}`}
                onClick={() => handleNavigateModule('deal_health')}
              >
                <div className={styles.navLinkContent}>
                  <span className={styles.navIconWrap}><ActivityIcon /></span>
                  <span>Deal Health</span>
                </div>
              </button>

              <button
                className={`${styles.navLink} ${activeModule === 'messages' ? styles.navLinkActive : ''}`}
                onClick={() => handleNavigateModule('messages')}
              >
                <div className={styles.navLinkContent}>
                  <span className={styles.navIconWrap}><MessageSquareIcon /></span>
                  <span>Messages</span>
                </div>
              </button>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────
              4. ROLE: ADMINISTRATOR
             ──────────────────────────────────────────────────────── */}
          {isAdmin && (
            <>
              <div className={styles.navGroup}>
                <span className={styles.groupLabel}>Administration</span>
                <button
                  className={`${styles.navLink} ${activeModule === 'dashboard' ? styles.navLinkActive : ''}`}
                  onClick={() => handleNavigateModule('dashboard')}
                >
                  <div className={styles.navLinkContent}>
                    <span className={styles.navIconWrap}><LayoutDashboardIcon /></span>
                    <span>Admin Dashboard</span>
                  </div>
                </button>

                <button
                  className={`${styles.navLink} ${activeModule === 'admin_access' ? styles.navLinkActive : ''}`}
                  onClick={() => handleNavigateModule('admin_access')}
                >
                  <div className={styles.navLinkContent}>
                    <span className={styles.navIconWrap}><ShieldIcon /></span>
                    <span>Role Access</span>
                  </div>
                </button>

                <button
                  className={`${styles.navLink} ${activeModule === 'admin_messages' ? styles.navLinkActive : ''}`}
                  onClick={() => handleNavigateModule('admin_messages')}
                >
                  <div className={styles.navLinkContent}>
                    <span className={styles.navIconWrap}><SendIcon /></span>
                    <span>Message Anyone</span>
                  </div>
                </button>

                <button
                  className={`${styles.navLink} ${activeModule === 'messages' ? styles.navLinkActive : ''}`}
                  onClick={() => handleNavigateModule('messages')}
                >
                  <div className={styles.navLinkContent}>
                    <span className={styles.navIconWrap}><MessageSquareIcon /></span>
                    <span>Live Chat</span>
                  </div>
                </button>

                <button
                  className={`${styles.navLink} ${activeModule === 'admin_directory' ? styles.navLinkActive : ''}`}
                  onClick={() => handleNavigateModule('admin_directory')}
                >
                  <div className={styles.navLinkContent}>
                    <span className={styles.navIconWrap}><UsersIcon /></span>
                    <span>All Users &amp; Directory</span>
                  </div>
                </button>

                <button
                  className={`${styles.navLink} ${activeModule === 'admin_recommendations' ? styles.navLinkActive : ''}`}
                  onClick={() => handleNavigateModule('admin_recommendations')}
                >
                  <div className={styles.navLinkContent}>
                    <span className={styles.navIconWrap}><SlidersIcon /></span>
                    <span>Recommendation Settings</span>
                  </div>
                </button>

                <button
                  className={`${styles.navLink} ${activeModule === 'admin_audit' ? styles.navLinkActive : ''}`}
                  onClick={() => handleNavigateModule('admin_audit')}
                >
                  <div className={styles.navLinkContent}>
                    <span className={styles.navIconWrap}><ActivityIcon /></span>
                    <span>Workflow Audit Trail</span>
                  </div>
                  <span className={styles.navBadge}>{auditLogs.length}</span>
                </button>
              </div>

              <div className={styles.navGroup}>
                <span className={styles.groupLabel}>Governance &amp; Controls</span>
                <button
                  className={`${styles.navLink} ${activeModule === 'governance' ? styles.navLinkActive : ''}`}
                  onClick={() => handleNavigateModule('governance')}
                >
                  <div className={styles.navLinkContent}>
                    <span className={styles.navIconWrap}><ShieldIcon /></span>
                    <span>Governance Rules</span>
                  </div>
                </button>
              </div>

              <div className={styles.navGroup}>
                <span className={styles.groupLabel}>Sales Audit</span>
                <button
                  className={`${styles.navLink} ${activeModule === 'quotations' ? styles.navLinkActive : ''}`}
                  onClick={() => handleNavigateModule('quotations')}
                >
                  <div className={styles.navLinkContent}>
                    <span className={styles.navIconWrap}><FileTextIcon /></span>
                    <span>All Quotations</span>
                  </div>
                  <span className={styles.navBadge}>{quotations.length}</span>
                </button>

                <button
                  className={`${styles.navLink} ${activeModule === 'reports' ? styles.navLinkActive : ''}`}
                  onClick={() => handleNavigateModule('reports')}
                >
                  <div className={styles.navLinkContent}>
                    <span className={styles.navIconWrap}><BarChartIcon /></span>
                    <span>Executive Reports</span>
                  </div>
                </button>
              </div>
            </>
          )}

          {/* ────────────────────────────────────────────────────────
              5. ROLE: SALES REPRESENTATIVE (Default Full Sales Suite)
             ──────────────────────────────────────────────────────── */}
          {isSalesRep && (
            <>
              {/* Section 1: Sales Operations */}
              <div className={styles.navGroup}>
                <span className={styles.groupLabel}>Sales &amp; Pipeline</span>
                <button
                  className={`${styles.navLink} ${activeModule === 'dashboard' ? styles.navLinkActive : ''}`}
                  onClick={() => handleNavigateModule('dashboard')}
                >
                  <div className={styles.navLinkContent}>
                    <span className={styles.navIconWrap}><LayoutDashboardIcon /></span>
                    <span>Dashboard</span>
                  </div>
                </button>

                <button
                  className={`${styles.navLink} ${activeModule === 'quotations' ? styles.navLinkActive : ''}`}
                  onClick={() => handleNavigateModule('quotations')}
                >
                  <div className={styles.navLinkContent}>
                    <span className={styles.navIconWrap}><FileTextIcon /></span>
                    <span>Quotations</span>
                  </div>
                  <span className={`${styles.navBadge} ${activeModule === 'quotations' ? styles.navBadgeActive : ''}`}>
                    {quotations.length}
                  </span>
                </button>

                <button
                  className={`${styles.navLink} ${activeModule === 'approvals' ? styles.navLinkActive : ''}`}
                  onClick={() => handleNavigateModule('approvals')}
                >
                  <div className={styles.navLinkContent}>
                    <span className={styles.navIconWrap}><CheckSquareIcon /></span>
                    <span>Approvals</span>
                  </div>
                  {pendingApprovalsCount > 0 && (
                    <span className={`${styles.navBadge} ${styles.navBadgeActive}`}>
                      {pendingApprovalsCount}
                    </span>
                  )}
                </button>

                <button
                  className={`${styles.navLink} ${activeModule === 'messages' ? styles.navLinkActive : ''}`}
                  onClick={() => handleNavigateModule('messages')}
                >
                  <div className={styles.navLinkContent}>
                    <span className={styles.navIconWrap}><MessageSquareIcon /></span>
                    <span>Live Chat</span>
                  </div>
                </button>
              </div>

              {/* Section 2: Commerce & Execution */}
              <div className={styles.navGroup}>
                <span className={styles.groupLabel}>Commerce &amp; Ledger</span>
                <button
                  className={`${styles.navLink} ${activeModule === 'fulfillment' ? styles.navLinkActive : ''}`}
                  onClick={() => handleNavigateModule('fulfillment')}
                >
                  <div className={styles.navLinkContent}>
                    <span className={styles.navIconWrap}><PackageIcon /></span>
                    <span>Fulfillment</span>
                  </div>
                </button>

                <button
                  className={`${styles.navLink} ${activeModule === 'subscriptions' ? styles.navLinkActive : ''}`}
                  onClick={() => handleNavigateModule('subscriptions')}
                >
                  <div className={styles.navLinkContent}>
                    <span className={styles.navIconWrap}><RepeatIcon /></span>
                    <span>Subscriptions</span>
                  </div>
                </button>

                <button
                  className={`${styles.navLink} ${activeModule === 'invoices' || activeModule === 'billing' ? styles.navLinkActive : ''}`}
                  onClick={() => handleNavigateModule('invoices')}
                >
                  <div className={styles.navLinkContent}>
                    <span className={styles.navIconWrap}><CreditCardIcon /></span>
                    <span>Invoices</span>
                  </div>
                </button>
              </div>

              {/* Section 3: Intelligence & Master Catalog */}
              <div className={styles.navGroup}>
                <span className={styles.groupLabel}>Intelligence &amp; Master</span>
                <button
                  className={`${styles.navLink} ${activeModule === 'deal_health' ? styles.navLinkActive : ''}`}
                  onClick={() => handleNavigateModule('deal_health')}
                >
                  <div className={styles.navLinkContent}>
                    <span className={styles.navIconWrap}><ActivityIcon /></span>
                    <span>Deal Health</span>
                  </div>
                </button>

                <button
                  className={`${styles.navLink} ${activeModule === 'reports' ? styles.navLinkActive : ''}`}
                  onClick={() => handleNavigateModule('reports')}
                >
                  <div className={styles.navLinkContent}>
                    <span className={styles.navIconWrap}><BarChartIcon /></span>
                    <span>Reports</span>
                  </div>
                </button>

                <button
                  className={`${styles.navLink} ${activeModule === 'catalog' ? styles.navLinkActive : ''}`}
                  onClick={() => handleNavigateModule('catalog')}
                >
                  <div className={styles.navLinkContent}>
                    <span className={styles.navIconWrap}><TagIcon /></span>
                    <span>Products</span>
                  </div>
                  <span className={styles.navBadge}>{products.length}</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className={styles.sidebarFooter}>
          {/* User Persona Badge */}
          <div className={styles.userBadgeCard}>
            <div className={styles.userAvatar}>
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userName} title={user.fullName || user.email}>
                {user.fullName || user.email}
              </div>
              <span className={styles.userRolePill}>
                {roleLabelMap[user.role] || user.role}
              </span>
            </div>
          </div>

          <div className={styles.dbStatusPill}>
            <span className={styles.dbDot} />
            <span>Database Live {isDbLoaded ? `(${quotations.length} deals)` : 'Connecting...'}</span>
          </div>

          <button onClick={onLogout} className={styles.logoutBtn} title="Sign out of DealFlow360">
            <LogOutIcon />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Layout Canvas ───────────────────────────────────── */}
      <div className={styles.mainLayout}>
        {/* Top Header Bar */}
        <header className={styles.topBar}>
          <div className={styles.breadcrumbs}>
            <span className={styles.breadRoot}>DealFlow360</span>
            <span className={styles.breadDivider}>/</span>
            <span className={styles.breadCurrent}>{moduleTitles[activeModule] || 'Workspace'}</span>
          </div>

          <div className={styles.topBarRight}>
            <div
              className={styles.currencySelectorPill}
              title="Active workspace display currency (converts all figures across all screens)"
            >
              <span className={styles.currencyFlag}>{currencyMeta.flag}</span>
              <select
                className={styles.currencySelect}
                value={activeCurrency}
                onChange={(e) => {
                  const nextCurr = e.target.value
                  setActiveCurrency(nextCurr)
                  const sym = supportedCurrencies[nextCurr]?.symbol || nextCurr
                  const rateVal = (calcRates[nextCurr] || 1).toFixed(nextCurr === 'JPY' ? 0 : 2)
                  showToast(`Converted all screen currencies to ${nextCurr} (${sym}) • 1 USD = ${rateVal} ${nextCurr}`)
                }}
                aria-label="Screen display currency"
              >
                {Object.values(supportedCurrencies).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {/* Module Content Body */}
        <main className={styles.workspace}>
          {/* Dashboard Module (dynamically adapts according to user.role) */}
          {activeModule === 'dashboard' && (
            <DashboardModule
              user={user}
              quotations={quotations}
              onNavigate={handleNavigateModule}
              onSelectQuotation={setSelectedQuotationId}
            />
          )}

          {/* Customer Portal Modules (from Local Stash) */}
          {(activeModule === 'customer_portal' || (activeModule === 'messages' && isCustomer) || activeModule === 'profile') && (
            <CustomerPortalModule
              quotation={selectedQuote || quotations[0]}
              customerTab={
                activeModule === 'messages'
                  ? 'messages'
                  : activeModule === 'profile'
                  ? 'profile'
                  : 'quotation'
              }
              onUpdateQuotation={handleUpdateQuotation}
              onNavigate={handleNavigateModule}
              onShowToast={showToast}
              user={user}
              onRecordAudit={handleRecordAuditLog}
            />
          )}

          {/* Real-time WhatsApp Chat Module for Team and Admin Roles */}
          {activeModule === 'messages' && !isCustomer && (
            <ChatModule
              currentUser={user}
              users={users}
              onShowToast={showToast}
            />
          )}

          {/* Root Admin Modules (from Local Stash) */}
          {(activeModule === 'admin_access' ||
            activeModule === 'admin_messages' ||
            activeModule === 'admin_directory' ||
            activeModule === 'admin_recommendations' ||
            activeModule === 'admin_audit') && (
            <AdminModule
              adminTab={
                activeModule === 'admin_messages'
                  ? 'messages'
                  : activeModule === 'admin_directory'
                  ? 'directory'
                  : activeModule === 'admin_recommendations'
                  ? 'recommendations'
                  : activeModule === 'admin_audit'
                  ? 'audit'
                  : 'access'
              }
              onNavigateTab={tab =>
                handleNavigateModule(
                  tab === 'messages'
                    ? 'admin_messages'
                    : tab === 'directory'
                    ? 'admin_directory'
                    : tab === 'recommendations'
                    ? 'admin_recommendations'
                    : tab === 'audit'
                    ? 'admin_audit'
                    : 'admin_access'
                )
              }
              onSwitchRole={onSwitchRole}
              onShowToast={showToast}
              users={users}
              auditLogs={auditLogs}
              onUserProvisioned={handleUserProvisioned}
              currentUser={user}
            />
          )}

          {/* Approval Requests Module (shared across Sales Manager, Finance, and Reps) */}
          {activeModule === 'approvals' && (
            <ApprovalsModule
              quotations={quotations}
              approvals={approvals}
              onUpdateQuotation={handleUpdateQuotation}
              onNavigate={handleNavigateModule}
              onShowToast={showToast}
              user={user}
              users={users}
              auditLogs={auditLogs}
              onRecordAudit={handleRecordAuditLog}
            />
          )}

          {/* Fulfillment Module (shared across Finance and Sales Reps) */}
          {activeModule === 'fulfillment' && (
            <FulfillmentModule
              quotation={selectedQuote || quotations[0]}
              warehouses={warehouses}
              quotations={quotations}
              onUpdateQuotation={handleUpdateQuotation}
              onNavigate={handleNavigateModule}
              onShowToast={showToast}
            />
          )}

          {/* Invoices Module (shared across Finance and Sales Reps) */}
          {(activeModule === 'invoices' || activeModule === 'billing') && (
            <InvoicesModule
              quotation={selectedQuote || quotations[0]}
              invoices={invoices}
              onUpdateQuotation={handleUpdateQuotation}
              onNavigate={handleNavigateModule}
              onShowToast={showToast}
            />
          )}

          {/* Deal Health Module (shared across Sales Manager and Reps) */}
          {activeModule === 'deal_health' && (
            <DealHealthModule
              quotations={quotations}
              onNavigate={handleNavigateModule}
              onSelectQuotation={setSelectedQuotationId}
              onShowToast={showToast}
            />
          )}

          {/* Quotations List Module (Kanban view) */}
          {activeModule === 'quotations' && (
            <QuotationsListModule
              quotations={quotations}
              onSelectQuotation={setSelectedQuotationId}
              onNavigate={handleNavigateModule}
              onUpdateQuotation={handleUpdateQuotation}
              onShowToast={showToast}
              readOnly={false}
            />
          )}

          {/* Quotation Builder */}
          {activeModule === 'builder' && (
            <QuotationBuilderModule
              quotation={selectedQuote}
              products={products}
              onUpdateQuotation={handleUpdateQuotation}
              onNavigate={handleNavigateModule}
              onShowToast={showToast}
              readOnly={false}
              currentUser={user}
              users={users}
              onRecordAudit={handleRecordAuditLog}
            />
          )}

          {/* Subscriptions Module */}
          {activeModule === 'subscriptions' && (
            <SubscriptionsModule
              subscriptions={subscriptions}
              onNavigate={handleNavigateModule}
              onShowToast={showToast}
            />
          )}

          {/* Product Catalog */}
          {activeModule === 'catalog' && (
            <ProductCatalogModule
              products={products}
              onAddProduct={handleAddProduct}
              onShowToast={showToast}
            />
          )}

          {/* Governance Rules */}
          {activeModule === 'governance' && (
            <GovernanceModule
              governance={governance}
              onUpdateGovernance={setGovernance}
              onShowToast={showToast}
            />
          )}

          {/* Team Users Management */}
          {activeModule === 'users' && (
            <UsersModule
              users={users}
              onAddUser={handleAddUser}
              onShowToast={showToast}
            />
          )}

          {/* Reports & Analytics */}
          {activeModule === 'reports' && (
            <ReportsModule
              reportsData={reportsData}
              quotations={quotations}
              onNavigate={handleNavigateModule}
              onShowToast={showToast}
            />
          )}
        </main>
      </div>



      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className={styles.toast}>
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  )
}
