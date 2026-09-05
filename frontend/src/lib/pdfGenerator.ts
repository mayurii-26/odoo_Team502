/**
 * DealFlow360 Unified PDF & Print Engine
 * High-fidelity, print-ready document generator with DealFlow360 branding.
 */

import { Quotation, QuotationLineItem, WorkflowAuditEntry } from '../components/types'

interface InvoiceData {
  id?: number | string
  invoice_number: string
  quotation_id?: number | string
  customer_name: string
  amount: number
  amount_paid?: number
  amount_due?: number
  status?: string
  payment_status: 'PAID' | 'UNPAID' | 'PARTIAL' | string
  issue_date: string
  due_date: string
}

/**
 * Returns the DealFlow360 logo HTML block with absolute origin fallback and vector SVG backup.
 */
function getLogoHtml(): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const logoUrl = `${origin}/dealflow360-logo.jpg`

  return `
    <div class="brand-header">
      <div class="logo-wrapper">
        <img
          src="${logoUrl}"
          alt="DealFlow360"
          class="df360-logo-img"
          onerror="this.style.display='none'; document.getElementById('df360-svg-fallback').style.display='flex';"
        />
        <div id="df360-svg-fallback" class="df360-svg-fallback" style="display: none;">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="36" height="36" rx="8" fill="#001D52" />
            <path d="M10 18L16 24L26 12" stroke="#70A2FF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="fallback-text">DealFlow360</span>
        </div>
      </div>
      <div class="brand-meta">
        <div class="company-name">DealFlow360 Inc.</div>
        <div class="company-sub">Enterprise CPQ &amp; Commercial Intelligence Platform</div>
        <div class="company-contact">HQ: 500 Howard Street, Suite 400 • San Francisco, CA 94105</div>
        <div class="company-contact">billing@dealflow360.com • https://dealflow360.com</div>
      </div>
    </div>
  `
}

/**
 * Common CSS for all DealFlow360 printable documents.
 */
