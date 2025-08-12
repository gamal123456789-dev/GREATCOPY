/**
 * Compression Middleware for VPS Performance Optimization
 * يقوم بضغط الاستجابات لتقليل استهلاك البيانات وتحسين السرعة
 */

const compression = require('compression');

// إعدادات الضغط المحسنة للـ VPS
const compressionOptions = {
  // ضغط الملفات التي تزيد عن 1KB
  threshold: 1024,
  
  // مستوى الضغط (1-9، 6 هو التوازن الأمثل)
  level: 6,
  
  // ضغط الاستجابات فقط إذا كانت أكبر من الحد الأدنى
  filter: (req, res) => {
    // لا تضغط إذا كان العميل لا يدعم الضغط
    if (req.headers['x-no-compression']) {
      return false;
    }
    
    // استخدم الفلتر الافتراضي للضغط
    return compression.filter(req, res);
  },
  
  // تحسين الذاكرة للـ VPS
  chunkSize: 16 * 1024, // 16KB chunks
  windowBits: 15,
  memLevel: 8
};

// Middleware للضغط
const compressionMiddleware = compression(compressionOptions);

// دالة لتحسين headers الاستجابة
const optimizeResponseHeaders = (req, res, next) => {
  // إضافة headers للتخزين المؤقت
  if (req.url.includes('/uploads/') || req.url.includes('/images/')) {
    // تخزين مؤقت للصور لمدة 30 يوم
    res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
    res.setHeader('Expires', new Date(Date.now() + 2592000000).toUTCString());
  } else if (req.url.includes('/api/')) {
    // عدم تخزين مؤقت لـ API responses
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  } else {
    // تخزين مؤقت للملفات الثابتة لمدة يوم واحد
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
  
  // إضافة headers الأمان
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  next();
};

// دالة لتحسين استجابات JSON
const optimizeJsonResponse = (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    // إزالة الخصائص غير الضرورية من الاستجابة
    if (data && typeof data === 'object') {
      // إزالة الخصائص الفارغة أو null
      const cleanData = JSON.parse(JSON.stringify(data, (key, value) => {
        if (value === null || value === undefined || value === '') {
          return undefined;
        }
        return value;
      }));
      
      return originalJson.call(this, cleanData);
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

module.exports = {
  compressionMiddleware,
  optimizeResponseHeaders,
  optimizeJsonResponse
};