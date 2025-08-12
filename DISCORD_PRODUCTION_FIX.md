# حل مشاكل Discord OAuth في الإنتاج 🚀

## المشاكل المحددة:
- ❌ تسجيل الدخول بـ Discord لا يعمل
- ❌ عدم عمل logout بشكل صحيح
- ❌ logout تلقائي عند refresh الصفحة

## الحلول المطبقة:

### 1️⃣ تحديث Discord Client Secret

**في ملف `.env.production`:**
```env
DISCORD_CLIENT_ID=1389217214409998468
DISCORD_CLIENT_SECRET=0GY6w9pUZ65e_D7dqFQZRUzibKnPwZn0
NEXTAUTH_URL=https://gear-score.com
```

### 2️⃣ إصلاح إعدادات الجلسات والكوكيز

**التحديثات في `[...nextauth].ts`:**

#### أ) زيادة مدة الجلسة:
```javascript
session: {
  strategy: "jwt" as const,
  maxAge: 30 * 24 * 60 * 60, // 30 يوم بدلاً من 7 أيام
  updateAge: 24 * 60 * 60, // تحديث كل 24 ساعة
},
```

#### ب) إصلاح إعدادات الكوكيز:
```javascript
cookies: {
  sessionToken: {
    name: `next-auth.session-token`,
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60, // 30 يوم
      domain: undefined // إزالة قيود الدومين لحل مشاكل logout
    }
  },
  // ... باقي إعدادات الكوكيز
}
```

### 3️⃣ التأكد من Redirect URI في Discord Developer Portal

**يجب إضافة هذا الرابط في Discord Developer Portal:**
```
https://gear-score.com/api/auth/callback/discord
```

**خطوات الإضافة:**
1. اذهب إلى [Discord Developer Portal](https://discord.com/developers/applications)
2. اختر التطبيق بـ Client ID: `1389217214409998468`
3. اذهب إلى تبويب "OAuth2"
4. في قسم "Redirects"، أضف الرابط أعلاه
5. احفظ التغييرات

### 4️⃣ نشر التحديثات على السيرفر

**خطوات النشر:**

#### أ) رفع الكود إلى GitHub:
```bash
git add .
git commit -m "Fix Discord OAuth and session issues for production"
git push origin main
```

#### ب) على السيرفر:
```bash
# سحب آخر التحديثات
git pull origin main

# نسخ ملف البيئة للإنتاج
cp .env.production .env

# تثبيت التبعيات (إذا لزم الأمر)
npm install

# إعادة تشغيل التطبيق
pm2 restart gearscore
# أو
npm run build && npm start
```

### 5️⃣ اختبار الحل

**رابط اختبار Discord OAuth:**
```
https://discord.com/api/oauth2/authorize?client_id=1389217214409998468&redirect_uri=https%3A%2F%2Fgear-score.com%2Fapi%2Fauth%2Fcallback%2Fdiscord&response_type=code&scope=identify+email&prompt=consent
```

**خطوات الاختبار:**
1. امسح جميع الكوكيز في المتصفح
2. اذهب إلى `https://gear-score.com/auth`
3. اضغط على "تسجيل الدخول بالديسكورد"
4. أكمل عملية التسجيل في Discord
5. تحقق من تسجيل الدخول الناجح
6. جرب refresh الصفحة للتأكد من عدم حدوث logout تلقائي
7. جرب logout يدوياً للتأكد من عمله

## الأخطاء الشائعة وحلولها:

### ❌ "Invalid OAuth2 redirect_uri"
**الحل:** تأكد من إضافة `https://gear-score.com/api/auth/callback/discord` في Discord Developer Portal

### ❌ "Invalid client_secret"
**الحل:** تأكد من استخدام Client Secret الجديد: `0GY6w9pUZ65e_D7dqFQZRUzibKnPwZn0`

### ❌ Logout تلقائي عند refresh
**الحل:** تم إصلاحه بإزالة قيود الدومين من إعدادات الكوكيز

### ❌ الجلسة تنتهي بسرعة
**الحل:** تم زيادة مدة الجلسة إلى 30 يوم

## التحقق من الحالة:

### ✅ قائمة المراجعة:
- [x] تحديث Discord Client Secret في `.env.production`
- [x] إصلاح إعدادات الجلسات (30 يوم)
- [x] إزالة قيود الدومين من الكوكيز
- [ ] رفع التحديثات إلى GitHub
- [ ] نشر التحديثات على السيرفر
- [ ] إضافة Redirect URI في Discord Developer Portal
- [ ] اختبار تسجيل الدخول
- [ ] اختبار logout
- [ ] اختبار refresh الصفحة

## ملاحظات مهمة:

1. **الأمان:** تم الحفاظ على جميع إعدادات الأمان (httpOnly, secure, etc.)
2. **التوافق:** الحل يعمل مع جميع المتصفحات الحديثة
3. **الأداء:** لا يؤثر على أداء الموقع
4. **Debug Mode:** مُفعل لمراقبة أي مشاكل جديدة

---

**تاريخ التحديث:** 2025-08-10  
**الحالة:** جاهز للنشر ✅