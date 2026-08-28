import { dbService } from './supabaseClient';

const DIRECT_RESEND_KEY = import.meta.env.VITE_RESEND_API_KEY || '';

async function directResendFallback(type, payload) {
  if (!DIRECT_RESEND_KEY) {
    return { success: false, error: 'Resend API Key is missing in environment variables.' };
  }

  let subject = '';
  let html = '';
  let text = '';
  let to = [];

  if (type === 'password_reset') {
    subject = `[District 3011 Security] Password Reset Passcode`;
    html = `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #eee;">
        <div style="background:#D81B60;padding:24px;text-align:center;color:#fff;">
          <h1 style="margin:0;font-size:20px;font-weight:800;">ROTARACT DISTRICT 3011</h1>
          <p style="margin:4px 0 0;font-size:13px;opacity:.9;">District Portal Security Notice</p>
        </div>
        <div style="padding:28px;color:#333;">
          <h2 style="color:#D81B60;font-size:18px;margin-top:0;">Password Reset Request</h2>
          <p style="font-size:15px;line-height:1.6;">Hello ${payload.name || 'Officer'},</p>
          <p style="font-size:15px;line-height:1.6;">
            We received a request to reset the password for your District 3011 Portal account${payload.rotaryId ? ` (Rotary ID: <strong>${payload.rotaryId}</strong>)` : ''}.
          </p>
          <div style="background:#FFF5F7;border:1.5px solid #FECDD3;padding:20px;margin:20px 0;border-radius:12px;text-align:center;">
            <p style="margin:0 0 8px;color:#881337;font-size:13px;font-weight:700;text-transform:uppercase;">Your 6-Digit Password Reset Passcode:</p>
            <div style="font-size:32px;font-weight:900;letter-spacing:8px;color:#D81B60;font-family:monospace;">${payload.resetCode}</div>
            <p style="margin:8px 0 0;font-size:12px;color:#9F1239;">Valid for 15 minutes • Do not share this code with anyone</p>
          </div>
          <p style="font-size:14px;line-height:1.6;">
            Return to the District Portal, enter this 6-digit code, and choose your new password.
          </p>
          <p style="font-size:13px;line-height:1.6;color:#6B7280;">
            If you did not request this password reset, you can safely ignore this email.
          </p>
        </div>
        <div style="background:#f9f9f9;padding:16px;text-align:center;font-size:12px;color:#777;border-top:1px solid #eee;">
          Rotaract District Organization 3011 • Tech &amp; Security Cell
        </div>
      </div>`;
    text = `Your District 3011 Password Reset Passcode: ${payload.resetCode}\nValid for 15 minutes.`;
    to = [payload.recipientEmail];
  } else if (type === 'flagged') {
    subject = `[Action Required] District 3011 Monthly Report Flagged — ${payload.month}`;
    html = `<p>Dear ${payload.clubName}, your monthly report has been flagged with comment: "${payload.flagComment}"</p>`;
    text = `Report Flagged: ${payload.flagComment}`;
    to = [payload.recipientEmail];
  } else if (type === 'reminder') {
    subject = `[Reminder] Monthly Project Report Pending for ${payload.month}`;
    html = `<p>Dear ${payload.clubName}, this is a reminder to submit your monthly report for ${payload.month}.</p>`;
    text = `Reminder: Monthly report pending for ${payload.month}`;
    to = [payload.recipientEmail];
  } else if (type === 'announcement') {
    subject = `[District Announcement] ${payload.title}`;
    html = `<p>${payload.content}</p>`;
    text = payload.content;
    to = payload.recipients || ['techrid3011@gmail.com'];
  }

  try {
    let res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DIRECT_RESEND_KEY}`
      },
      body: JSON.stringify({
        from: 'District 3011 Portal <portal@rotaract3011.org>',
        to,
        subject,
        html,
        text
      })
    });

    let data = await res.json();
    if (!res.ok) {
      // Retry with onboarding@resend.dev
      const retryRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DIRECT_RESEND_KEY}`
        },
        body: JSON.stringify({
          from: 'District 3011 Portal <onboarding@resend.dev>',
          to,
          subject,
          html,
          text
        })
      });
      data = await retryRes.json();
      if (!retryRes.ok) {
        return { success: false, error: data.message || 'Direct Resend dispatch failed.' };
      }
    }
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function callEmailApi(type, payload) {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ type, payload })
    });

    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data.success) {
        return { success: true, data };
      }
    }

    // Fallback if serverless API is running in local dev or returned non-JSON
    console.warn('[EmailService] Serverless endpoint unreachable or returned error, using fallback dispatcher...');
    return await directResendFallback(type, payload);
  } catch (err) {
    console.warn('[EmailService] API network notice, using direct fallback...', err);
    return await directResendFallback(type, payload);
  }
}

/**
 * 1. Dispatch Report Flagged Notification Email
 */
export async function sendReportFlaggedEmail({ clubName, month, recipientEmail, flagComment }) {
  return await callEmailApi('flagged', {
    clubName,
    month,
    recipientEmail,
    flagComment
  });
}

/**
 * 2. Dispatch District Announcement Email Broadcast
 */
export async function sendAnnouncementBroadcastEmail({ title, category, author, content, recipients, audienceLabel = 'All Members & Officers' }) {
  return await callEmailApi('announcement', {
    title,
    category,
    author,
    content,
    recipients,
    audienceLabel
  });
}

/**
 * 3. Dispatch Reporting Reminder Notice
 */
export async function sendReportingReminderEmail({ clubName, month, recipientEmail }) {
  return await callEmailApi('reminder', {
    clubName,
    month,
    recipientEmail
  });
}

/**
 * 4. Dispatch Password Reset Passcode Email (Secure Server-Side Flow)
 */
export async function requestSecurePasswordReset(identity) {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'request_password_reset',
        payload: { identity }
      })
    });

    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data.success) {
        return { success: true, maskedEmail: data.maskedEmail };
      }
      return { success: false, error: data.error || 'Failed to request reset passcode.' };
    }

    // Fallback if serverless API is unavailable (e.g., local dev)
    console.warn('[EmailService] Falling back to direct database + email dispatcher for password reset...');
    const dbRes = await dbService.requestPasswordReset(identity);

    if (!dbRes.success) {
      return { success: false, error: dbRes.error || 'No registered officer found with that Rotary ID or Email.' };
    }

    const directEmailRes = await directResendFallback('password_reset', {
      name: dbRes.fullName,
      rotaryId: dbRes.rotaryId,
      recipientEmail: dbRes.email,
      resetCode: dbRes.resetCode
    });

    if (!directEmailRes.success) {
      return { success: false, error: directEmailRes.error || 'Failed to dispatch email.' };
    }

    const maskedEmail = dbRes.email.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => `${a}${'*'.repeat(Math.max(b.length, 3))}${c}`);
    return { success: true, maskedEmail };

  } catch (err) {
    console.warn('[EmailService] requestSecurePasswordReset error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * 5. Direct Dispatch Password Reset Passcode Email
 */
export async function sendPasswordResetEmail({ name, rotaryId, recipientEmail, resetCode }) {
  return await callEmailApi('password_reset', {
    name,
    rotaryId,
    recipientEmail,
    resetCode
  });
}
