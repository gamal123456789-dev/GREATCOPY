# دليل حل مشكلة تسجيل الدخول بالديسكورد

## 🔍 وصف المشكلة
عند محاولة تسجيل الدخول بالديسكورد، يتم توجيه المستخدم إلى صفحة Discord OAuth ولكن بعد الموافقة على الصلاحيات لا يتم تسجيل الدخول في الموقع.

## 🎯 السبب الأكثر احتمالاً
المشكلة الأساسية هي عدم إضافة **Redirect URI** الصحيح في Discord Developer Portal.

## 🔧 الحل الشامل

### 1. إعداد Discord Developer Portal

#### الخطوات:
1. اذهب إلى [Discord Developer Portal](https://discord.com/developers/applications)
2. اختر تطبيقك بـ Client ID: `1389217214409998468`
3. اذهب إلى **OAuth2** > **General**
4. في قسم **Redirects**، أضف هذه الـ URIs:
   ```
   http://localhost:3000/api/auth/callback/discord
   https://gear-score.com/api/auth/callback/discord
   ```
5. احفظ التغييرات

#### ⚠️ نقاط مهمة:
- تأكد من عدم وجود مسافات إضافية
- تأكد من عدم وجود `/` في نهاية الـ URI
- الـ URI حساس للأحرف الكبيرة والصغيرة

### 2. التحقق من متغيرات البيئة

#### في ملف `.env`:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
DISCORD_CLIENT_ID=1389217214409998468
DISCORD_CLIENT_SECRET=your-discord-secret
```

#### في ملف `.env.production`:
```env
NEXTAUTH_URL=https://gear-score.com
NEXTAUTH_SECRET=your-secret-here
DISCORD_CLIENT_ID=1389217214409998468
DISCORD_CLIENT_SECRET=your-discord-secret
```

### 3. تمكين وضع التشخيص

تم تمكين `debug: true` في NextAuth config لرؤية الأخطاء التفصيلية.

### 4. اختبار الحل

#### الطريقة الأولى - اختبار يدوي:
1. امسح جميع الكوكيز في المتصفح
2. اذهب إلى `http://localhost:3000/auth`
3. اضغط على "تسجيل الدخول بالديسكورد"
4. راقب سجلات الخادم للأخطاء

#### الطريقة الثانية - اختبار مباشر:
1. انسخ هذا الرابط:
   ```
   https://discord.com/api/oauth2/authorize?client_id=1389217214409998468&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fcallback%2Fdiscord&response_type=code&scope=identify+email&prompt=consent
   ```
2. الصقه في المتصفح
3. سجل دخول بحساب Discord
4. اقبل الصلاحيات

### 5. الأخطاء الشائعة وحلولها

#### خطأ: "Invalid OAuth2 redirect_uri"
**الحل:** تأكد من إضافة الـ Redirect URI في Discord Developer Portal

#### خطأ: "Application does not have a bot"
**الحل:** لا تحتاج bot للـ OAuth، تجاهل هذا الخطأ

#### خطأ: "Invalid client_secret"
**الحل:** تحقق من `DISCORD_CLIENT_SECRET` في ملف `.env`

#### المستخدم يتم توجيهه لكن لا يسجل دخول
**الحل:** 
1. تحقق من سجلات الخادم
2. تأكد من أن الإيميل في Discord مفعل ومرئي
3. امسح الكوكيز وحاول مرة أخرى

### 6. فحص قاعدة البيانات

لفحص ما إذا كان المستخدم تم إنشاؤه:
```bash
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.user.findMany().then(users => console.log(users)).finally(() => prisma.$disconnect());"
```

### 7. ملفات الاختبار المتاحة

- `test-discord-login-debug.js` - تشخيص شامل
- `test-discord-auth-flow.js` - محاكاة تدفق المصادقة
- `test-discord-redirect-url.js` - اختبار URL الصحيح
- `debug-discord-auth.js` - تشخيص متقدم

### 8. خطوات التحقق النهائية

✅ **قائمة التحقق:**
- [ ] تم إضافة Redirect URI في Discord Developer Portal
- [ ] متغيرات البيئة صحيحة
- [ ] تم تمكين debug mode
- [ ] تم مسح الكوكيز في المتصفح
- [ ] الخادم يعمل على `http://localhost:3000`
- [ ] لا توجد أخطاء في سجلات الخادم

## 🚀 بعد تطبيق الحل

1. أعد تشغيل الخادم
2. امسح الكوكيز في المتصفح
3. جرب تسجيل الدخول بالديسكورد
4. راقب سجلات الخادم للتأكد من عدم وجود أخطاء

## 📞 إذا استمرت المشكلة

1. تحقق من سجلات الخادم أثناء محاولة تسجيل الدخول
2. تأكد من أن Discord account لديه إيميل مفعل
3. جرب حساب Discord مختلف
4. تحقق من إعدادات الخصوصية في حساب Discord

---

**ملاحظة:** تم تمكين debug mode في NextAuth، لذا ستظهر معلومات تفصيلية في سجلات الخادم أثناء عملية تسجيل الدخول.