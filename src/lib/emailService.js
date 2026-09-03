/**
 * District 3011 Resend Email Service
 *
 * All email dispatch routes exclusively through the Vercel serverless proxy
 * (/api/send-email). The RESEND_API_KEY lives ONLY on the server.
 * ZERO secrets are ever sent to or used by the browser.
 */
import { dbService } from './supabaseClient';

/**
 * Universal Serverless Proxy Dispatcher
 * Routes all email types through /api/send-email — no API key in the browser bundle.
 */
async function callEmailApi(type, payload) {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, payload })
    });

    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      return data.success
        ? { success: true, data }
        : { success: false, error: data.error || 'Email dispatch failed.' };
    }

    let errMsg = `Server error ${res.status}`;
    if (contentType.includes('application/json')) {
      try { const d = await res.json(); errMsg = d.error || errMsg; } catch (_) {}
    }
    return { success: false, error: errMsg };
  } catch (err) {
    return { success: false, error: err.message || 'Network error reaching email API.' };
  }
}

/**
 * 1. Dispatch Report Flagged Notification Email
 */
export async function sendReportFlaggedEmail({ clubName, month, recipientEmail, flagComment }) {
  return await callEmailApi('flagged', { clubName, month, recipientEmail, flagComment });
}

/**
 * 2. Dispatch District Announcement Email Broadcast
 */
export async function sendAnnouncementBroadcastEmail({ title, category, author, content, recipients, audienceLabel = 'All Members & Officers' }) {
  return await callEmailApi('announcement', { title, category, author, content, recipients, audienceLabel });
}

/**
 * 3. Dispatch Reporting Reminder Notice
 */
export async function sendReportingReminderEmail({ clubName, month, recipientEmail }) {
  return await callEmailApi('reminder', { clubName, month, recipientEmail });
}

/**
 * 4. Request Password Reset — Serverless-only (reset code never touches the browser)
 * The serverless function calls the Supabase RPC, generates the code, sends the email,
 * and returns only a masked email address to the client.
 */
export async function requestSecurePasswordReset(identity) {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'request_password_reset', payload: { identity } })
    });

    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data.success) {
        return { success: true, maskedEmail: data.maskedEmail };
      }
      return { success: false, error: data.error || 'Failed to request reset passcode.' };
    }

    // Dev-only fallback: direct DB lookup + mask (no reset code is ever returned to client)
    console.warn('[EmailService] Serverless endpoint unavailable — activating dev fallback for password reset...');
    const dbRes = await dbService.requestPasswordReset(identity);
    if (!dbRes.success) {
      return { success: false, error: dbRes.error || 'No registered officer found with that Rotary ID or Email.' };
    }

    // In dev fallback, we cannot send the email without the key — just mask and return notice
    const maskedEmail = (dbRes.email || '').replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => `${a}${'*'.repeat(Math.max(b.length, 3))}${c}`);
    return {
      success: false,
      error: `Dev mode: Serverless API unavailable. Reset code was generated but email could not be sent. Please use the production deployment for password resets. (Account exists: ${maskedEmail})`
    };

  } catch (err) {
    console.warn('[EmailService] requestSecurePasswordReset error:', err);
    return { success: false, error: err.message };
  }
}
