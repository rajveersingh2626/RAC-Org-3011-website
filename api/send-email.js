/**
 * Vercel Serverless Function: /api/send-email
 * District 3011 Secure Email Proxy (Powered by Resend)
 *
 * This runs on the server — the RESEND_API_KEY never reaches the browser.
 * Client calls POST /api/send-email with { type, payload }
 */

const FROM_ADDRESS = 'District 3011 Portal <portal@rotaract3011.org>';
const RESEND_API = 'https://api.resend.com/emails';

async function sendViaResend({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'RESEND_API_KEY environment variable not set on server.' };
  }

  const recipients = Array.isArray(to) ? to : [to];

  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: recipients,
        subject,
        html,
        text
      })
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[send-email] Resend API error:', data);
      return { success: false, error: data.message || 'Resend API error.' };
    }

    return { success: true, data };
  } catch (err) {
    console.error('[send-email] Network error:', err);
    return { success: false, error: err.message };
  }
}

// ─── Email HTML builders ──────────────────────────────────────────────────────

function buildFlaggedEmail({ clubName, month, flagComment }) {
  const subject = `[Action Required] District 3011 Monthly Report Flagged — ${month}`;
  const html = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #eee;">
      <div style="background:#D81B60;padding:24px;text-align:center;color:#fff;">
        <h1 style="margin:0;font-size:20px;font-weight:800;">ROTARACT DISTRICT 3011</h1>
        <p style="margin:4px 0 0;font-size:13px;opacity:.9;">Monthly Project Reporting Studio Alert</p>
      </div>
      <div style="padding:28px;color:#333;">
        <h2 style="color:#D81B60;font-size:18px;margin-top:0;">Action Required — ${clubName}</h2>
        <p style="font-size:15px;line-height:1.6;">Dear Club Officers,</p>
        <p style="font-size:15px;line-height:1.6;">
          Your Monthly Project Report for <strong>${month}</strong> has been reviewed by the District Secretariat and marked as
          <strong>FLAGGED / REVISION REQUIRED</strong>.
        </p>
        <div style="background:#FFF5F7;border-left:4px solid #D81B60;padding:16px;margin:20px 0;border-radius:4px;">
          <h4 style="margin:0 0 6px;color:#D81B60;font-size:13px;text-transform:uppercase;">District Officer Feedback:</h4>
          <p style="margin:0;font-size:14px;color:#444;font-style:italic;">"${flagComment}"</p>
        </div>
        <p style="font-size:14px;line-height:1.6;">
          Please log into the <strong>District 3011 Portal</strong> at
          <a href="https://rotaract3011.org/portal" style="color:#D81B60;">rotaract3011.org/portal</a>,
          update your report, and re-submit.
        </p>
      </div>
      <div style="background:#f9f9f9;padding:16px;text-align:center;font-size:12px;color:#777;border-top:1px solid #eee;">
        Rotaract District Organization 3011 • Tech &amp; Secretariat Cell
      </div>
    </div>`;
  const text = `Rotaract District 3011 Alert\n\nDear Officers of ${clubName},\nYour Monthly Project Report for ${month} has been flagged:\n"${flagComment}"\n\nPlease log into the District Portal to revise: https://rotaract3011.org/portal`;
  return { subject, html, text };
}

