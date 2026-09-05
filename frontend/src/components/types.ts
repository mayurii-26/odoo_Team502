// ============================================================
// DealFlow360 — Global Domain Types
// ============================================================

export type UserRole = 'admin' | 'sales_rep' | 'sales_manager' | 'finance' | 'customer'

export interface UserSession {
  email: string
  fullName: string
  role: UserRole
  companyName?: string
}

export type QuotationStatus =
  | 'Draft'
  | 'Under Review'
  | 'Approved'
  | 'Negotiating'
  | 'Confirmed'
  | 'Fulfilled'
  | 'Rejected'

export interface QuotationLineItem {
  id: string
  productId: string
  name: string
  category: 'Hardware' | 'Software' | 'Services'
  type: 'one_time' | 'recurring'
  billingInterval?: 'monthly' | 'annual'
  qty: number
  unitPrice: number
  discountPct: number
  costPrice: number
}

export interface Quotation {
  id: string
  dealName: string
  customerName: string
  customerTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum'
  salesRep: string
  status: QuotationStatus
  createdAt: string
  validUntil: string
  items: QuotationLineItem[]
  managerComment?: string
  customerComment?: string
  blendedRiskScore: number
  riskLevel: 'Low' | 'Medium' | 'High'
  aiRecommendation?: {
    suggestedItem: string
    reason: string
    marginImpact: string
    applied: boolean
  }
  approvalDetails?: {
    approvedBy?: string
    approvedAt?: string
    approvalLevelRequired: 'None' | 'Manager' | 'Manager+Finance'
  }
  fulfillment?: {
    status: 'Pending' | 'Allocated' | 'Dispatched'
    allocations: Array<{
      warehouse: string
      item: string
      qty: number
      available: number
    }>
  }
  billing?: {
    invoiceId: string
    oneTimeTotal: number
    recurringTotal: number
    recurringPeriod: string
    paymentStatus: 'Pending' | 'Paid' | 'Failed'
    paidAt?: string
  }
}

export interface Product {
  id: string
  sku: string
  name: string
  category: 'Hardware' | 'Software' | 'Services'
  type: 'one_time' | 'recurring'
  unitPrice: number
  costPrice: number
  stock: number
  description: string
}

export interface Warehouse {
  id: string
  name: string
  location: string
  inventory: Record<string, number> // productId -> stock
}

export interface GovernanceRule {
  tierLimits: Record<string, number>
  categoryLimits: Record<string, number>
  approvalLevels: {
    managerThreshold: number
    financeThreshold: number
  }
}

export interface UserAccount {
  id: number
  name: string
  email: string
  role: string
  status: 'Active' | 'Pending Invite'
  inviteExpires?: string
}

export type ActiveModule =
  | 'dashboard'
  | 'quotations'
  | 'builder'
  | 'approvals'
  | 'customer_portal'
  | 'fulfillment'
  | 'subscriptions'
  | 'invoices'
  | 'billing'
  | 'deal_health'
  | 'catalog'
  | 'governance'
  | 'users'
  | 'reports'
