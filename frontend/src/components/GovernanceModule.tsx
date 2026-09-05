'use client'

import React, { useState } from 'react'
import styles from './AppShell.module.css'
import { GovernanceRule } from './types'

interface GovernanceProps {
  governance: GovernanceRule
  onUpdateGovernance: (rule: GovernanceRule) => void
  onShowToast: (msg: string) => void
}

export default function GovernanceModule({
  governance,
  onUpdateGovernance,
  onShowToast,
}: GovernanceProps) {
  const [rules, setRules] = useState(governance)

  function updateTier(tier: string, val: number) {
    setRules({
      ...rules,
      tierLimits: { ...rules.tierLimits, [tier]: val },
    })
  }

  function updateCategory(cat: string, val: number) {
    setRules({
      ...rules,
      categoryLimits: { ...rules.categoryLimits, [cat]: val },
    })
  }

  function updateThreshold(key: 'managerThreshold' | 'financeThreshold', val: number) {
    setRules({
      ...rules,
      approvalLevels: { ...rules.approvalLevels, [key]: val },
    })
  }

  function handleSave() {
    onUpdateGovernance(rules)
    onShowToast('Commercial Governance Rules & Approval Chains saved!')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className={styles.moduleHeader}>
        <div>
          <h1 className={styles.moduleTitle}>Discount Governance & Approval Chains</h1>
          <p className={styles.moduleSubtitle}>
            Configure deterministic policy limits for sales reps. Quotations exceeding these thresholds are automatically diverted to the approval queue.
          </p>
        </div>
        <div className={styles.btnGroup}>
          <button className={styles.btnPrimary} onClick={handleSave}>
            💾 Save Governance Rules
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* Customer Tier Ceilings */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Customer Account Tier Ceilings</span>
          </div>
          <div className={styles.cardBody} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {Object.entries(rules.tierLimits).map(([tier, limit]) => (
              <div key={tier} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{tier} Tier:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="number"
                    value={limit}
                    onChange={e => updateTier(tier, parseFloat(e.target.value) || 0)}
                    className={styles.formInput}
                    style={{ width: 70, padding: '4px 8px' }}
                  />
                  <span style={{ fontSize: 13 }}>% max</span>
                </div>
              </div>
            ))}
            <div style={{ fontSize: 11.5, color: '#64748b', background: '#f8fafc', padding: 8, borderRadius: 6, marginTop: 6 }}>
              Sales reps can apply discounts up to this ceiling without manual escalation.
            </div>
          </div>
        </div>

        {/* Product Category Ceilings */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Product Category Ceilings</span>
          </div>
          <div className={styles.cardBody} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {Object.entries(rules.categoryLimits).map(([cat, limit]) => (
              <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{cat}:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="number"
                    value={limit}
                    onChange={e => updateCategory(cat, parseFloat(e.target.value) || 0)}
                    className={styles.formInput}
                    style={{ width: 70, padding: '4px 8px' }}
                  />
                  <span style={{ fontSize: 13 }}>% max</span>
                </div>
              </div>
            ))}
            <div style={{ fontSize: 11.5, color: '#64748b', background: '#f8fafc', padding: 8, borderRadius: 6, marginTop: 6 }}>
              Protects hardware gross margins while granting higher flexibility for SaaS subscriptions.
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Tier Approval Chain Matrix */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>Deterministic Approval Escalation Matrix</span>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Discount Percentage Range</th>
                  <th>Required Approver Level</th>
                  <th>Escalation Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>0.0% — {rules.approvalLevels.managerThreshold}%</code></td>
                  <td><strong>Auto-Approved</strong></td>
                  <td><span className={styles.badgeSuccess}>Zero Approval Needed</span></td>
                </tr>
                <tr>
                  <td><code>{rules.approvalLevels.managerThreshold + 0.1}% — {rules.approvalLevels.financeThreshold}%</code></td>
                  <td><strong>Level 1: Sales Manager</strong></td>
                  <td><span className={styles.badgeReview}>Routes to Alex Rivera</span></td>
                </tr>
                <tr>
                  <td><code>&gt; {rules.approvalLevels.financeThreshold}%</code></td>
                  <td><strong>Level 2: Sales Manager + Finance VP</strong></td>
                  <td><span className={styles.badgeRiskHigh}>Dual Executive Sign-off</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label className={styles.formLabel}>Manager Trigger Threshold:</label>
              <input
                type="number"
                value={rules.approvalLevels.managerThreshold}
                onChange={e => updateThreshold('managerThreshold', parseFloat(e.target.value) || 0)}
                className={styles.formInput}
                style={{ width: 70 }}
              />
              <span style={{ fontSize: 13 }}>%</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label className={styles.formLabel}>Finance Trigger Threshold:</label>
              <input
                type="number"
                value={rules.approvalLevels.financeThreshold}
                onChange={e => updateThreshold('financeThreshold', parseFloat(e.target.value) || 0)}
                className={styles.formInput}
                style={{ width: 70 }}
              />
              <span style={{ fontSize: 13 }}>%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