function buildAnnouncementEmail({ title, category, author, content, audienceLabel }) {
  const subject = `[District Announcement] ${title}`;
  const html = `
    <!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:620px;margin:20px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.08);border:1px solid #e5e7eb;">
        <tr>
          <td style="background:linear-gradient(135deg,#D81B60 0%,#AD1457 100%);padding:32px 28px;text-align:center;color:#fff;">
            <div style="font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#FCE4EC;margin-bottom:6px;">Rotary International District 3011</div>
            <h1 style="margin:0;font-size:22px;font-weight:900;">ROTARACT DISTRICT 3011</h1>
            <div style="margin-top:8px;display:inline-block;background:rgba(255,255,255,.18);padding:4px 14px;border-radius:100px;font-size:12px;font-weight:700;">
              Official Secretariat Broadcast • ${audienceLabel}
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 28px;">
            <div style="margin-bottom:16px;">
              <span style="background:#FFE4EC;color:#D81B60;padding:5px 12px;border-radius:100px;font-size:12px;font-weight:800;display:inline-block;">${category}</span>
              <span style="background:#E0F2FE;color:#0284C7;padding:5px 12px;border-radius:100px;font-size:12px;font-weight:800;display:inline-block;margin-left:6px;">Audience: ${audienceLabel}</span>
            </div>
            <h2 style="color:#111827;font-size:22px;font-weight:800;margin:0 0 12px;line-height:1.3;">${title}</h2>
            <div style="font-size:13px;color:#6B7280;padding-bottom:16px;margin-bottom:20px;border-bottom:1px solid #F3F4F6;font-weight:600;">
              Issued by <strong style="color:#D81B60;">${author}</strong> • District Secretariat 3011
            </div>
            <div style="font-size:15px;line-height:1.75;color:#374151;background:#FAFAFA;padding:22px;border-radius:12px;border-left:4px solid #D81B60;white-space:pre-wrap;margin-bottom:28px;">${content}</div>
            <div style="text-align:center;margin:30px 0 10px;">
              <a href="https://rotaract3011.org" target="_blank" style="background:#D81B60;color:#fff;padding:14px 28px;border-radius:100px;font-size:14px;font-weight:800;text-decoration:none;display:inline-block;box-shadow:0 4px 14px rgba(216,27,96,.35);">
                Access Rotaract District Portal &rarr;
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#F9FAFB;padding:20px 28px;text-align:center;font-size:12px;color:#9CA3AF;border-top:1px solid #F3F4F6;">
            <p style="margin:0 0 6px;font-weight:700;color:#6B7280;">Rotaract District Organization 3011</p>
            <p style="margin:0;">This official email broadcast was dispatched via District 3011 Communications Portal.</p>
          </td>
        </tr>
      </table>
    </body></html>`;
  const text = `${title}\n\n${content}\n\nIssued by ${author} • District Secretariat 3011\nhttps://rotaract3011.org`;
  return { subject, html, text };
}

