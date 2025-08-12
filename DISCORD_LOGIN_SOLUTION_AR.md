# حل مشكلة تسجيل الدخول عبر Discord 🔧

## المشكلة 🚨
بعد الموافقة على تسجيل الدخول عبر Discord، لا يتم تسجيل دخول المستخدم إلى الموقع.

## السبب الجذري 🎯
الخطأ في السجلات: `NextAuth Error: OAUTH_CALLBACK_ERROR invalid_client`

هذا يعني أن **Redirect URI** غير مُضاف في Discord Developer Portal.

## الحل الكامل ✅

### 1️⃣ إضافة Redirect URI في Discord Developer Portal

**خطوات مهمة:**

1. اذهب إلى [Discord Developer Portal](https://discord.com/developers/applications)
2. اختر تطبيقك (Client ID: `1389217214409998468`)
3. اذهب إلى تبويب **OAuth2**
4. في قسم **Redirects**، أضف هذين الرابطين:
   ```
   http://localhost:3000/api/auth/callback/discord
   https://gear-score.com/api/auth/callback/discord
   ```
5. احفظ التغييرات

### 2️⃣ التحقق من الإعدادات

**متغيرات البيئة (تم التحقق منها ✅):**
- `DISCORD_CLIENT_ID`: 1389217214409998468
- `DISCORD_CLIENT_SECRET`: موجود
- `NEXTAUTH_URL`: http://localhost:3000
- `NEXTAUTH_SECRET`: موجود

### 3️⃣ اختبار الحل

**رابط Discord OAuth المباشر:**
```
https://discord.com/api/oauth2/authorize?client_id=1389217214409998468&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fcallback%2Fdiscord&response_type=code&scope=identify+email&prompt=consent
```

**خطوات الاختبار:**
1. افتح الرابط أعلاه في المتصفح
2. وافق على أذونات Discord
3. يجب أن يتم توجيهك إلى الموقع مع تسجيل دخول ناجح

### 4️⃣ مراقبة السجلات

بعد إضافة Redirect URI، يجب أن تختفي رسالة الخطأ:
```
NextAuth Error: OAUTH_CALLBACK_ERROR invalid_client
```

## الأخطاء الشائعة وحلولها 🛠️

### خطأ "Invalid OAuth2 redirect_uri"
**الحل:** تأكد من إضافة الرابط الصحيح في Discord Developer Portal

### خطأ "invalid_client"
**الحل:** تحقق من صحة `DISCORD_CLIENT_ID` و `DISCORD_CLIENT_SECRET`

### المستخدم لا يُسجل دخوله بعد الموافقة
**الحل:** تأكد من إضافة كلا الرابطين (localhost و production)

## ملاحظات مهمة 📝

1. **وضع التشخيص مُفعل:** `debug: true` في NextAuth
2. **السيرفر يعمل:** http://localhost:3000
3. **قاعدة البيانات متصلة:** SQLite محلية
4. **متغيرات البيئة محملة:** 12 متغير من ملف .env

## التحقق النهائي ✨

**قائمة المراجعة:**
- [ ] إضافة Redirect URI في Discord Developer Portal
- [ ] التأكد من صحة Client ID و Client Secret
- [ ] اختبار الرابط المباشر
- [ ] مراقبة السجلات للتأكد من عدم وجود أخطاء

**بعد تطبيق هذه الخطوات، يجب أن يعمل تسجيل الدخول عبر Discord بشكل طبيعي! 🎉**

---

*تم إنشاء هذا الدليل في: 2025-08-10*
*حالة السيرفر: يعمل على http://localhost:3000*
*حالة متغيرات البيئة: محملة بنجاح*