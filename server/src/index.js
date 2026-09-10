import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import passport from './middlewares/passport.js';
import { generalLimiter, triageLimiter, ocrLimiter, authLimiter } from './middlewares/rateLimiter.js';
import authRoutes from './routes/auth.js';
import ocrRoutes from './routes/ocr.js';
import triageRoutes from './routes/triage.js';
import patientRoutes from './routes/patient.js';
import adminRoutes from './routes/admin.js';
// import './services/queue.js';
// import './services/redis.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
app.set('io', io);

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Apply general rate limiter to all API routes
app.use('/api/', generalLimiter);

// Database Connections
const prisma = new PrismaClient();

const connectDatabases = async () => {
  try {
    // MongoDB
    if (process.env.MONGO_URI) {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('✅ MongoDB connected successfully');
    } else {
      console.warn('⚠️ MONGO_URI not found');
    }
    
    // Prisma (PostgreSQL is implicitly connected on first query, but we can test it)
    await prisma.$connect();
    console.log('✅ PostgreSQL (Neon) connected successfully via Prisma');
  } catch (error) {
    console.warn('⚠️ Database connection failed. Please configure .env (MONGO_URI, DATABASE_URL) to connect. Server is still running.');
  }
};

// Real-time Socket.io
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  
  socket.on('join_department', (deptId) => {
    socket.join(`dept:${deptId}`);
    console.log(`Client ${socket.id} joined dept:${deptId}`);
  });

  socket.on('join_triage', () => {
    socket.join('triage');
    console.log(`Client ${socket.id} joined triage room`);
  });

  socket.on('emergency_alert', (data) => {
    // Broadcast emergency to all triage nurses
    io.to('triage').emit('triage-alert', data);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Routes with specific rate limiters
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Sanjeevani AI-OS Backend Engine' });
});
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/ocr', ocrLimiter, ocrRoutes);
app.use('/api/v1/triage', triageLimiter, triageRoutes);
app.use('/api/v1/patient', patientRoutes);
app.use('/api/v1/admin', adminRoutes);

// Global Error Handler — catches unhandled errors from routes
app.use((err, req, res, _next) => {
  console.error('🚨 Unhandled Error:', err.stack || err.message);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred.'
      : err.message || 'Internal Server Error'
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await connectDatabases();
});
