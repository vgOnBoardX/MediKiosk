import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_key');
const FROM_EMAIL = 'MediKiosk <onboarding@resend.dev>';

export const sendOTP = async (email, otp) => {
  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: 'MediKiosk Login OTP',
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #1e293b; margin-bottom: 8px;">Sanjeevani AI-OS</h2>
          <p style="color: #64748b;">Your one-time verification code:</p>
          <div style="background: #f1f5f9; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">${otp}</span>
          </div>
          <p style="color: #94a3b8; font-size: 13px;">This code expires in 10 minutes. Do not share it with anyone.</p>
        </div>
      `,
    });
    console.log('[Email] OTP sent successfully:', data?.id);
    return data;
  } catch (error) {
    console.error('[Email] Error sending OTP:', error);
    // Don't throw — the queue will retry. Just log.
  }
};

export const sendTriageSummary = async ({ patientName, department, severity, encounterId, socratesData }) => {
  try {
    const socratesHtml = Object.entries(socratesData || {})
      .filter(([, v]) => v)
      .map(([key, val]) => `<li><strong>${key}:</strong> ${val}</li>`)
      .join('');

    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: ['triage-desk@sanjeevani.local'], // In production: fetch doctor's actual email
      subject: `[${severity}] New Triage: ${patientName} → ${department}`,
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #1e293b;">New Triage Alert</h2>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px; color: #64748b;">Patient</td><td style="padding: 8px; font-weight: bold;">${patientName}</td></tr>
            <tr><td style="padding: 8px; color: #64748b;">Department</td><td style="padding: 8px; font-weight: bold;">${department}</td></tr>
            <tr><td style="padding: 8px; color: #64748b;">Priority</td><td style="padding: 8px; font-weight: bold; color: ${severity === 'EMERGENCY' ? '#dc2626' : severity === 'URGENT' ? '#f59e0b' : '#16a34a'};">${severity}</td></tr>
            <tr><td style="padding: 8px; color: #64748b;">Encounter ID</td><td style="padding: 8px; font-family: monospace; font-size: 12px;">${encounterId}</td></tr>
          </table>
          ${socratesHtml ? `<h3 style="color: #334155;">SOCRATES Assessment</h3><ul style="color: #475569;">${socratesHtml}</ul>` : ''}
          <p style="color: #94a3b8; font-size: 13px; margin-top: 24px;">— Sanjeevani AI-OS Automated Notification</p>
        </div>
      `,
    });
    console.log('[Email] Triage summary sent:', data?.id);
    return data;
  } catch (error) {
    console.error('[Email] Error sending triage summary:', error);
  }
};
