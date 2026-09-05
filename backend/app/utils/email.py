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


def build_provisioning_email_html(
    full_name: str,
    email: str,
    role_label: str,
    password: str,
    login_url: str,
    company_name: str = "DealFlow360"
) -> str:
    """
    Constructs a modern, branded Role Provisioning & Credentials email for newly alloted users.
    """
    name_display = full_name or "Colleague"
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your DealFlow360 Role Provisioning & Access Credentials</title>
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
          margin-bottom: 20px;
        }}
        .role-badge-box {{
          display: inline-block;
          background-color: #EFF6FF;
          border: 1px solid #BFDBFE;
          border-radius: 20px;
          padding: 6px 16px;
          font-size: 13px;
          font-weight: 600;
          color: #1D4ED8;
          margin-bottom: 24px;
        }}
        .cred-card {{
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 20px;
          margin: 24px 0;
        }}
        .cred-row {{
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #EDF2F7;
          font-size: 14px;
        }}
        .cred-row:last-child {{
          border-bottom: none;
        }}
        .cred-label {{
          color: #64748B;
          font-weight: 500;
        }}
        .cred-val {{
          color: #0F172A;
          font-weight: 600;
          font-family: monospace;
        }}
        .btn-wrapper {{
          text-align: center;
          margin: 32px 0;
        }}
        .login-btn {{
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
          <div class="greeting">Hello {name_display},</div>
          <p class="text">
            An administrator has provisioned access for you on the <strong>DealFlow360</strong> platform for <strong>{company_name}</strong>.
          </p>
          <div>
            <span class="role-badge-box">Assigned Role: {role_label}</span>
          </div>
          
          <div class="cred-card">
            <div style="font-weight: 600; margin-bottom: 12px; color: #1E293B;">Your Sign-In Credentials:</div>
            <div style="margin-bottom: 8px;"><strong>Email:</strong> {email}</div>
            <div style="margin-bottom: 8px;"><strong>Password:</strong> <span style="background: #E2E8F0; padding: 2px 8px; border-radius: 4px; font-family: monospace;">{password}</span></div>
            <div><strong>Role Access:</strong> {role_label}</div>
          </div>

          <div class="btn-wrapper">
            <a href="{login_url}" class="login-btn" target="_blank">Sign in to DealFlow360</a>
          </div>

          <p class="text" style="font-size: 13px; color: #64748B;">
            Direct URL: <a href="{login_url}" style="color: #2563EB;">{login_url}</a>
          </p>
        </div>
        <div class="footer">
          &copy; 2026 DealFlow360 B2B Sales Operations Platform. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    """


def build_admin_message_email_html(
    recipient_name: str,
    subject: str,
    message_body: str,
    sender_name: str = "Root Administrator (Sarah Connor)",
    priority: str = "Standard"
) -> str:
    """
    Constructs an official executive message email sent via the Admin Console.
    """
    body_formatted = message_body.replace("\n", "<br>")
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>{subject}</title>
      <style>
        body {{
          margin: 0; padding: 0; background-color: #F8FAFC;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #0F172A;
        }}
        .wrapper {{
          max-width: 600px; margin: 40px auto; background: #FFFFFF;
          border-radius: 12px; border: 1px solid #E2E8F0; overflow: hidden;
        }}
        .header {{ background: #0F172A; padding: 28px; text-align: center; color: white; }}
        .body {{ padding: 36px; }}
        .badge {{ background: #FEF3C7; color: #92400E; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }}
        .msg-box {{ background: #F1F5F9; border-left: 4px solid #2563EB; padding: 18px; margin: 20px 0; border-radius: 4px; line-height: 1.6; }}
        .footer {{ background: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 20px; text-align: center; font-size: 12px; color: #94A3B8; }}
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h2 style="margin:0;">DealFlow<span style="color:#38BDF8;">360</span> &bull; Direct Message</h2>
        </div>
        <div class="body">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <span style="font-size:16px; font-weight:600;">To: {recipient_name}</span>
            <span class="badge">Priority: {priority.upper()}</span>
          </div>
          <div style="color:#64748B; font-size:13px; margin-bottom:16px;">From: {sender_name}</div>
          
          <div class="msg-box">
            {body_formatted}
          </div>
          
          <div style="text-align:center; margin-top:28px;">
            <a href="http://localhost:3000" style="background:#2563EB; color:white; padding:10px 24px; text-decoration:none; border-radius:6px; font-size:14px; font-weight:600;">Open DealFlow360 Workspace</a>
          </div>
        </div>
        <div class="footer">
          DealFlow360 Internal Message Communication Dispatch
        </div>
      </div>
    </body>
    </html>
    """
