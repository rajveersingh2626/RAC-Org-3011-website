/**
 * District 3011 Automated Email Service (Powered by Resend API)
 */

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || '';

/**
 * Core HTTP Dispatcher to Resend API
 */
async function sendResendEmail({ to, subject, html, text }) {
  if (!RESEND_API_KEY || RESEND_API_KEY.includes('YOUR_RESEND_API_KEY')) {
    console.warn('[EmailService] Resend API Key is missing in .env.local. Set VITE_RESEND_API_KEY to activate live email sending.');
    return {
      success: false,
      notice: 'Resend API Key missing. Please add VITE_RESEND_API_KEY to your .env.local file.',
      fallbackMailto: true
    };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'District 3011 Portal <onboarding@resend.dev>',
        to: Array.isArray(to) ? to : [to],
        subject: subject,
        html: html,
        text: text
      })
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('[EmailService] Resend API error:', data);
      return { success: false, error: data.message || 'Failed to dispatch email via Resend API.' };
    }

    return { success: true, data };
  } catch (err) {
    console.error('[EmailService] Dispatch network exception:', err);
    return { success: false, error: err.message };
  }
}

/**
 * 1. Dispatch Report Flagged Notification Email
 */
export async function sendReportFlaggedEmail({ clubName, month, recipientEmail, flagComment }) {
  const subject = `[Action Required] District 3011 Monthly Report Flagged - ${month}`;

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #eee;">
      <div style="background: #D81B60; padding: 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 20px; font-weight: 800;">ROTARACT DISTRICT 3011</h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Monthly Project Reporting Studio Alert</p>
      </div>
      <div style="padding: 28px; color: #333333;">
        <h2 style="color: #D81B60; font-size: 18px; margin-top: 0;">Action Required for ${clubName}</h2>
        <p style="font-size: 15px; line-height: 1.6;">
          Dear Club Officers,
        </p>
        <p style="font-size: 15px; line-height: 1.6;">
          Your Monthly Project Report for <strong>${month}</strong> has been inspected by the District Secretariat and marked as <strong>FLAGGED / REVISION REQUIRED</strong>.
        </p>
        
        <div style="background: #FFF5F7; border-left: 4px solid #D81B60; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <h4 style="margin: 0 0 6px 0; color: #D81B60; font-size: 13px; text-transform: uppercase;">District Officer Feedback Comment:</h4>
          <p style="margin: 0; font-size: 14px; color: #444444; font-style: italic;">"${flagComment}"</p>
        </div>

        <p style="font-size: 14px; line-height: 1.6;">
          Please log into the <strong>District 3011 Portal</strong>, update your report entries accordingly, and re-submit for approval.
        </p>
      </div>
      <div style="background: #f9f9f9; padding: 16px; text-align: center; font-size: 12px; color: #777777; border-top: 1px solid #eee;">
        Rotaract District Organization 3011 • Tech & Secretariat Cell
      </div>
    </div>
  `;

  const text = `Rotaract District 3011 Alert\n\nDear Officers of ${clubName},\nYour Monthly Project Report for ${month} has been flagged with the following comment:\n"${flagComment}"\n\nPlease log into the District Portal to revise your submission.`;

  return await sendResendEmail({
    to: [recipientEmail || 'techrid3011@gmail.com'],
    subject,
    html,
    text
  });
}

/**
 * 2. Dispatch District Announcement Email Broadcast
 */
export async function sendAnnouncementBroadcastEmail({ title, category, author, content, recipients, audienceLabel = 'All Members & Officers' }) {
  const subject = `[District Announcement] ${title}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 620px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #e5e7eb;">
        <!-- Header Banner -->
        <tr>
          <td style="background: linear-gradient(135deg, #D81B60 0%, #AD1457 100%); padding: 32px 28px; text-align: center; color: #ffffff;">
            <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #FCE4EC; margin-bottom: 6px;">Rotary International District 3011</div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px;">ROTARACT DISTRICT 3011</h1>
            <div style="margin-top: 8px; display: inline-block; background: rgba(255,255,255,0.18); padding: 4px 14px; border-radius: 100px; font-size: 12px; font-weight: 700;">
              Official Secretariat Broadcast • ${audienceLabel}
            </div>
          </td>
        </tr>

        <!-- Main Body -->
        <tr>
          <td style="padding: 32px 28px;">
            <!-- Badges -->
            <div style="margin-bottom: 16px;">
              <span style="background-color: #FFE4EC; color: #D81B60; padding: 5px 12px; border-radius: 100px; font-size: 12px; font-weight: 800; display: inline-block;">${category}</span>
              <span style="background-color: #E0F2FE; color: #0284C7; padding: 5px 12px; border-radius: 100px; font-size: 12px; font-weight: 800; display: inline-block; margin-left: 6px;">Audience: ${audienceLabel}</span>
            </div>

            <!-- Title -->
            <h2 style="color: #111827; font-size: 22px; font-weight: 800; margin: 0 0 12px 0; line-height: 1.3;">${title}</h2>

            <!-- Author & Metadata -->
            <div style="font-size: 13px; color: #6B7280; padding-bottom: 16px; margin-bottom: 20px; border-bottom: 1px solid #F3F4F6; font-weight: 600;">
              Issued by <strong style="color: #D81B60;">${author}</strong> • District Secretariat 3011
            </div>

            <!-- Announcement Content Body -->
            <div style="font-size: 15px; line-height: 1.75; color: #374151; background-color: #FAFAFA; padding: 22px; border-radius: 12px; border-left: 4px solid #D81B60; white-space: pre-wrap; margin-bottom: 28px;">${content}</div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0 10px 0;">
              <a href="https://rotaract3011.org" target="_blank" style="background-color: #D81B60; color: #ffffff; padding: 14px 28px; border-radius: 100px; font-size: 14px; font-weight: 800; text-decoration: none; display: inline-block; box-shadow: 0 4px 14px rgba(216,27,96,0.35);">
                Access Rotaract District Portal &rarr;
              </a>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color: #F9FAFB; padding: 20px 28px; text-align: center; font-size: 12px; color: #9CA3AF; border-top: 1px solid #F3F4F6;">
            <p style="margin: 0 0 6px 0; font-weight: 700; color: #6B7280;">Rotaract District Organization 3011</p>
            <p style="margin: 0;">This official email broadcast was dispatched via District 3011 Communications Portal.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const targetList = recipients && recipients.length > 0 ? recipients : ['techrid3011@gmail.com'];

  // Attempt batch dispatch first
  const batchRes = await sendResendEmail({
    to: targetList,
    subject,
    html,
    text: `${title}\n\n${content}\n\nIssued by ${author} • District Secretariat 3011`
  });

  if (batchRes.success) {
    return batchRes;
  }

  // If batch dispatch failed (e.g. due to onboarding@resend.dev single-recipient restriction or multi-to restriction),
  // attempt individual dispatches to each recipient so valid addresses still receive the email!
  console.warn('[EmailService] Batch dispatch failed. Attempting individual recipient dispatches...', batchRes.error);

  let successCount = 0;
  let lastError = batchRes.error;

  for (const recipient of targetList) {
    const singleRes = await sendResendEmail({
      to: [recipient],
      subject,
      html,
      text: `${title}\n\n${content}\n\nIssued by ${author} • District Secretariat 3011`
    });
    if (singleRes.success) {
      successCount++;
    } else {
      lastError = singleRes.error;
    }
  }

  if (successCount > 0) {
    return {
      success: true,
      partial: successCount < targetList.length,
      notice: `Sent email to ${successCount} of ${targetList.length} recipients. (${lastError ? 'Resend notice: ' + lastError : ''})`
    };
  }

  return {
    success: false,
    error: lastError || 'Failed to send broadcast email.'
  };
}

