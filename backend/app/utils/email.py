# ============================================================
# DealFlow360 — Email Utility (Resend)
# ============================================================
import os
import logging
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("dealflow360.email")

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", "DealFlow360 <onboarding@resend.dev>")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

def send_email(to: str, subject: str, html: str) -> Dict[str, Any]:
    """
    Sends an email using the Resend API.
    Returns a dict with success boolean, id, or error details.
    """
    if not RESEND_API_KEY:
        logger.warning(f"[EMAIL MOCK] No RESEND_API_KEY provided. Simulated sending email to {to}: '{subject}'")
        return {"success": True, "simulated": True, "to": to, "subject": subject}

    try:
        import resend
        resend.api_key = RESEND_API_KEY

        params = {
            "from": EMAIL_FROM,
            "to": [to],
            "subject": subject,
            "html": html,
        }
        response = resend.Emails.send(params)
        logger.info(f"[EMAIL SENT] Successfully sent email to {to} via Resend. ID: {response.get('id') if isinstance(response, dict) else response}")
        return {"success": True, "response": response, "to": to}
    except Exception as e:
        err_msg = str(e)
        logger.error(f"[EMAIL ERROR] Failed to send email to {to} via Resend: {err_msg}")
        # Return structured error so caller can inspect and fallback gracefully
        return {"success": False, "error": err_msg, "to": to}


def build_verification_email_html(full_name: str, verification_url: str, token: str) -> str:
    """
    Constructs a modern, premium branded HTML verification email.
    """
    name_display = full_name or "Valued Customer"
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify your DealFlow360 Account</title>
      <style>
        body {{
          margin: 0;
          padding: 0;
          background-color: #F8FAFC;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #0F172A;
        }}
        .email-wrapper {{
          max-width: 600px;
          margin: 40px auto;
          background: #FFFFFF;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }}
        .header {{
          background: #0F172A;
          padding: 32px 40px;
          text-align: center;
        }}
        .brand-title {{
          color: #FFFFFF;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.02em;
          margin: 0;
        }}
        .brand-title span {{
          color: #38BDF8;
        }}
        .content {{
          padding: 40px;
        }}
        .greeting {{
          font-size: 18px;
          font-weight: 600;
          color: #0F172A;
          margin-bottom: 16px;
        }}
        .text {{
          font-size: 15px;
          line-height: 1.6;
          color: #475569;
          margin-bottom: 24px;
        }}
        .btn-wrapper {{
          text-align: center;
          margin: 32px 0;
        }}
        .verify-btn {{
          display: inline-block;
          background-color: #2563EB;
          color: #FFFFFF !important;
          padding: 14px 32px;
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
        }}
        .token-box {{
          background: #F1F5F9;
          border: 1px dashed #CBD5E1;
          border-radius: 8px;
          padding: 14px;
          font-family: monospace;
          font-size: 13px;
          color: #334155;
          word-break: break-all;
          text-align: center;
          margin-bottom: 24px;
        }}
        .footer {{
          background: #F8FAFC;
          border-top: 1px solid #E2E8F0;
          padding: 24px 40px;
          text-align: center;
          font-size: 12px;
          color: #94A3B8;
        }}
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header">
          <h1 class="brand-title">DealFlow<span>360</span></h1>
        </div>
        <div class="content">
          <div class="greeting">Welcome, {name_display}!</div>
          <p class="text">
            Thank you for signing up for DealFlow360. To activate your Customer Portal account and start reviewing quotations, approving orders, and tracking invoices, please verify your email address.
          </p>
          <div class="btn-wrapper">
            <a href="{verification_url}" class="verify-btn" target="_blank">Verify Email Address</a>
          </div>
          <p class="text" style="font-size: 13px;">
            If the button above does not work, you can also copy and paste the following link into your browser:
          </p>
          <div class="token-box">
            {verification_url}
          </div>
          <p class="text" style="font-size: 12px; color: #94A3B8; margin-bottom: 0;">
            This verification link will expire in 24 hours. If you did not create this account, you can safely ignore this email.
          </p>
        </div>
        <div class="footer">
          &copy; 2026 DealFlow360 B2B Sales Operations Platform. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    """