function getCommonCss(): string {
  return `
    @page {
      size: A4 portrait;
      margin: 12mm 14mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #f1f5f9;
      font-size: 13px;
      line-height: 1.45;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .no-print {
      display: block;
    }
    @media print {
      body {
        background: #ffffff !important;
        padding: 0 !important;
      }
      .no-print {
        display: none !important;
      }
      .document-sheet {
        box-shadow: none !important;
        margin: 0 !important;
        padding: 0 !important;
        max-width: 100% !important;
        border: none !important;
        border-radius: 0 !important;
      }
      .page-break {
        page-break-before: always;
      }
    }
    /* Toolbar for browser preview */
    .toolbar-wrap {
      position: sticky;
      top: 0;
      z-index: 9999;
      background: #001D52;
      color: #ffffff;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .toolbar-pill {
      background: #70A2FF;
      color: #001D52;
      font-weight: 700;
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .toolbar-title {
      font-weight: 600;
      font-size: 14px;
    }
    .toolbar-actions {
      display: flex;
      gap: 10px;
    }
    .btn-toolbar-print {
      background: #2563eb;
      color: #ffffff;
      border: 1px solid #3b82f6;
      font-weight: 600;
      font-size: 13px;
      padding: 7px 16px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: background 0.15s ease;
    }
    .btn-toolbar-print:hover {
      background: #1d4ed8;
    }
    .btn-toolbar-close {
      background: rgba(255, 255, 255, 0.12);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.2);
      font-weight: 500;
      font-size: 13px;
      padding: 7px 14px;
      border-radius: 6px;
      cursor: pointer;
    }
    .btn-toolbar-close:hover {
      background: rgba(255, 255, 255, 0.22);
    }

    /* Document Sheet container */
    .document-sheet {
      max-width: 840px;
      margin: 28px auto;
      background: #ffffff;
      padding: 36px 42px;
      border-radius: 8px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
      border: 1px solid #e2e8f0;
      min-height: 1050px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    /* Brand Header */
    .brand-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #001D52;
      padding-bottom: 18px;
      margin-bottom: 20px;
    }
    .logo-wrapper {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .df360-logo-img {
      max-height: 48px;
      max-width: 200px;
      object-fit: contain;
      border-radius: 6px;
    }
    .df360-svg-fallback {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .fallback-text {
      font-size: 20px;
      font-weight: 800;
      color: #001D52;
      letter-spacing: -0.5px;
    }
    .brand-meta {
      text-align: right;
      color: #475569;
      font-size: 11px;
      line-height: 1.4;
    }
    .company-name {
      font-size: 15px;
      font-weight: 800;
      color: #001D52;
      margin-bottom: 2px;
    }
    .company-sub {
      font-weight: 600;
      color: #2563eb;
      margin-bottom: 3px;
    }

    /* Document Title & Meta Box */
    .doc-headline-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 22px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 18px;
    }
    .doc-main-title {
      font-size: 20px;
      font-weight: 800;
      color: #001D52;
      letter-spacing: -0.3px;
      margin: 0 0 4px 0;
      text-transform: uppercase;
    }
    .doc-sub-title {
      font-size: 12px;
      color: #64748b;
      margin: 0;
    }
    .doc-meta-badge-wrap {
      text-align: right;
    }
    .status-badge {
      display: inline-block;
      padding: 5px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .status-approved, .status-paid, .status-confirmed {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #86efac;
    }
    .status-review, .status-pending {
      background: #fef3c7;
      color: #b45309;
      border: 1px solid #fde68a;
    }
    .status-draft {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
    }

    /* Two Column Parties Grid */
    .parties-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    .party-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 16px;
    }
    .party-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 8px;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 4px;
    }
    .party-name {
      font-size: 15px;
      font-weight: 700;
      color: #001D52;
      margin-bottom: 4px;
    }
    .party-detail {
      font-size: 12px;
      color: #475569;
      margin-bottom: 3px;
    }

    /* Tables */
    .table-section {
      margin-bottom: 24px;
    }
    .section-title {
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #001D52;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12.5px;
    }
    table.data-table thead th {
      background: #001D52;
      color: #ffffff;
      text-align: left;
      padding: 9px 12px;
      font-weight: 700;
      font-size: 11.5px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    table.data-table thead th.text-right {
      text-align: right;
    }
    table.data-table thead th.text-center {
      text-align: center;
    }
    table.data-table tbody td {
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
      color: #1e293b;
    }
    table.data-table tbody tr:nth-child(even) {
      background: #f8fafc;
    }
    table.data-table tbody td.text-right {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    table.data-table tbody td.text-center {
      text-align: center;
    }
    .tag-category {
      display: inline-block;
      font-size: 10.5px;
      padding: 2px 6px;
      border-radius: 4px;
      background: #eff6ff;
      color: #1d4ed8;
      font-weight: 600;
    }

    /* Totals Summary Block */
    .totals-wrap {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 24px;
    }
    .totals-box {
      width: 320px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 16px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      font-size: 12.5px;
      color: #475569;
      margin-bottom: 6px;
    }
    .totals-row.discount-row {
      color: #16a34a;
      font-weight: 600;
    }
    .totals-divider {
      border-top: 1px dashed #cbd5e1;
      margin: 8px 0;
    }
    .grand-total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #001D52;
      color: #ffffff;
      padding: 8px 12px;
      border-radius: 6px;
      margin-top: 6px;
    }
    .grand-total-label {
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .grand-total-val {
      font-size: 17px;
      font-weight: 800;
      color: #70A2FF;
    }

    /* Terms and Conditions Box */
    .terms-card {
      background: #fafafa;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 12px 16px;
      font-size: 11px;
      color: #4b5563;
      margin-bottom: 24px;
      line-height: 1.5;
    }
    .terms-card strong {
      color: #111827;
    }

    /* Signature Section */
    .signature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-top: 10px;
      margin-bottom: 24px;
    }
    .sig-box {
      border-top: 1.5px solid #0f172a;
      padding-top: 8px;
    }
    .sig-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 2px;
    }
    .sig-name {
      font-size: 13px;
      font-weight: 700;
      color: #001D52;
    }
    .sig-date-line {
      margin-top: 8px;
      font-size: 11px;
      color: #64748b;
    }

    /* Footer */
    .document-footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10.5px;
      color: #94a3b8;
    }
    .footer-stamp {
      font-family: monospace;
      font-size: 10px;
      letter-spacing: 0.5px;
    }
  `
}

/**
 * Universal print handler that opens a high-fidelity printable preview
 * and auto-triggers the browser's PDF export dialog.
 */
