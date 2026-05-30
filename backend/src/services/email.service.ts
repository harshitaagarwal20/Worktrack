import nodemailer from 'nodemailer';

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function isEmailConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

async function sendMail(to: string, subject: string, html: string) {
  if (!isEmailConfigured()) return;
  try {
    await getTransporter().sendMail({
      from: `"WorkTrack" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error('Email send failed:', err);
  }
}

export async function sendLeaveStatusEmail(
  to: string,
  name: string,
  status: 'APPROVED' | 'REJECTED',
  fromDate: string,
  toDate: string,
) {
  const color = status === 'APPROVED' ? '#16a34a' : '#dc2626';
  const label = status === 'APPROVED' ? 'Approved' : 'Rejected';
  await sendMail(
    to,
    `Leave Request ${label} — WorkTrack`,
    `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
      <h2 style="margin:0 0 8px;color:#111827">Leave Request ${label}</h2>
      <p style="color:#6b7280;margin:0 0 20px">Hi ${name},</p>
      <p style="color:#374151;margin:0 0 16px">Your leave request for <strong>${fromDate}</strong> to <strong>${toDate}</strong> has been
        <span style="font-weight:700;color:${color}">${label}</span>.
      </p>
      <p style="color:#6b7280;font-size:13px;margin:0">— WorkTrack HR System</p>
    </div>`,
  );
}

export async function sendTravelStatusEmail(
  to: string,
  name: string,
  status: 'APPROVED' | 'REJECTED',
  travelDate: string,
  amount: number,
  remark?: string | null,
) {
  const color = status === 'APPROVED' ? '#16a34a' : '#dc2626';
  const label = status === 'APPROVED' ? 'Approved' : 'Rejected';
  await sendMail(
    to,
    `Travel Reimbursement ${label} — WorkTrack`,
    `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
      <h2 style="margin:0 0 8px;color:#111827">Travel Reimbursement ${label}</h2>
      <p style="color:#6b7280;margin:0 0 20px">Hi ${name},</p>
      <p style="color:#374151;margin:0 0 16px">Your travel reimbursement of <strong>₹${amount}</strong> for <strong>${travelDate}</strong> has been
        <span style="font-weight:700;color:${color}">${label}</span>.
      </p>
      ${remark ? `<p style="color:#374151;margin:0 0 16px"><strong>Remark:</strong> ${remark}</p>` : ''}
      <p style="color:#6b7280;font-size:13px;margin:0">— WorkTrack HR System</p>
    </div>`,
  );
}

export async function sendOutstationStatusEmail(
  to: string,
  name: string,
  status: 'APPROVED' | 'REJECTED',
  fromDate: string,
  toDate: string,
  destination: string,
  totalAmount: number,
  remark?: string | null,
) {
  const color = status === 'APPROVED' ? '#16a34a' : '#dc2626';
  const label = status === 'APPROVED' ? 'Approved' : 'Rejected';
  await sendMail(
    to,
    `Outstation Claim ${label} — WorkTrack`,
    `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
      <h2 style="margin:0 0 8px;color:#111827">Outstation Claim ${label}</h2>
      <p style="color:#6b7280;margin:0 0 20px">Hi ${name},</p>
      <p style="color:#374151;margin:0 0 16px">Your outstation claim for <strong>${destination}</strong> (${fromDate} – ${toDate}), amount <strong>₹${totalAmount}</strong>, has been
        <span style="font-weight:700;color:${color}">${label}</span>.
      </p>
      ${remark ? `<p style="color:#374151;margin:0 0 16px"><strong>Remark:</strong> ${remark}</p>` : ''}
      <p style="color:#6b7280;font-size:13px;margin:0">— WorkTrack HR System</p>
    </div>`,
  );
}
