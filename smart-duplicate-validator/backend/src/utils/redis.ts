import { createClient, RedisClientType } from 'redis';

class RedisManager {
  private client: RedisClientType;
  private isConnected: boolean = false;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          console.log(`Redis reconnect attempt ${retries}`);
          return Math.min(retries * 50, 500);
        }
      }
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      console.log('Redis Client Connected');
      this.isConnected = true;
    });

    this.client.on('disconnect', () => {
      console.log('Redis Client Disconnected');
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
    }
  }

  getClient(): RedisClientType {
    return this.client;
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Redis ping failed:', error);
      return false;
    }
  }

  // Cache operations
  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    try {
      if (ttl) {
        await this.client.setEx(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error) {
      console.error('Redis SET error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis DEL error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  }

  // JSON operations
  async setJSON(key: string, value: any, ttl?: number): Promise<boolean> {
    return this.set(key, JSON.stringify(value), ttl);
  }

  async getJSON<T = any>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('JSON parse error:', error);
      return null;
    }
  }

  // Hash operations
  async hSet(key: string, field: string, value: string): Promise<boolean> {
    try {
      await this.client.hSet(key, field, value);
      return true;
    } catch (error) {
      console.error('Redis HSET error:', error);
      return false;
    }
  }

  async hGet(key: string, field: string): Promise<string | null> {
    try {
      return await this.client.hGet(key, field);
    } catch (error) {
      console.error('Redis HGET error:', error);
      return null;
    }
  }

  async hGetAll(key: string): Promise<Record<string, string> | null> {
    try {
      return await this.client.hGetAll(key);
    } catch (error) {
      console.error('Redis HGETALL error:', error);
      return null;
    }
  }

  // List operations
  async lPush(key: string, ...values: string[]): Promise<number> {
    try {
      return await this.client.lPush(key, values);
    } catch (error) {
      console.error('Redis LPUSH error:', error);
      return 0;
    }
  }

  async rPop(key: string): Promise<string | null> {
    try {
      return await this.client.rPop(key);
    } catch (error) {
      console.error('Redis RPOP error:', error);
      return null;
    }
  }

  async lLen(key: string): Promise<number> {
    try {
      return await this.client.lLen(key);
    } catch (error) {
      console.error('Redis LLEN error:', error);
      return 0;
    }
  }

  // Set operations
  async sAdd(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.client.sAdd(key, members);
    } catch (error) {
      console.error('Redis SADD error:', error);
      return 0;
    }
  }

  async sMembers(key: string): Promise<string[]> {
    try {
      return await this.client.sMembers(key);
    } catch (error) {
      console.error('Redis SMEMBERS error:', error);
      return [];
    }
  }

  async sIsMember(key: string, member: string): Promise<boolean> {
    try {
      return await this.client.sIsMember(key, member);
    } catch (error) {
      console.error('Redis SISMEMBER error:', error);
      return false;
    }
  }

  // Session management
  async setSession(sessionId: string, userId: string, ttl: number = 86400): Promise<boolean> {
    return this.set(`session:${sessionId}`, userId, ttl);
  }

  async getSession(sessionId: string): Promise<string | null> {
    return this.get(`session:${sessionId}`);
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    return this.del(`session:${sessionId}`);
  }

  // Rate limiting
  async incrementRateLimit(key: string, windowMs: number, maxRequests: number): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const window = Math.floor(now / windowMs);
    const rateLimitKey = `rate_limit:${key}:${window}`;

    try {
      const current = await this.client.incr(rateLimitKey);
      
      if (current === 1) {
        await this.client.expire(rateLimitKey, Math.ceil(windowMs / 1000));
      }

      const remaining = Math.max(0, maxRequests - current);
      const resetTime = (window + 1) * windowMs;

      return {
        allowed: current <= maxRequests,
        remaining,
        resetTime
      };
    } catch (error) {
      console.error('Rate limit error:', error);
      return { allowed: true, remaining: maxRequests, resetTime: now + windowMs };
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; latency?: number }> {
    try {
      const start = Date.now();
      await this.ping();
      const latency = Date.now() - start;
      
      return {
        status: 'healthy',
        latency
      };
    } catch (error) {
      return {
        status: 'unhealthy'
      };
    }
  }
}

export const redisClient = new RedisManager();