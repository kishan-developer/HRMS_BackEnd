import { createClient, RedisClientType } from 'redis';

const redisUrl = process.env.REDIS_HOST 
  ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}`
  : 'redis://localhost:6379';

export const redisClient: RedisClientType = createClient({
  url: redisUrl,
  password: process.env.REDIS_PASSWORD || undefined,
});

export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    console.log('Redis connection successful');
  } catch (error) {
    console.error('Redis connection failed:', error);
  }
};

export const disconnectRedis = async (): Promise<void> => {
  await redisClient.disconnect();
  console.log('Redis disconnected');
};
