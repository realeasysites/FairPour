'use strict';
const nodemailer = require('nodemailer');

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  const port = Number(SMTP_PORT) || 465;
  transporter = nodemailer.createTransport({ host: SMTP_HOST, port, secure: port === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } });
  return transporter;
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function notifyInquiry(inq) {
  const t = getTransporter();
  const to = process.env.NOTIFY_EMAIL;
  if (!t || !to) {
    console.log('[mailer] SMTP or NOTIFY_EMAIL not set; inquiry saved to dashboard only.');
    return;
  }
  const rows = [
    ['Name', inq.name], ['Email', inq.email], ['Phone', inq.phone], ['Location', inq.location],
    ['Topic', inq.topic], ['Date', inq.event_date], ['Headcount', inq.headcount], ['Message', inq.message],
  ].filter(([, v]) => v);
  const html = `<h2 style="font-family:Georgia,serif;color:#2a1d17">New FairPour inquiry</h2>
    <table cellpadding="6" style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">
    ${rows.map(([k, v]) => `<tr><td style="color:#7a2431;font-weight:bold;vertical-align:top">${k}</td><td>${esc(v).replace(/\n/g, '<br>')}</td></tr>`).join('')}
    </table><p style="font-family:Arial,sans-serif;font-size:12px;color:#888">Manage all inquiries at /admin</p>`;
  await t.sendMail({
    from: `"FairPour Website" <${process.env.SMTP_USER}>`,
    to,
    replyTo: inq.email,
    subject: `New inquiry: ${inq.topic || 'General'} from ${inq.name}`,
    text: rows.map(([k, v]) => `${k}: ${v}`).join('\n'),
    html,
  });
}

module.exports = { notifyInquiry };
