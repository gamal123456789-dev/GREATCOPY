# 🔐 إصلاح مشاكل المصادقة - Authentication Fixes

## 📋 المشاكل التي تم حلها:

### 1. **مشكلة Discord OAuth:**
- ✅ إزالة custom token و userinfo URLs
- ✅ تحسين account linking
- ✅ إضافة logging أفضل

### 2. **مشكلة Session Handling:**
- ✅ إصلاح JWT callbacks
- ✅ تحسين token refresh
- ✅ إصلاح account linking

### 3. **مشكلة Cookies:**
- ✅ إصلاح إعدادات الكوكيز
- ✅ تحسين domain settings
- ✅ إصلاح secure flags

## 🚀 كيفية تطبيق الإصلاحات:

### الخطوة 1: تحديث ملف NextAuth
تم تحديث `pages/api/auth/[...nextauth].ts` مع:
- إصلاح Discord OAuth configuration
- تحسين session handling
- إصلاح cookies settings

### الخطوة 2: التأكد من إعدادات البيئة
تأكد من وجود هذه المتغيرات في ملف `.env`:

```env
# Discord OAuth
DISCORD_CLIENT_ID=1389217214409998468
DISCORD_CLIENT_SECRET=your_discord_client_secret

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://gear-score.com

# Database
DATABASE_URL=your_database_url

# Environment
NODE_ENV=production
```

### الخطوة 3: التأكد من Discord Developer Portal
في Discord Developer Portal، تأكد من وجود:
- **Redirect URI**: `https://gear-score.com/api/auth/callback/discord`
- **Client ID**: `1389217214409998468`
- **Client Secret**: صحيح ومحدث

### الخطوة 4: إعادة تشغيل التطبيق
```bash
# إعادة تشغيل التطبيق
pm2 restart gear-score

# أو إعادة تشغيل كامل
pm2 delete gear-score
pm2 start ecosystem.config.js --env production
```

## 🧪 اختبار الإصلاحات:

### 1. **اختبار في Terminal:**
```bash
# تشغيل اختبار المصادقة
node test-auth-fix.js
```

### 2. **اختبار في المتصفح:**
- افتح `test-auth-browser.html` في المتصفح
- اضغط على "Run Full Diagnostic"
- تحقق من النتائج

### 3. **اختبار المصادقة:**
- اذهب إلى `https://gear-score.com/auth`
- جرب تسجيل الدخول بالديسكورد
- جرب تسجيل الدخول بالإيميل
- جرب تسجيل الخروج

## 🔍 تشخيص المشاكل:

### إذا استمرت المشكلة:

#### 1. **تحقق من Logs:**
```bash
# عرض logs التطبيق
pm2 logs gear-score

# عرض logs Nginx
sudo tail -f /var/log/nginx/gear-score.error.log
```

#### 2. **تحقق من Database:**
```bash
# الدخول إلى Prisma Studio
npx prisma studio

# أو تشغيل migration
npx prisma migrate dev
```

#### 3. **تحقق من Environment:**
```bash
# تشغيل script إصلاح البيئة
node fix-vps-env.js
```

## 📱 اختبار المصادقة:

### 1. **اختبار Discord:**
- اضغط على "Login with Discord"
- تأكد من أن redirect URI صحيح
- تحقق من أن المستخدم يتم إنشاؤه/ربطه

### 2. **اختبار الإيميل:**
- أدخل الإيميل وكلمة المرور
- تأكد من أن `emailVerified` صحيح
- تحقق من أن bcrypt يعمل

### 3. **اختبار Session:**
- تحقق من أن الكوكيز يتم إنشاؤها
- تأكد من أن JWT token صحيح
- اختبر protected endpoints

## 🛠️ إصلاحات إضافية:

### 1. **إصلاح Rate Limiting:**
إذا كان في مشاكل في rate limiting:
```typescript
// في lib/rateLimiter.ts
export const authLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
```

### 2. **إصلاح CORS:**
إذا كان في مشاكل في CORS:
```typescript
// في server.js
const io = new Server(httpServer, {
  cors: {
    origin: [
      'https://gear-score.com',
      'https://www.gear-score.com'
    ],
    credentials: true
  }
});
```

### 3. **إصلاح Cookies Domain:**
إذا كان في مشاكل في الكوكيز:
```typescript
// في [...nextauth].ts
cookies: {
  sessionToken: {
    options: {
      domain: process.env.NODE_ENV === 'production' ? '.gear-score.com' : undefined
    }
  }
}
```

## 📊 مراقبة الأداء:

### 1. **PM2 Monitoring:**
```bash
# مراقبة التطبيق
pm2 monit

# عرض الإحصائيات
pm2 show gear-score
```

### 2. **Nginx Monitoring:**
```bash
# عرض access logs
sudo tail -f /var/log/nginx/gear-score.access.log

# عرض error logs
sudo tail -f /var/log/nginx/gear-score.error.log
```

### 3. **Database Monitoring:**
```bash
# عرض database connections
npx prisma studio

# تشغيل database health check
npx prisma db seed
```

## 🎯 النتائج المتوقعة:

بعد تطبيق الإصلاحات:
- ✅ Discord OAuth يعمل بدون مشاكل
- ✅ تسجيل الدخول بالإيميل يعمل
- ✅ تسجيل الخروج يعمل بشكل صحيح
- ✅ Sessions تبقى نشطة
- ✅ الكوكيز تعمل بشكل صحيح
- ✅ Account linking يعمل

## 🆘 إذا فشل الإصلاح:

### 1. **Rollback:**
```bash
# العودة للإصدار السابق
git checkout HEAD~1
pm2 restart gear-score
```

### 2. **Debug Mode:**
```typescript
// في [...nextauth].ts
debug: true, // Enable debug mode
```

### 3. **Contact Support:**
- أرسل logs كاملة
- وصف المشكلة بالتفصيل
- أرسل screenshots إذا أمكن

## 📞 الدعم:

إذا كنت تحتاج مساعدة إضافية:
1. تحقق من logs
2. شغل diagnostic tools
3. أرسل النتائج مع وصف المشكلة

---

**ملاحظة:** تأكد من اختبار كل شيء في بيئة التطوير قبل تطبيقه في الإنتاج.
