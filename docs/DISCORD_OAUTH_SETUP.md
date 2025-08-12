# Discord OAuth Setup Guide

## المشكلة الشائعة: Invalid OAuth2 redirect_uri

هذه المشكلة تحدث عندما يكون هناك عدم تطابق بين redirect URI المُعرف في Discord Developer Portal و redirect URI الذي يرسله التطبيق.

## الحل:

### 1. في Discord Developer Portal:
يجب إضافة redirect URIs التالية:
- `https://gear-score.com/api/auth/callback/discord` (للإنتاج بدون منفذ)
- `https://gear-score.com:5200/api/auth/callback/discord` (للإنتاج مع منفذ)
- `http://localhost:5200/api/auth/callback/discord` (للتطوير المحلي)

### 2. في ملف .env:
```env
# للإنتاج بدون منفذ (مع reverse proxy)
NEXTAUTH_URL=https://gear-score.com

# أو للإنتاج مع منفذ مباشر
NEXTAUTH_URL=https://gear-score.com:5200

# للتطوير المحلي
NEXTAUTH_URL=http://localhost:5200
```

### 3. التحقق من الإعدادات:
- تأكد من أن `DISCORD_CLIENT_ID` و `DISCORD_CLIENT_SECRET` صحيحان
- تأكد من أن `NEXTAUTH_SECRET` مُعرف
- تحقق من أن redirect URI في Discord يطابق `${NEXTAUTH_URL}/api/auth/callback/discord`

### 4. إعدادات VPS:
إذا كنت تستخدم reverse proxy (مثل Nginx):
```nginx
server {
    listen 443 ssl;
    server_name gear-score.com;
    
    location / {
        proxy_pass http://localhost:5200;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

في هذه الحالة استخدم:
```env
NEXTAUTH_URL=https://gear-score.com
```

### 5. Debug Logs:
تم إضافة logging مفصل في ملف `[...nextauth].ts` لمساعدتك في تشخيص المشاكل:
- تحقق من console logs عند بدء الخادم
- ابحث عن "🔗 Discord OAuth Redirect URI" في اللوجز
- تأكد من أن redirect URI المطبوع يطابق ما هو مُعرف في Discord

### 6. اختبار الإعداد:
1. ابدأ الخادم وتحقق من اللوجز
2. اذهب إلى صفحة تسجيل الدخول
3. اضغط على "Login with Discord"
4. إذا ظهرت رسالة "Invalid OAuth2 redirect_uri"، تحقق من:
   - redirect URI في Discord Developer Portal
   - قيمة `NEXTAUTH_URL` في ملف .env
   - أن الاثنين متطابقان تماماً

## ملاحظات مهمة:
- redirect URI حساس للحروف الكبيرة والصغيرة
- يجب أن يكون البروتوكول (http/https) متطابقاً
- المنفذ (port) يجب أن يكون متطابقاً أو محذوفاً من كلا المكانين
- لا تضع `/` في نهاية NEXTAUTH_URL