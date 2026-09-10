import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import passport from '../middlewares/passport.js';

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_jwt_key_change_in_production';

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

// Map simple frontend role → Prisma enum
const toPrismaRole = (role) => {
  const map = {
    DOCTOR: 'JUNIOR_DOCTOR',
    NURSE: 'TRIAGE_NURSE',
    ADMIN: 'HOSPITAL_ADMIN',
    PATIENT: 'PATIENT',
    // Pass through Prisma enum values directly too
    JUNIOR_DOCTOR: 'JUNIOR_DOCTOR',
    SENIOR_CONSULTANT: 'SENIOR_CONSULTANT',
    TRIAGE_NURSE: 'TRIAGE_NURSE',
    HOSPITAL_ADMIN: 'HOSPITAL_ADMIN',
    KIOSK_DEVICE: 'KIOSK_DEVICE',
  };
  return map[role] || 'JUNIOR_DOCTOR';
};


const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: normalizeRole(user.role), email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};


// Local Registration
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password and name are required.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'This email is already registered. Please sign in instead.' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: toPrismaRole(role),
        authProvider: 'LOCAL'
      }
    });

    res.status(201).json({ message: 'User registered successfully', userId: user.id });
  } catch (error) {
    console.error('❌ Registration error:', error.message, error.code);
    res.status(500).json({ error: 'Registration failed: ' + (error.message || 'Unknown server error') });
  }
});



// Local Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user || user.authProvider !== 'LOCAL') {
      return res.status(401).json({ error: 'Invalid credentials or wrong auth provider' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken(user);
    res.json({ 
      token, 
      user: { id: user.id, name: user.name, role: normalizeRole(user.role), email: user.email } 
    });
  } catch (error) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({ error: 'Server error during login' });
  }
});


// ABHA Kiosk Login (No password — kiosk terminal authentication)
router.post('/abha-login', async (req, res) => {
  try {
    const { abhaNumber, patientName } = req.body;

    if (!abhaNumber || abhaNumber.replace(/[-\s]/g, '').length < 6) {
      return res.status(400).json({ error: 'A valid ABHA number is required.' });
    }

    // Normalize: strip dashes/spaces for storage, keep display format
    const normalizedAbha = abhaNumber.replace(/[-\s]/g, '');
    const syntheticEmail = `${normalizedAbha}@abha.nha.gov.in`;
    const displayName = patientName || 'Kiosk Patient';

    // Find or create the User record
    const user = await prisma.user.upsert({
      where: { email: syntheticEmail },
      update: { name: displayName },
      create: {
        email: syntheticEmail,
        name: displayName,
        role: 'PATIENT',
        authProvider: 'LOCAL',
        isVerified: true
      }
    });

    // Find or create the PatientProfile
    const profile = await prisma.patientProfile.upsert({
      where: { abhaNumber: normalizedAbha },
      update: { fullName: displayName },
      create: {
        userId: user.id,
        abhaNumber: normalizedAbha,
        fullName: displayName,
        dateOfBirth: new Date('1990-01-01'),
        gender: 'Not Specified'
      }
    });

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email
      },
      profile: {
        id: profile.id,
        abhaNumber: profile.abhaNumber,
        fullName: profile.fullName,
        pmjayEligible: true // Mock for SIH demo
      }
    });
  } catch (error) {
    console.error('ABHA login error:', error);
    res.status(500).json({ error: 'Failed to authenticate via ABHA.' });
  }
});

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/login' }), (req, res) => {
  const token = generateToken(req.user);
  res.redirect(`http://localhost:5175/auth-success?token=${token}`);
});

// Facebook OAuth
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

router.get('/facebook/callback', passport.authenticate('facebook', { session: false, failureRedirect: '/login' }), (req, res) => {
  const token = generateToken(req.user);
  res.redirect(`http://localhost:5175/auth-success?token=${token}`);
});

// Profile route (Protected Example)
router.get('/me', passport.authenticate('jwt', { session: false }), (req, res) => {
  res.json({ user: req.user });
});

export default router;
