// Rate Limiter for protection against attacks
// Security enhancement to prevent brute force and DDoS attacks

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) { // 15 minutes
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    
    // Clean up old data every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  public isAllowed(identifier: string): boolean {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    if (!entry || now > entry.resetTime) {
      // Create or reset counter
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      // تم تجاوز الحد المسموح
      console.log(`[SECURITY] Rate limit exceeded for ${identifier} at ${new Date().toISOString()}`);
      return false;
    }

    // زيادة العداد
    entry.count++;
    return true;
  }

  public getRemainingRequests(identifier: string): number {
    const entry = this.requests.get(identifier);
    if (!entry || Date.now() > entry.resetTime) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - entry.count);
  }

  public getResetTime(identifier: string): number {
    const entry = this.requests.get(identifier);
    if (!entry || Date.now() > entry.resetTime) {
      return Date.now() + this.windowMs;
    }
    return entry.resetTime;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

// Create different instances for different limits - limits have been increased significantly
export const generalLimiter = new RateLimiter(10000, 15 * 60 * 1000); // 10,000 requests per 15 minutes (significant increase)
export const authLimiter = new RateLimiter(1000, 15 * 60 * 1000); // 1,000 login attempts per 15 minutes (significant increase)
export const adminLimiter = new RateLimiter(5000, 15 * 60 * 1000); // 5,000 admin requests per 15 minutes (significant increase)
export const messageLimiter = new RateLimiter(2000, 60 * 1000); // 2,000 messages per minute (significant increase)

// Helper function to get client identifier
export function getClientIdentifier(req: any): string {
  // Use IP address or user ID if available
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0] : req.connection?.remoteAddress || req.socket?.remoteAddress;
  const userId = req.session?.user?.id;
  
  return userId || ip || 'unknown';
}

// Middleware للتحقق من Rate Limiting
export function createRateLimitMiddleware(limiter: RateLimiter) {
  return (req: any, res: any, next?: () => void) => {
    const identifier = getClientIdentifier(req);
    
    if (!limiter.isAllowed(identifier)) {
      const resetTime = limiter.getResetTime(identifier);
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
      
      res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: retryAfter
      });
      return false;
    }
    
    // إضافة headers للمعلومات
    const remaining = limiter.getRemainingRequests(identifier);
    const resetTime = limiter.getResetTime(identifier);
    
    res.setHeader('X-RateLimit-Limit', limiter['maxRequests']);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000));
    
    if (next) next();
    return true;
  };
}

export default RateLimiter;