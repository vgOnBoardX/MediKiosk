import passport from 'passport';

export const requireAuth = passport.authenticate('jwt', { session: false });

export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
    }
    next();
  };
};

export const ROLES = {
  KIOSK_DEVICE: 'KIOSK_DEVICE',
  TRIAGE_NURSE: 'TRIAGE_NURSE',
  JUNIOR_DOCTOR: 'JUNIOR_DOCTOR',
  SENIOR_CONSULTANT: 'SENIOR_CONSULTANT',
  HOSPITAL_ADMIN: 'HOSPITAL_ADMIN',
  PATIENT: 'PATIENT'
};
