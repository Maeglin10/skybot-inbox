import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';

/**
 * Cache Module
 * 
 * Provides in-memory caching for frequently accessed data.
 * Uses cache-manager with memory store by default.
 * 
 * Configuration:
 * - TTL: 300 seconds (5 minutes) by default
 * - Max items: 100 items in cache
 * - Global: Available in all modules
 * 
 * For production with Redis:
 * - Install: npm install cache-manager-redis-yet redis
 * - Configure redisStore in CacheModule.register()
 */
@Module({
  imports: [
    NestCacheModule.register({
      isGlobal: true, // Make cache available globally
      ttl: parseInt(process.env.CACHE_TTL || '300', 10) * 1000, // 5 minutes default (in milliseconds)
      max: parseInt(process.env.CACHE_MAX_ITEMS || '100', 10), // Max 100 items
    }),
  ],
})
export class AppCacheModule {}
