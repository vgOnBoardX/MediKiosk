import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

// JWT Strategy for API protection
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'supersecret_jwt_key_change_in_production'
};

// Normalize Prisma enum roles → simple frontend roles
const normalizeRole = (role) => {
  const map = {
    JUNIOR_DOCTOR: 'DOCTOR',
    SENIOR_CONSULTANT: 'DOCTOR',
    TRIAGE_NURSE: 'NURSE',
    HOSPITAL_ADMIN: 'ADMIN',
    KIOSK_DEVICE: 'ADMIN',
    PATIENT: 'PATIENT',
  };
  return map[role] || role;
};

passport.use(new JwtStrategy(jwtOptions, async (jwt_payload, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: jwt_payload.id } });
    if (user) {
      // Normalize role before attaching to request so all protected routes get simple roles
      return done(null, { ...user, role: normalizeRole(user.role) });
    }
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
}));


// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/api/v1/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await prisma.user.findUnique({ where: { email: profile.emails[0].value } });
        
        if (!user) {
          user = await prisma.user.create({
            data: {
              email: profile.emails[0].value,
              name: profile.displayName,
              authProvider: 'GOOGLE',
              isVerified: true
            }
          });
        }
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  ));
}

// Facebook OAuth Strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(new FacebookStrategy({
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: "http://localhost:3000/api/v1/auth/facebook/callback",
      profileFields: ['id', 'emails', 'name']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails ? profile.emails[0].value : `${profile.id}@facebook.placeholder.com`;
        let user = await prisma.user.findUnique({ where: { email } });
        
        if (!user) {
          user = await prisma.user.create({
            data: {
              email: email,
              name: `${profile.name.givenName} ${profile.name.familyName}`,
              authProvider: 'FACEBOOK',
              isVerified: true
            }
          });
        }
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  ));
}

export default passport;