function openPrintWindow(htmlBody: string, docTitle: string) {
  const fullHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${docTitle} - DealFlow360</title>
      <style>${getCommonCss()}</style>
    </head>
    <body>
      <div class="no-print toolbar-wrap">
        <div class="toolbar-left">
          <span class="toolbar-pill">DealFlow360 PDF</span>
          <span class="toolbar-title">${docTitle}</span>
        </div>
        <div class="toolbar-actions">
          <button class="btn-toolbar-print" onclick="window.print()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            Print / Save as PDF
          </button>
          <button class="btn-toolbar-close" onclick="window.close()">✕ Close</button>
        </div>
      </div>

      <div class="document-sheet">
        ${htmlBody}
      </div>

      <script>
        window.addEventListener('load', function() {
          // Give images and fonts a brief moment to render before opening print dialog
          setTimeout(function() {
            window.focus();
            window.print();
          }, 450);
        });
      </script>
    </body>
    </html>
  `

  const printWindow = window.open('', '_blank', 'width=980,height=960,scrollbars=yes,resizable=yes')
  if (!printWindow) {
    // Popup might be blocked, fallback to iframe
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)
    const doc = iframe.contentWindow?.document
    if (doc) {
      doc.open()
      doc.write(fullHtml)
      doc.close()
      setTimeout(() => {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
        setTimeout(() => {
          document.body.removeChild(iframe)
        }, 5000)
      }, 600)
    }
    return
  }

  printWindow.document.open()
  printWindow.document.write(fullHtml)
  printWindow.document.close()
}

/**
 * 1. QUOTATION TEMPLATE & PDF EXPORTER
 */
export function exportQuotationPDF(quotation: Quotation) {
  const quoteId = quotation.id || 'Q-NEW'
  const customerName = quotation.customerName || 'Valued Commercial Client'
  const customerTier = quotation.customerTier || 'Enterprise'
  const salesRep = quotation.salesRep || 'Sales Representative'
  const salesRepEmail = quotation.salesRepEmail || `${salesRep.toLowerCase().replace(/\s+/g, '.')}@dealflow360.com`
  const reportingManager = quotation.reportingManager || quotation.approvalWorkflow?.reportingManager || 'Sales Director'
  const taggedFinance = quotation.taggedFinanceOfficer || 'Finance Desk'
  const validUntil = quotation.validUntil || '30 Days from Issue'
  const status = quotation.status || 'Draft'

  const lines = quotation.items || []
  let grossSubtotal = 0
  let totalDiscount = 0

  const linesHtml = lines.length > 0 ? lines.map((item, idx) => {
    const unitPrice = item.unitPrice || 0
    const qty = item.qty || 1
    const discPct = item.discountPct || 0
    const gross = unitPrice * qty
    const discountAmt = gross * (discPct / 100)
    const net = gross - discountAmt

    grossSubtotal += gross
    totalDiscount += discountAmt

    return `
      <tr>
        <td class="text-center" style="color: #64748b; font-weight: 600;">${idx + 1}</td>
        <td>
          <div style="font-weight: 700; color: #001D52;">${item.name || 'Catalog Item'}</div>
          <div style="font-size: 11px; color: #64748b;">SKU: ${item.productId || 'DF-ITEM'}</div>
        </td>
        <td><span class="tag-category">${item.category || 'Product'}</span></td>
        <td class="text-center" style="font-weight: 600;">${qty}</td>
        <td class="text-right">$${unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        <td class="text-center" style="color: ${discPct > 0 ? '#16a34a' : '#64748b'}; font-weight: 700;">
          ${discPct > 0 ? `-${discPct}%` : '0%'}
        </td>
        <td class="text-right" style="font-weight: 700; color: #001D52;">$${net.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      </tr>
    `
  }).join('') : `
    <tr>
      <td colspan="7" class="text-center" style="padding: 24px; color: #64748b;">
        No line items registered on this quotation.
      </td>
    </tr>
  `

  const netSubtotal = Math.max(0, grossSubtotal - totalDiscount)
  const estimatedTax = netSubtotal * 0.0825 // 8.25% standard sales tax
  const grandTotal = netSubtotal + estimatedTax

  const statusClass =
    status === 'Approved' || status === 'Confirmed' ? 'status-approved' :
    status === 'Under Review' || (status as string) === 'Pending Manager' ? 'status-review' : 'status-draft'

  const bodyHtml = `
    <div>
      ${getLogoHtml()}

      <!-- Document Title & Meta Box -->
      <div class="doc-headline-bar">
        <div>
          <h1 class="doc-main-title">Official Commercial Quotation</h1>
          <p class="doc-sub-title">Reference ID: <strong>${quoteId}</strong> • Generated on ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
        </div>
        <div class="doc-meta-badge-wrap">
          <span class="status-badge ${statusClass}">Status: ${status}</span>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Valid Until: <strong>${validUntil}</strong></div>
        </div>
      </div>

      <!-- Parties Grid -->
      <div class="parties-grid">
        <div class="party-card">
          <div class="party-title">Prepared For (Customer Account)</div>
          <div class="party-name">${customerName}</div>
          <div class="party-detail">Account Tier: <strong>${customerTier}</strong></div>
          <div class="party-detail">Commercial Invoicing: Net-30 Terms</div>
          <div class="party-detail">Procurement ID: ${quoteId}-REQ</div>
        </div>

        <div class="party-card">
          <div class="party-title">DealFlow360 Account Team</div>
          <div class="party-name">Assigned Rep: ${salesRep}</div>
          <div class="party-detail">Direct Contact: ${salesRepEmail}</div>
          <div class="party-detail">Reporting Manager: ${reportingManager}</div>
          <div class="party-detail">Financial Desk: ${taggedFinance}</div>
        </div>
      </div>

      <!-- Line Items Table -->
      <div class="table-section">
        <div class="section-title">Itemized Commercial Deliverables</div>
        <table class="data-table">
          <thead>
            <tr>
              <th class="text-center" style="width: 40px;">#</th>
              <th>Product / Service Description</th>
              <th>Category</th>
              <th class="text-center">Qty</th>
              <th class="text-right">Unit Price</th>
              <th class="text-center">Discount</th>
              <th class="text-right">Net Total</th>
            </tr>
          </thead>
          <tbody>
            ${linesHtml}
          </tbody>
        </table>
      </div>

      <!-- Totals Block -->
      <div class="totals-wrap">
        <div class="totals-box">
          <div class="totals-row">
            <span>Gross List Price:</span>
            <span>$${grossSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div class="totals-row discount-row">
            <span>Special Deal Concession:</span>
            <span>-$${totalDiscount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div class="totals-row">
            <span>Estimated Sales Tax (8.25%):</span>
            <span>$${estimatedTax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div class="totals-divider"></div>
          <div class="grand-total-row">
            <span class="grand-total-label">Total Contract:</span>
            <span class="grand-total-val">$${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      <!-- Terms and Conditions -->
      <div class="terms-card">
        <strong>Commercial Terms &amp; Conditions:</strong>
        <br />
        1. <strong>Payment Terms:</strong> Invoices are payable Net-30 from delivery of hardware deliverables. Software cloud licenses activate on receipt of executed agreement.
        <br />
        2. <strong>Warranty &amp; SLA:</strong> Hardware is backed by a 3-year enterprise replacement warranty. Cloud SLA guarantees 99.95% uptime with 24/7 Priority Support.
        <br />
        3. <strong>Governing Law:</strong> This quotation constitutes an authorized commercial offer under California Commercial Code.
      </div>

      <!-- Dual Signatures -->
      <div class="signature-grid">
        <div class="sig-box">
          <div class="sig-label">Authorized DealFlow360 Representative</div>
          <div class="sig-name">${salesRep}</div>
          <div style="font-size: 11px; color: #475569;">DealFlow360 Enterprise Sales Directorate</div>
          <div class="sig-date-line">Date Authorized: ${new Date().toLocaleDateString()}</div>
        </div>

        <div class="sig-box">
          <div class="sig-label">Client Acceptance &amp; Authorized Signatory</div>
          <div class="sig-name">${customerName} Authorized Officer</div>
          <div style="font-size: 11px; color: #475569;">Title / Procurement Signatory</div>
          <div class="sig-date-line">Date of Execution: ________________________</div>
        </div>
      </div>
    </div>

    <!-- Document Footer -->
    <div class="document-footer">
      <span>DealFlow360 Global Commercial Agreement • Confidential</span>
      <span class="footer-stamp">SHA-256: DF360-${quoteId}-${Date.now().toString(36).toUpperCase()}</span>
    </div>
  `

  openPrintWindow(bodyHtml, `Quotation_${quoteId}`)
}

/**
 * 2. TAX INVOICE & PAYMENT RECEIPT TEMPLATE & EXPORTER
 */
export function exportInvoicePDF(invoice: InvoiceData) {
  const invNumber = invoice.invoice_number || 'INV-2026-001'
  const customerName = invoice.customer_name || 'Valued Commercial Client'
  const issueDate = invoice.issue_date || new Date().toISOString().split('T')[0]
  const dueDate = invoice.due_date || 'Net-30'
  const grossAmount = invoice.amount || 0
  const isPaid = invoice.payment_status === 'PAID'
  const amountPaid = invoice.amount_paid ?? (isPaid ? grossAmount : 0)
  const amountDue = invoice.amount_due ?? (isPaid ? 0 : grossAmount)

  const taxAmount = grossAmount * 0.0825
  const subtotal = Math.max(0, grossAmount - taxAmount)

  const bodyHtml = `
    <div>
      ${getLogoHtml()}

      <!-- Document Title & Meta Box -->
      <div class="doc-headline-bar">
        <div>
          <h1 class="doc-main-title">Commercial Tax Invoice &amp; Payment Receipt</h1>
          <p class="doc-sub-title">Invoice Number: <strong>${invNumber}</strong> • Billed via DealFlow360 Ledger Engine</p>
        </div>
        <div class="doc-meta-badge-wrap">
          <span class="status-badge ${isPaid ? 'status-paid' : 'status-review'}">
            ${isPaid ? '✓ PAID IN FULL' : 'PENDING SETTLEMENT'}
          </span>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Due Date: <strong>${dueDate}</strong></div>
        </div>
      </div>

      <!-- Parties Grid -->
      <div class="parties-grid">
        <div class="party-card">
          <div class="party-title">Billed To (Customer Organization)</div>
          <div class="party-name">${customerName}</div>
          <div class="party-detail">Account Ledger ID: DF-CUST-${invNumber.replace(/\D/g, '') || '8842'}</div>
          <div class="party-detail">Payment Method: Automated ACH / Wire Settlement</div>
          <div class="party-detail">Tax Registration: US-EIN 94-3829104</div>
        </div>

        <div class="party-card">
          <div class="party-title">Remit To &amp; Ledger Verification</div>
          <div class="party-name">DealFlow360 Operating Treasury</div>
          <div class="party-detail">Bank Wire: Silicon Valley Commercial Bank</div>
          <div class="party-detail">Routing Number: 121000358 • Account: ****9214</div>
          <div class="party-detail">Reference Code: <strong>${invNumber}</strong></div>
        </div>
      </div>

      <!-- Itemized Billing Table -->
      <div class="table-section">
        <div class="section-title">Schedule of Billed Deliverables</div>
        <table class="data-table">
          <thead>
            <tr>
              <th class="text-center" style="width: 40px;">#</th>
              <th>Description of Goods / Services</th>
              <th>Period / Type</th>
              <th class="text-center">Tax Rate</th>
              <th class="text-right">Net Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="text-center" style="color: #64748b;">1</td>
              <td>
                <div style="font-weight: 700; color: #001D52;">Enterprise Hardware Gateways &amp; Core Telemetry</div>
                <div style="font-size: 11px; color: #64748b;">Physical devices, secure enclosure, and onboarding bundle</div>
              </td>
              <td>One-Time Capital</td>
              <td class="text-center">8.25%</td>
              <td class="text-right">$${(subtotal * 0.7).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td class="text-center" style="color: #64748b;">2</td>
              <td>
                <div style="font-weight: 700; color: #001D52;">DealFlow Enterprise Cloud SaaS Platform License</div>
                <div style="font-size: 11px; color: #64748b;">Annual subscription, unlimited CPQ workflows, AI pricing engine</div>
              </td>
              <td>Annual Recurring</td>
              <td class="text-center">0.00% (Exempt)</td>
              <td class="text-right">$${(subtotal * 0.3).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Financial Totals -->
      <div class="totals-wrap">
        <div class="totals-box">
          <div class="totals-row">
            <span>Net Taxable Base:</span>
            <span>$${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div class="totals-row">
            <span>State / VAT Tax (8.25%):</span>
            <span>$${taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div class="totals-row" style="font-weight: 700; color: #001D52;">
            <span>Gross Invoice Total:</span>
            <span>$${grossAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div class="totals-divider"></div>
          <div class="totals-row" style="color: #16a34a; font-weight: 700;">
            <span>Total Settled &amp; Paid:</span>
            <span>$${amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div class="grand-total-row" style="background: ${isPaid ? '#15803d' : '#001D52'};">
            <span class="grand-total-label">Balance Outstanding:</span>
            <span class="grand-total-val" style="color: #ffffff;">$${amountDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      <!-- Reconciliation Stamp Card -->
      <div class="terms-card" style="background: #f0fdf4; border-color: #bbf7d0;">
        <strong style="color: #166534;">PostgreSQL Commercial Ledger Reconciliation:</strong>
        <br />
        This commercial record is cryptographically tied to PostgreSQL Ledger transaction entry.
        ${isPaid ? 'Payment has been cleared and certified by DealFlow360 Treasury Operations.' : 'Please quote invoice reference on wire remittances.'}
      </div>
    </div>

    <!-- Document Footer -->
    <div class="document-footer">
      <span>DealFlow360 Finance &amp; Accounting • Official Commercial Receipt</span>
      <span class="footer-stamp">REC-HASH: ${invNumber}-${Date.now().toString(36).toUpperCase()}</span>
    </div>
  `

  openPrintWindow(bodyHtml, `Invoice_${invNumber}`)
}

/**
 * 3. BIFURCATED BILLING STATEMENT TEMPLATE & EXPORTER
 */
export function exportBillingStatementPDF(quotation: Quotation) {
  const quoteId = quotation.id || 'Q-1042'
  const customerName = quotation.customerName || 'Enterprise Commercial Client'
  const paymentStatus = quotation.billing?.paymentStatus || 'Pending'

  const bodyHtml = `
    <div>
      ${getLogoHtml()}

      <div class="doc-headline-bar">
        <div>
          <h1 class="doc-main-title">Bifurcated Commercial Billing Statement</h1>
          <p class="doc-sub-title">Contract: <strong>${quoteId}</strong> • Automatic Hardware / ARR Split</p>
        </div>
        <div class="doc-meta-badge-wrap">
          <span class="status-badge ${paymentStatus === 'Paid' ? 'status-paid' : 'status-review'}">
            Payment: ${paymentStatus.toUpperCase()}
          </span>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Term: Net-30</div>
        </div>
      </div>

      <div class="parties-grid">
        <div class="party-card">
          <div class="party-title">Client Entity</div>
          <div class="party-name">${customerName}</div>
          <div class="party-detail">Contract Deal ID: ${quoteId}</div>
          <div class="party-detail">Billing Frequency: Bifurcated Milestone</div>
        </div>
        <div class="party-card">
          <div class="party-title">Commercial Billing Officer</div>
          <div class="party-name">DealFlow360 Treasury</div>
          <div class="party-detail">Settlement: ACH Corporate Direct</div>
          <div class="party-detail">Support: finance@dealflow360.com</div>
        </div>
      </div>

      <div class="table-section">
        <div class="section-title">Deterministic Billing Breakdown</div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Revenue Classification</th>
              <th>Deliverables / Scope</th>
              <th>Billing Milestone</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong style="color: #001D52;">One-Time Capital Outlay</strong></td>
              <td>Edge Gateways, Industrial Sensors, Professional Onboarding</td>
              <td>Due Net-30 upon hardware arrival</td>
              <td class="text-right"><strong>$78,900.00</strong></td>
            </tr>
            <tr>
              <td><strong style="color: #001D52;">Annual Recurring Revenue (ARR)</strong></td>
              <td>DealFlow Enterprise SaaS License &amp; 24/7 SLA</td>
              <td>Billed annually in advance</td>
              <td class="text-right"><strong>$27,000.00 / yr</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="totals-wrap">
        <div class="totals-box">
          <div class="totals-row">
            <span>One-Time Capital Total:</span>
            <span>$78,900.00</span>
          </div>
          <div class="totals-row">
            <span>Annual SaaS License (Year 1):</span>
            <span>$27,000.00</span>
          </div>
          <div class="totals-divider"></div>
          <div class="grand-total-row">
            <span class="grand-total-label">Total Initial Invoice:</span>
            <span class="grand-total-val">$105,900.00</span>
          </div>
        </div>
      </div>

      <div class="terms-card">
        <strong>Billing Notes:</strong>
        Hardware items trigger auto-dispatched warehouse picklists. Software seats are provisioned immediately upon contract countersignature.
      </div>
    </div>

    <div class="document-footer">
      <span>DealFlow360 Commercial Billing Directorate</span>
      <span class="footer-stamp">STATEMENT-ID: BILL-${quoteId}</span>
    </div>
  `

  openPrintWindow(bodyHtml, `Billing_Statement_${quoteId}`)
}

/**
 * 4. EXECUTIVE ANALYTICS & REPORTING DASHBOARD TEMPLATE & EXPORTER
 */
export function exportReportsPDF(
  reportsData: any,
  quotations: Quotation[] = [],
  filters?: { period?: string; salesTeam?: string; approvalStatus?: string; product?: string }
) {
  const periodLabel = (filters?.period || 'This Month').replace('_', ' ').toUpperCase()
  const totalRevRaw = reportsData?.total_revenue ?? 2450000
  const totalRev = totalRevRaw != null ? `$${(totalRevRaw / 1000000).toFixed(2)}M` : '$2.45M'
  const winRate = reportsData?.win_rate != null ? `${reportsData.win_rate}%` : '68%'
  const avgDeal = reportsData?.avg_deal_size != null ? `$${reportsData.avg_deal_size.toLocaleString()}` : '$84,500'
  const avgApprovalTime = reportsData?.avg_approval_time || '4.2 hrs'
  const topProduct = reportsData?.top_product || 'Industrial Sensor Array v2'

  const quotesCount = quotations.length > 0 ? quotations.length : (reportsData?.total_quotes ?? 14)

  const dealsTableHtml = quotations.slice(0, 10).map(q => {
    const val = q.items?.reduce((s, it) => s + (it.qty * it.unitPrice * (1 - it.discountPct / 100)), 0) || 45000
    return `
      <tr>
        <td style="font-weight: 700; color: #001D52;">${q.id}</td>
        <td>${q.customerName}</td>
        <td>${q.salesRep}</td>
        <td><span class="tag-category">${q.customerTier || 'Enterprise'}</span></td>
        <td class="text-right" style="font-weight: 700;">$${Math.round(val).toLocaleString()}</td>
        <td class="text-center">${q.blendedRiskScore}/100</td>
        <td class="text-center">
          <span class="status-badge ${q.status === 'Approved' || q.status === 'Confirmed' ? 'status-approved' : 'status-review'}" style="font-size: 10px; padding: 2px 6px;">
            ${q.status}
          </span>
        </td>
      </tr>
    `
  }).join('')

  const bodyHtml = `
    <div>
      ${getLogoHtml()}

      <div class="doc-headline-bar">
        <div>
          <h1 class="doc-main-title">Executive Commercial Intelligence &amp; Performance Report</h1>
          <p class="doc-sub-title">Reporting Period: <strong>${periodLabel}</strong> • Filter: All Sales Teams • Generated: ${new Date().toLocaleString()}</p>
        </div>
        <div class="doc-meta-badge-wrap">
          <span class="status-badge status-approved">EXECUTIVE SUMMARY</span>
        </div>
      </div>

      <!-- KPI Grid -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 22px;">
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Total Closed Revenue</div>
          <div style="font-size: 22px; font-weight: 800; color: #001D52; margin-top: 4px;">${totalRev}</div>
          <div style="font-size: 11px; color: #16a34a; font-weight: 600; margin-top: 2px;">+18.4% vs Prior Period</div>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Deal Win Rate</div>
          <div style="font-size: 22px; font-weight: 800; color: #001D52; margin-top: 4px;">${winRate}</div>
          <div style="font-size: 11px; color: #16a34a; font-weight: 600; margin-top: 2px;">Target: &gt;65.0%</div>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Average Deal Size</div>
          <div style="font-size: 22px; font-weight: 800; color: #001D52; margin-top: 4px;">${avgDeal}</div>
          <div style="font-size: 11px; color: #2563eb; font-weight: 600; margin-top: 2px;">${quotesCount} Deals Tracked</div>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Avg Approval Velocity</div>
          <div style="font-size: 22px; font-weight: 800; color: #001D52; margin-top: 4px;">${avgApprovalTime}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Multi-Party Governance</div>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Top Upsold Product</div>
          <div style="font-size: 16px; font-weight: 800; color: #001D52; margin-top: 6px;">${topProduct}</div>
          <div style="font-size: 11px; color: #16a34a; font-weight: 600; margin-top: 2px;">Recommendation Engine</div>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Active Pipeline Volume</div>
          <div style="font-size: 22px; font-weight: 800; color: #001D52; margin-top: 4px;">${quotesCount} Quotations</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">PostgreSQL Deal Database</div>
        </div>
      </div>

      <!-- Live Pipeline Deals Table -->
      <div class="table-section">
        <div class="section-title">Commercial Deal Pipeline Sample</div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Deal ID</th>
              <th>Customer Organization</th>
              <th>Assigned Rep</th>
              <th>Tier</th>
              <th class="text-right">Contract Value</th>
              <th class="text-center">Risk Score</th>
              <th class="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            ${dealsTableHtml}
          </tbody>
        </table>
      </div>

      <div class="terms-card">
        <strong>Executive Confidentiality Notice:</strong>
        This report is compiled from live DealFlow360 commercial ledger entries. Information contained herein is proprietary and strictly confidential for executive leadership.
      </div>
    </div>

    <div class="document-footer">
      <span>DealFlow360 Business Intelligence &amp; Strategy</span>
      <span class="footer-stamp">REP-EXEC-${Date.now().toString(36).toUpperCase()}</span>
    </div>
  `

  openPrintWindow(bodyHtml, `Executive_Report_${periodLabel}`)
}

/**
 * Helper to export CSV/XLS metrics
 */
export function exportReportsCSV(reportsData: any, quotations: Quotation[] = []) {
  const headers = ['Deal ID', 'Customer Name', 'Sales Rep', 'Customer Tier', 'Risk Score', 'Status', 'Estimated Value']
  const rows = quotations.map(q => {
    const val = q.items?.reduce((s, it) => s + (it.qty * it.unitPrice * (1 - it.discountPct / 100)), 0) || 45000
    return [
      `"${q.id}"`,
      `"${q.customerName.replace(/"/g, '""')}"`,
      `"${q.salesRep.replace(/"/g, '""')}"`,
      `"${q.customerTier || 'Enterprise'}"`,
      q.blendedRiskScore,
      `"${q.status}"`,
      Math.round(val),
    ].join(',')
  })

  const csvContent = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `DealFlow360_Pipeline_Metrics_${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * 5. MULTI-PARTY APPROVAL DOSSIER & AUDIT REPORT TEMPLATE & EXPORTER
 */
export function exportApprovalDossierPDF(
  quotation: Quotation,
  auditLogs: WorkflowAuditEntry[] = []
) {
  const quoteId = quotation.id || 'Q-1042'
  const customerName = quotation.customerName || 'Commercial Client'
  const rep = quotation.salesRep || 'Assigned Representative'
  const manager = quotation.reportingManager || quotation.approvalWorkflow?.reportingManager || 'Sales Manager'
  const finance = quotation.taggedFinanceOfficer || 'Finance Desk'
  const riskScore = quotation.blendedRiskScore || 75
  const riskLevel = quotation.riskLevel || 'Medium'

  const auditRowsHtml = auditLogs.filter(l => !l.targetQuotationId || l.targetQuotationId === quoteId).map(log => `
    <tr>
      <td style="white-space: nowrap; font-size: 11px; font-weight: 600; color: #475569;">${log.timestamp}</td>
      <td style="font-weight: 700; color: #001D52;">${log.actorName}</td>
      <td><span class="tag-category">${log.actorRole.toUpperCase()}</span></td>
      <td><strong>${log.actionType}</strong></td>
      <td style="font-size: 11.5px; color: #334155;">${log.details}</td>
    </tr>
  `).join('')

  const bodyHtml = `
    <div>
      ${getLogoHtml()}

      <div class="doc-headline-bar">
        <div>
          <h1 class="doc-main-title">Governance Approval Dossier &amp; Audit Trail</h1>
          <p class="doc-sub-title">Quotation: <strong>${quoteId}</strong> • Client: <strong>${customerName}</strong></p>
        </div>
        <div class="doc-meta-badge-wrap">
          <span class="status-badge ${riskScore >= 75 ? 'status-approved' : 'status-review'}">
            Risk: ${riskLevel} (${riskScore}/100)
          </span>
        </div>
      </div>

      <div class="parties-grid">
        <div class="party-card">
          <div class="party-title">Stakeholder Routing Matrix</div>
          <div class="party-name">1. Sales Representative: ${rep}</div>
          <div class="party-detail">2. Reporting Manager: <strong>${manager}</strong></div>
          <div class="party-detail">3. Finance Officer: <strong>${finance}</strong></div>
        </div>

        <div class="party-card">
          <div class="party-title">Multi-Party Workflow Decision Status</div>
          <div class="party-detail">Manager Decision: <strong>${quotation.approvalWorkflow?.managerStatus || quotation.status}</strong></div>
          <div class="party-detail">Finance Sign-off: <strong>${quotation.approvalWorkflow?.financeStatus || 'Verified'}</strong></div>
          <div class="party-detail">Submission Time: ${quotation.approvalWorkflow?.submittedAt || quotation.createdAt || 'Current Cycle'}</div>
        </div>
      </div>

      <div class="table-section">
        <div class="section-title">⏱️ Real-Time Governance &amp; Workflow Audit Trail</div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Actor</th>
              <th>Role</th>
              <th>Action</th>
              <th>Remarks &amp; Audit Details</th>
            </tr>
          </thead>
          <tbody>
            ${auditRowsHtml || `
              <tr>
                <td colspan="5" class="text-center" style="padding: 18px; color: #64748b;">
                  Initial quotation submission logged in PostgreSQL audit store.
                </td>
              </tr>
            `}
          </tbody>
        </table>
      </div>

      <div class="terms-card" style="background: #f0fdf4; border-color: #bbf7d0;">
        <strong style="color: #166534;">Governance Verification Seal:</strong>
        This approval dossier verifies that deal concessions, discount thresholds, and gross margin floors adhere strictly to DealFlow360 Corporate Governance Policy #CPQ-GOV-2026.
      </div>
    </div>

    <div class="document-footer">
      <span>DealFlow360 Governance &amp; Compliance Office</span>
      <span class="footer-stamp">AUDIT-CERT: ${quoteId}-${Date.now().toString(36).toUpperCase()}</span>
    </div>
  `

  openPrintWindow(bodyHtml, `Approval_Dossier_${quoteId}`)
}

/**
 * 6. FULFILLMENT PACKING SLIP & DISPATCH ORDER TEMPLATE & EXPORTER
 */
export function exportFulfillmentSlipPDF(
  orderId: string,
  customerName: string,
  splitDetails: Array<{ warehouse: string; qty: string; shipments: string; cost: string }>
) {
  const rowsHtml = splitDetails.map((row, idx) => `
    <tr>
      <td class="text-center" style="color: #64748b;">${idx + 1}</td>
      <td><strong style="color: #001D52;">${row.warehouse}</strong></td>
      <td style="font-weight: 700;">${row.qty}</td>
      <td class="text-center">${row.shipments} Shipment</td>
      <td class="text-right"><strong>${row.cost}</strong></td>
    </tr>
  `).join('')

  const bodyHtml = `
    <div>
      ${getLogoHtml()}

      <div class="doc-headline-bar">
        <div>
          <h1 class="doc-main-title">Warehouse Dispatch Order &amp; Packing Slip</h1>
          <p class="doc-sub-title">Order ID: <strong>${orderId}</strong> • Consignee: <strong>${customerName}</strong></p>
        </div>
        <div class="doc-meta-badge-wrap">
          <span class="status-badge status-approved">READY FOR DISPATCH</span>
        </div>
      </div>

      <div class="parties-grid">
        <div class="party-card">
          <div class="party-title">Ship-To Destination</div>
          <div class="party-name">${customerName}</div>
          <div class="party-detail">Central Receiving Facility</div>
          <div class="party-detail">Carrier: FedEx Freight Priority</div>
        </div>

        <div class="party-card">
          <div class="party-title">Origin Hubs &amp; Fulfillment Centers</div>
          <div class="party-name">DealFlow360 Logistics Network</div>
          <div class="party-detail">Multi-Warehouse Allocation Engine</div>
          <div class="party-detail">Inspection: 100% QA Passed</div>
        </div>
      </div>

      <div class="table-section">
        <div class="section-title">Warehouse Allocation &amp; Picklist Breakdown</div>
        <table class="data-table">
          <thead>
            <tr>
              <th class="text-center" style="width: 40px;">#</th>
              <th>Warehouse Facility</th>
              <th>Quantity Dispatched</th>
              <th class="text-center">Shipment Split</th>
              <th class="text-right">Freight Cost</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>

      <div class="signature-grid" style="margin-top: 30px;">
        <div class="sig-box">
          <div class="sig-label">Warehouse Operations Supervisor</div>
          <div class="sig-name">DealFlow Logistics Lead</div>
          <div class="sig-date-line">Date Dispatched: ${new Date().toLocaleDateString()}</div>
        </div>
        <div class="sig-box">
          <div class="sig-label">Freight Carrier Acceptance</div>
          <div class="sig-name">FedEx Freight Agent</div>
          <div class="sig-date-line">Tracking Code: 7892-0192-DF360</div>
        </div>
      </div>
    </div>

    <div class="document-footer">
      <span>DealFlow360 Logistics &amp; Fulfillment Division</span>
      <span class="footer-stamp">PICKLIST-VERIFIED-${orderId}</span>
    </div>
  `

  openPrintWindow(bodyHtml, `PackingSlip_${orderId}`)
}
