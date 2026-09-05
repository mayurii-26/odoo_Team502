import { Quotation, Product, Warehouse, GovernanceRule, UserAccount } from './types'

// All data is loaded live from the PostgreSQL backend via fetchWorkspaceBootstrap().
// These are empty defaults used only before the first API response arrives.

export const INITIAL_PRODUCTS: Product[] = []

export const INITIAL_GOVERNANCE: GovernanceRule = {
  tierLimits: {},
  categoryLimits: {},
  approvalLevels: {
    managerThreshold: 15,
    financeThreshold: 20,
  },
}

export const INITIAL_WAREHOUSES: Warehouse[] = []

export const INITIAL_QUOTATIONS: Quotation[] = []

export const INITIAL_USERS: UserAccount[] = []
