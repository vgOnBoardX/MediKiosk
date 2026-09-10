import express from 'express';
import { PrismaClient } from '@prisma/client';
import passport from 'passport';

const prisma = new PrismaClient();
const router = express.Router();

// Ensure only ADMIN can access
const requireAdmin = [
  passport.authenticate('jwt', { session: false }),
  (req, res, next) => {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }
    next();
  }
];

// GET /api/v1/admin/stats
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Total encounters today
    const totalToday = await prisma.encounter.count({
      where: {
        createdAt: {
          gte: today
        }
      }
    });

    // 2. Encounters by Department
    const byDepartmentRaw = await prisma.encounter.groupBy({
      by: ['departmentId'],
      _count: {
        id: true
      },
      where: {
        createdAt: {
          gte: today
        }
      }
    });
    
    const byDepartment = byDepartmentRaw.map(item => ({
      name: item.departmentId,
      value: item._count.id
    }));

    // 3. Encounters by Priority
    const byPriorityRaw = await prisma.encounter.groupBy({
      by: ['priorityLevel'],
      _count: {
        id: true
      },
      where: {
        createdAt: {
          gte: today
        }
      }
    });
    
    const byPriority = byPriorityRaw.map(item => ({
      name: item.priorityLevel,
      value: item._count.id
    }));

    // 4. Average Wait Time (Estimation based on WAITING status)
    // For simplicity in the hackathon, we'll just mock a wait time trend, or we can calculate actual if we have end times.
    // Let's count how many are currently waiting vs total
    const currentlyWaiting = await prisma.encounter.count({
      where: {
        status: { in: ['WAITING', 'TRIAGED'] }
      }
    });

    // Mock hourly data for the chart
    const currentHour = new Date().getHours();
    const waitTimeTrend = [];
    for (let i = 8; i <= currentHour && i <= 20; i++) {
      waitTimeTrend.push({
        time: `${i}:00`,
        patients: Math.floor(Math.random() * 20) + 5, // Random data for visual effect
        avgWaitMins: Math.floor(Math.random() * 45) + 10 
      });
    }

    res.json({
      success: true,
      data: {
        totalToday,
        currentlyWaiting,
        byDepartment,
        byPriority,
        waitTimeTrend
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch admin statistics' });
  }
});

export default router;
