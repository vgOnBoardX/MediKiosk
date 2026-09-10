import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import { sendOTP, sendTriageSummary } from './email.js';

dotenv.config();

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null
});

export const notificationQueue = new Queue('notificationQueue', { connection });

// Worker processes jobs from the queue
export const notificationWorker = new Worker('notificationQueue', async job => {
  console.log(`[Queue] Processing job: ${job.name} (${job.id})`);

  if (job.name === 'send_otp') {
    const { email, otp } = job.data;
    console.log(`[Queue] Sending OTP to ${email}`);
    await sendOTP(email, otp);

  } else if (job.name === 'triage_summary') {
    const { patientName, department, severity, encounterId, socratesData } = job.data;
    console.log(`[Queue] Sending triage summary for ${patientName} → ${department}`);
    await sendTriageSummary({ patientName, department, severity, encounterId, socratesData });

  } else if (job.name === 'triage_alert') {
    console.log(`[Queue] Processing triage alert for patient ${job.data.patientId}`);
  }
}, { connection });

notificationWorker.on('completed', job => {
  console.log(`[Queue] ✅ Job ${job.id} (${job.name}) completed`);
});

notificationWorker.on('failed', (job, err) => {
  console.error(`[Queue] ❌ Job ${job.id} (${job.name}) failed: ${err.message}`);
});
