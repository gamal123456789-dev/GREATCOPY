// Rate Limiter للحماية من الهجمات
// Security enhancement to prevent brute force and DDoS attacks

class RateLimiter {
  constructor(maxRequests = 100, windowMs = 15 * 60 * 1000) { // 15 minutes
    this.requests = new Map();
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    
    // تنظيف البيانات القديمة كل 5 دقائق
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  isAllowed(identifier) {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    if (!entry || now > entry.resetTime) {
      // إنشاء أو إعادة تعيين العداد
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

  getRemainingRequests(identifier) {
    const entry = this.requests.get(identifier);
    if (!entry || Date.now() > entry.resetTime) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - entry.count);
  }

  getResetTime(identifier) {
    const entry = this.requests.get(identifier);
    if (!entry || Date.now() > entry.resetTime) {
      return Date.now() + this.windowMs;
    }
    return entry.resetTime;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

// إنشاء مثيلات مختلفة للحدود المختلفة - تم زيادة الحدود بشكل كبير جداً
const generalLimiter = new RateLimiter(10000, 15 * 60 * 1000); // 10,000 requests per 15 minutes (زيادة كبيرة جداً)
const authLimiter = new RateLimiter(1000, 15 * 60 * 1000); // 1,000 login attempts per 15 minutes (زيادة كبيرة جداً)
const adminLimiter = new RateLimiter(5000, 15 * 60 * 1000); // 5,000 admin requests per 15 minutes (زيادة كبيرة جداً)
const messageLimiter = new RateLimiter(2000, 60 * 1000); // 2,000 messages per minute (زيادة كبيرة جداً)

// دالة مساعدة للحصول على معرف العميل
function getClientIdentifier(req) {
  // استخدام IP address أو user ID إذا كان متاحاً
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0] : req.connection?.remoteAddress || req.socket?.remoteAddress;
  const userId = req.session?.user?.id;
  
  return userId || ip || 'unknown';
}

// Middleware للتحقق من Rate Limiting
function createRateLimitMiddleware(limiter) {
  return (req, res, next) => {
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
    
    res.setHeader('X-RateLimit-Limit', limiter.maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000));
    
    if (next) next();
    return true;
  };
}

module.exports = {
  RateLimiter,
  generalLimiter,
  authLimiter,
  adminLimiter,
  messageLimiter,
  getClientIdentifier,
  createRateLimitMiddleware
};