/**
 * 3. Dispatch Reporting Reminder Notice
 */
export async function sendReportingReminderEmail({ clubName, month, recipientEmail }) {
  const subject = `[Reminder Notice] Monthly Project Report Pending for ${month}`;

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #eee;">
      <div style="background: #D81B60; padding: 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 20px; font-weight: 800;">ROTARACT DISTRICT 3011</h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Secretariat Compliance Notice</p>
      </div>
      <div style="padding: 28px; color: #333333;">
        <h2 style="color: #D81B60; font-size: 18px; margin-top: 0;">Reporting Notice for ${clubName}</h2>
        <p style="font-size: 15px; line-height: 1.6;">
          Dear President & Secretary,
        </p>
        <p style="font-size: 15px; line-height: 1.6;">
          This is an official reminder from the District Secretariat that your club's Monthly Project Report for <strong>${month}</strong> is currently pending submission.
        </p>
        <p style="font-size: 14px; line-height: 1.6;">
          Please ensure your report is logged in the District Portal before the upcoming deadline to avoid compliance flags.
        </p>
      </div>
      <div style="background: #f9f9f9; padding: 16px; text-align: center; font-size: 12px; color: #777777; border-top: 1px solid #eee;">
        Rotaract District Organization 3011 Secretariat
      </div>
    </div>
  `;

  return await sendResendEmail({
    to: [recipientEmail || 'techrid3011@gmail.com'],
    subject,
    html,
    text: `Reporting Reminder Notice for ${clubName}\nYour Monthly Project Report for ${month} is pending. Please log into the portal to submit.`
  });
}
