import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const getRedisUrl = () => {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }
  return 'redis://127.0.0.1:6379';
};

const redisClient = new Redis(getRedisUrl(), {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
  retryStrategy(times) {
    console.warn(`Redis reconnecting... attempt ${times}`);
    return Math.min(times * 50, 2000);
  }
});

redisClient.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

export default redisClient;
