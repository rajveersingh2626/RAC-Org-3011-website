/**
 * District 3011 Automated Email Service
 * Proxies calls through Vercel Serverless Function `/api/send-email`
 * Domain: rotaract3011.org (portal@rotaract3011.org)
 */

async function callEmailApi(type, payload) {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ type, payload })
    });

    const data = await res.json();
    if (!res.ok) {
      console.warn('[EmailService] Serverless dispatch notice:', data);
      return { 
        success: false, 
        error: data.error || 'Failed to dispatch email via District serverless API.',
        fallbackMailto: true
      };
    }

    return { success: true, data };
  } catch (err) {
    console.warn('[EmailService] API network notice:', err);
    return { success: false, error: err.message, fallbackMailto: true };
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
