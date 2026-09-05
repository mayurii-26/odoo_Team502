'use client'

import React, { useState } from 'react'
import styles from './GovernanceModule.module.css'
import { GovernanceRule } from './types'

interface GovernanceProps {
  governance: GovernanceRule
  onUpdateGovernance: (rule: GovernanceRule) => void
  onShowToast: (msg: string) => void
}

const DEFAULT_GOVERNANCE: GovernanceRule = {
  tierLimits: {
    Bronze: 5,
    Silver: 10,
    Gold: 15,
    Platinum: 20,
  },
  categoryLimits: {
    Hardware: 15,
    Software: 25,
    Services: 20,
  },
  approvalLevels: {
    managerThreshold: 15,
    financeThreshold: 20,
  },
}

export default function GovernanceModule({
  governance,
  onUpdateGovernance,
  onShowToast,
}: GovernanceProps) {
  const [rules, setRules] = useState<GovernanceRule>(governance || DEFAULT_GOVERNANCE)
  const [isSaved, setIsSaved] = useState(false)

  function updateTier(tier: string, val: number) {
    const clamped = Math.max(0, Math.min(100, val))
    setRules(prev => ({
      ...prev,
      tierLimits: { ...prev.tierLimits, [tier]: clamped },
    }))
    setIsSaved(false)
  }

  function updateCategory(cat: string, val: number) {
    const clamped = Math.max(0, Math.min(100, val))
    setRules(prev => ({
      ...prev,
      categoryLimits: { ...prev.categoryLimits, [cat]: clamped },
    }))
    setIsSaved(false)
  }

  function updateThreshold(key: 'managerThreshold' | 'financeThreshold', val: number) {
    const clamped = Math.max(0, Math.min(100, val))
    setRules(prev => ({
      ...prev,
      approvalLevels: { ...prev.approvalLevels, [key]: clamped },
    }))
    setIsSaved(false)
  }

  function handleSave() {
    onUpdateGovernance(rules)
    setIsSaved(true)
    onShowToast('Commercial Governance Rules & Approval Chains successfully updated and active!')
    setTimeout(() => setIsSaved(false), 3000)
  }

  function handleReset() {
    setRules(DEFAULT_GOVERNANCE)
    onUpdateGovernance(DEFAULT_GOVERNANCE)
    onShowToast('Governance rules reset to enterprise policy baseline.')
  }

  const isInvalidThreshold = rules.approvalLevels.managerThreshold >= rules.approvalLevels.financeThreshold

  return (
    <div className={styles.container}>
      {/* ── Module Header ── */}
      <div className={styles.headerBar}>
        <div className={styles.titleArea}>
          <div className={styles.titleRow}>
            <div className={styles.titleIconWrap}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <h1 className={styles.title}>Discount Governance &amp; Approval Chains</h1>
            <span className={styles.titleBadge}>Deterministic Policy Engine</span>
          </div>
          <p className={styles.subtitle}>
            Configure automated policy guardrails for sales representatives. Quotations exceeding these thresholds are deterministically diverted to the multi-level management and financial approval queues.
          </p>
        </div>

        <div className={styles.actionsGroup}>
          <button
            type="button"
            className={styles.btnSecondaryClay}
            onClick={handleReset}
            title="Reset to default baseline limits"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Reset Defaults
          </button>

          <button
            type="button"
            className={styles.btnPrimaryClay}
            onClick={handleSave}
          >
            {isSaved ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Rules Saved!
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                Save Governance Rules
              </>
            )}
          </button>
        </div>
      </div>


      {/* ── 2-Column Limits Grid ── */}
      <div className={styles.grid2Col}>
        {/* Customer Account Tier Ceilings */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderLeft}>
              <div className={styles.cardIconWrap}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div>
                <h3 className={styles.cardTitle}>Customer Account Tier Ceilings</h3>
                <p className={styles.cardSubtitle}>Defines maximum allowable discount per account tier</p>
              </div>
            </div>
            <span className={styles.cardHeaderBadge}>4 Tiers Active</span>
          </div>

          <div className={styles.ceilingList}>
            {Object.entries(rules.tierLimits).map(([tier, limit]) => {
              const badgeClass =
                tier.toLowerCase() === 'bronze'
                  ? styles.tierBronze
                  : tier.toLowerCase() === 'silver'
                  ? styles.tierSilver
                  : tier.toLowerCase() === 'gold'
                  ? styles.tierGold
                  : styles.tierPlatinum

              return (
                <div key={tier} className={styles.ceilingRow}>
                  <div className={styles.ceilingTop}>
                    <div className={styles.tierInfo}>
                      <span className={`${styles.tierBadge} ${badgeClass}`}>{tier}</span>
                      <span className={styles.tierName}>{tier} Account Tier</span>
                    </div>

                    <div className={styles.inputGroupWrap}>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={limit}
                        onChange={e => updateTier(tier, parseFloat(e.target.value) || 0)}
                        className={styles.numberInput}
                      />
                      <span className={styles.unitLabel}>% max</span>
                    </div>
                  </div>

                  <div className={styles.sliderTrackWrap}>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="0.5"
                      value={limit}
                      onChange={e => updateTier(tier, parseFloat(e.target.value) || 0)}
                      className={styles.rangeSlider}
                    />
                    <span className={styles.meterPctText}>{limit}%</span>
                  </div>
                </div>
              )
            })}

            <div className={styles.cardHelpBox}>
              <strong>Notice:</strong> Sales representatives can apply customer discounts up to these ceiling limits without requiring manual approval intervention.
            </div>
          </div>
        </div>

        {/* Product Category Ceilings */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderLeft}>
              <div className={styles.cardIconWrap}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
              <div>
                <h3 className={styles.cardTitle}>Product Category Ceilings</h3>
                <p className={styles.cardSubtitle}>Strict margin protection by commodity &amp; software type</p>
              </div>
            </div>
            <span className={styles.cardHeaderBadge}>3 Categories</span>
          </div>

          <div className={styles.ceilingList}>
            {Object.entries(rules.categoryLimits).map(([cat, limit]) => {
              const catClass =
                cat.toLowerCase() === 'hardware'
                  ? styles.catHardware
                  : cat.toLowerCase() === 'software'
                  ? styles.catSoftware
                  : styles.catServices

              return (
                <div key={cat} className={styles.ceilingRow}>
                  <div className={styles.ceilingTop}>
                    <div className={styles.tierInfo}>
                      <span className={`${styles.tierBadge} ${catClass}`}>{cat}</span>
                      <span className={styles.tierName}>{cat} Deliverables</span>
                    </div>

                    <div className={styles.inputGroupWrap}>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={limit}
                        onChange={e => updateCategory(cat, parseFloat(e.target.value) || 0)}
                        className={styles.numberInput}
                      />
                      <span className={styles.unitLabel}>% max</span>
                    </div>
                  </div>

                  <div className={styles.sliderTrackWrap}>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="0.5"
                      value={limit}
                      onChange={e => updateCategory(cat, parseFloat(e.target.value) || 0)}
                      className={styles.rangeSlider}
                    />
                    <span className={styles.meterPctText}>{limit}%</span>
                  </div>
                </div>
              )
            })}

            <div className={styles.cardHelpBox}>
              <strong>Margin Safeguard:</strong> Hardware items carry direct COGS and are guarded at lower discount ceilings. Cloud SaaS products provide higher margin flexibility.
            </div>
          </div>
        </div>
      </div>

      {/* ── Multi-Tier Approval Chain Matrix ── */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <div className={styles.cardIconWrap}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <div>
              <h3 className={styles.cardTitle}>Deterministic Approval Escalation Matrix</h3>
              <p className={styles.cardSubtitle}>
                Live matrix mapping quotation discount percentage ranges to mandatory authority levels
              </p>
            </div>
          </div>
          <span className={styles.cardHeaderBadge}>Automated Routing</span>
        </div>

        {/* Warning if Manager >= Finance */}
        {isInvalidThreshold && (
          <div className={styles.warningBanner}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>
              <strong>Threshold Configuration Conflict:</strong> Sales Manager threshold ({rules.approvalLevels.managerThreshold}%) must be strictly lower than Finance VP threshold ({rules.approvalLevels.financeThreshold}%).
            </span>
          </div>
        )}

        <div className={styles.tableWrap}>
          <table className={styles.matrixTable}>
            <thead>
              <tr>
                <th>Discount Percentage Range</th>
                <th>Required Approver Level</th>
                <th>Target Assigned Authority</th>
                <th>Escalation Routing Action</th>
                <th>Expected Turnaround</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <span className={styles.codeBadge}>
                    0.0% — {rules.approvalLevels.managerThreshold.toFixed(1)}%
                  </span>
                </td>
                <td>
                  <div className={styles.approverLevel}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <strong>Auto-Approved</strong>
                  </div>
                </td>
                <td>DealFlow360 System Engine</td>
                <td>
                  <span className={styles.badgeSuccess}>
                    <span>✓</span> Zero Approval Needed
                  </span>
                </td>
                <td>Instant (Real-time)</td>
              </tr>
              <tr>
                <td>
                  <span className={styles.codeBadge}>
                    {(rules.approvalLevels.managerThreshold + 0.1).toFixed(1)}% — {rules.approvalLevels.financeThreshold.toFixed(1)}%
                  </span>
                </td>
                <td>
                  <div className={styles.approverLevel}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                    </svg>
                    <strong>Level 1: Sales Manager</strong>
                  </div>
                </td>
                <td>Alex Rivera (Sales Operations Lead)</td>
                <td>
                  <span className={styles.badgeReview}>
                    <span>⏳</span> Routes to Manager Queue
                  </span>
                </td>
                <td>&lt; 4 Business Hours</td>
              </tr>
              <tr>
                <td>
                  <span className={styles.codeBadge}>
                    &gt; {rules.approvalLevels.financeThreshold.toFixed(1)}%
                  </span>
                </td>
                <td>
                  <div className={styles.approverLevel}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <strong>Level 2: Dual Executive Sign-off</strong>
                  </div>
                </td>
                <td>Alex Rivera (Sales VP) + David Miller (Finance VP)</td>
                <td>
                  <span className={styles.badgeRiskHigh}>
                    <span>⚠️</span> Dual Executive Clearance
                  </span>
                </td>
                <td>&lt; 24 Business Hours</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Dynamic Threshold Sliders & Controls */}
        <div className={styles.thresholdBar}>
          <div className={styles.thresholdRow}>
            <div className={styles.thresholdItem}>
              <label className={styles.thresholdLabel}>Manager Trigger Threshold:</label>
              <input
                type="number"
                min="1"
                max="99"
                step="0.5"
                value={rules.approvalLevels.managerThreshold}
                onChange={e => updateThreshold('managerThreshold', parseFloat(e.target.value) || 0)}
                className={styles.thresholdInput}
              />
              <span className={styles.unitLabel}>%</span>
            </div>

            <div className={styles.thresholdItem}>
              <label className={styles.thresholdLabel}>Finance VP Trigger Threshold:</label>
              <input
                type="number"
                min="1"
                max="99"
                step="0.5"
                value={rules.approvalLevels.financeThreshold}
                onChange={e => updateThreshold('financeThreshold', parseFloat(e.target.value) || 0)}
                className={styles.thresholdInput}
              />
              <span className={styles.unitLabel}>%</span>
            </div>
          </div>

          <button
            type="button"
            className={styles.btnPrimaryClay}
            style={{ padding: '9px 18px', fontSize: '13px' }}
            onClick={handleSave}
          >
            Update Escalation Policy
          </button>
        </div>
      </div>

      {/* ── Enterprise Compliance Audit Banner ── */}
      <div className={styles.auditCard}>
        <div className={styles.auditLeft}>
          <div className={styles.auditIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          </div>
          <div>
            <h4 className={styles.auditTitle}>Commercial Governance Engine v2.4 Active</h4>
            <p className={styles.auditDesc}>
              Every quotation generated in DealFlow360 is deterministically validated against these rules prior to quote dispatch and ERP synchronization.
            </p>
          </div>
        </div>

        <div className={styles.auditStatusBadge}>
          <span className={styles.auditDot} />
          <span>Real-time Policy Enforcement Live</span>
        </div>
      </div>
    </div>
  )
}
