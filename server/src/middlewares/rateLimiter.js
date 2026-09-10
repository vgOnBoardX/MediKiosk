import rateLimit from 'express-rate-limit';

// Helper: skip rate limiting on localhost (dev environment)
const skipLocalhost = (req) => {
  const ip = req.ip || req.connection?.remoteAddress || '';
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
};

// General API rate limiter
export const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 500,
  skip: skipLocalhost,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

// Stricter limiter for triage endpoints
export const triageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  skip: skipLocalhost,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Triage rate limit exceeded. Please wait before submitting again.' }
});

// Strict limiter for OCR (expensive GPU operation)
export const ocrLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 50,
  skip: skipLocalhost,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Document scan rate limit exceeded. Please wait before scanning again.' }
});

// Auth limiter — relaxed for dev (skips localhost entirely)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  skip: skipLocalhost,   // ← localhost is never rate-limited
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again later.' }
});