function buildReminderEmail({ clubName, month }) {
  const subject = `[Reminder] Monthly Project Report Pending for ${month}`;
  const html = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #eee;">
      <div style="background:#D81B60;padding:24px;text-align:center;color:#fff;">
        <h1 style="margin:0;font-size:20px;font-weight:800;">ROTARACT DISTRICT 3011</h1>
        <p style="margin:4px 0 0;font-size:13px;opacity:.9;">Secretariat Compliance Notice</p>
      </div>
      <div style="padding:28px;color:#333;">
        <h2 style="color:#D81B60;font-size:18px;margin-top:0;">Reporting Notice for ${clubName}</h2>
        <p style="font-size:15px;line-height:1.6;">Dear President &amp; Secretary,</p>
        <p style="font-size:15px;line-height:1.6;">
          This is an official reminder that your club's Monthly Project Report for <strong>${month}</strong> is
          currently pending submission.
        </p>
        <p style="font-size:14px;line-height:1.6;">
          Please submit before the deadline at
          <a href="https://rotaract3011.org/portal" style="color:#D81B60;">rotaract3011.org/portal</a>.
        </p>
      </div>
      <div style="background:#f9f9f9;padding:16px;text-align:center;font-size:12px;color:#777;border-top:1px solid #eee;">
        Rotaract District Organization 3011 Secretariat
      </div>
    </div>`;
  const text = `Reporting Reminder for ${clubName}\nYour Monthly Project Report for ${month} is pending. Please submit: https://rotaract3011.org/portal`;
function buildPasswordResetEmail({ name, rotaryId, resetCode }) {
  const subject = `[District 3011 Security] Password Reset Passcode`;
  const html = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #eee;">
      <div style="background:#D81B60;padding:24px;text-align:center;color:#fff;">
        <h1 style="margin:0;font-size:20px;font-weight:800;">ROTARACT DISTRICT 3011</h1>
        <p style="margin:4px 0 0;font-size:13px;opacity:.9;">District Portal Security Notice</p>
      </div>
      <div style="padding:28px;color:#333;">
        <h2 style="color:#D81B60;font-size:18px;margin-top:0;">Password Reset Request</h2>
        <p style="font-size:15px;line-height:1.6;">Hello ${name || 'Officer'},</p>
        <p style="font-size:15px;line-height:1.6;">
          We received a request to reset the password for your District 3011 Portal account${rotaryId ? ` (Rotary ID: <strong>${rotaryId}</strong>)` : ''}.
        </p>
        <div style="background:#FFF5F7;border:1.5px solid #FECDD3;padding:20px;margin:20px 0;border-radius:12px;text-align:center;">
          <p style="margin:0 0 8px;color:#881337;font-size:13px;font-weight:700;text-transform:uppercase;">Your 6-Digit Password Reset Passcode:</p>
          <div style="font-size:32px;font-weight:900;letter-spacing:8px;color:#D81B60;font-family:monospace;">${resetCode}</div>
          <p style="margin:8px 0 0;font-size:12px;color:#9F1239;">Valid for 15 minutes • Do not share this code with anyone</p>
        </div>
        <p style="font-size:14px;line-height:1.6;">
          Return to the District Portal, enter this 6-digit code, and choose your new password.
        </p>
        <p style="font-size:13px;line-height:1.6;color:#6B7280;">
          If you did not request this password reset, you can safely ignore this email. Your password will remain unchanged.
        </p>
      </div>
      <div style="background:#f9f9f9;padding:16px;text-align:center;font-size:12px;color:#777;border-top:1px solid #eee;">
        Rotaract District Organization 3011 • Tech &amp; Security Cell
      </div>
    </div>`;
  const text = `Rotaract District 3011 Password Reset\n\nYour 6-Digit Password Reset Passcode: ${resetCode}\nValid for 15 minutes.\n\nEnter this passcode in the portal to choose your new password.`;
  return { subject, html, text };
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://rotaract3011.org');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const { type, payload } = req.body || {};

  if (!type || !payload) {
    return res.status(400).json({ success: false, error: 'Missing type or payload.' });
  }

  let emailContent;
  let recipients;

  try {
    switch (type) {
      case 'flagged': {
        const { clubName, month, recipientEmail, flagComment } = payload;
        if (!clubName || !month || !flagComment) {
          return res.status(400).json({ success: false, error: 'Missing required fields for flagged email.' });
        }
        emailContent = buildFlaggedEmail({ clubName, month, flagComment });
        recipients = [recipientEmail || 'techrid3011@gmail.com'];
        break;
      }

      case 'announcement': {
        const { title, category, author, content, recipients: r, audienceLabel } = payload;
        if (!title || !content) {
          return res.status(400).json({ success: false, error: 'Missing required fields for announcement email.' });
        }
        emailContent = buildAnnouncementEmail({ title, category, author, content, audienceLabel });
        recipients = r && r.length > 0 ? r : ['techrid3011@gmail.com'];
        break;
      }

      case 'reminder': {
        const { clubName, month, recipientEmail } = payload;
        if (!clubName || !month) {
          return res.status(400).json({ success: false, error: 'Missing required fields for reminder email.' });
        }
        emailContent = buildReminderEmail({ clubName, month });
        recipients = [recipientEmail || 'techrid3011@gmail.com'];
        break;
      }

      case 'password_reset': {
        const { name, rotaryId, recipientEmail, resetCode } = payload;
        if (!recipientEmail || !resetCode) {
          return res.status(400).json({ success: false, error: 'Missing recipientEmail or resetCode for password reset.' });
        }
        emailContent = buildPasswordResetEmail({ name, rotaryId, resetCode });
        recipients = [recipientEmail];
        break;
      }

      default:
        return res.status(400).json({ success: false, error: `Unknown email type: ${type}` });
    }

    const result = await sendViaResend({
      to: recipients,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    });

    return res.status(result.success ? 200 : 500).json(result);

  } catch (err) {
    console.error('[send-email] Handler error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
