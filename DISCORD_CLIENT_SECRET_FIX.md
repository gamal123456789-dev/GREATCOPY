# 🔧 حل مشكلة Discord Client Secret

## 🚨 المشكلة المكتشفة
**Discord API يرجع خطأ 401 - Client Secret غير صحيح!**

هذا يعني أن `DISCORD_CLIENT_SECRET` في ملف `.env` لا يطابق Client Secret الفعلي في Discord Developer Portal.

## 🔍 التشخيص
- ✅ Client ID صحيح: `1389217214409998468`
- ✅ Redirect URI مُضاف: `http://localhost:3000/api/auth/callback/discord`
- ❌ **Client Secret غير صحيح**

## 🛠️ الحل (خطوات مفصلة)

### الخطوة 1: الحصول على Client Secret الصحيح

1. **اذهب إلى Discord Developer Portal**:
   ```
   https://discord.com/developers/applications
   ```

2. **اختر التطبيق**:
   - ابحث عن التطبيق بـ Client ID: `1389217214409998468`
   - اضغط عليه

3. **اذهب إلى General Information**:
   - في الصفحة الرئيسية للتطبيق
   - ابحث عن قسم "Client Secret"

4. **انسخ Client Secret**:
   - اضغط على "Copy" بجانب Client Secret
   - إذا لم تجده، اضغط على "Reset Secret" لإنشاء واحد جديد
   - ⚠️ **تحذير**: إعادة تعيين Secret سيبطل القديم

### الخطوة 2: تحديث ملف .env

1. **افتح ملف `.env`** في مجلد المشروع

2. **ابحث عن السطر**:
   ```
   DISCORD_CLIENT_SECRET=القيمة_الحالية
   ```

3. **استبدل القيمة** بـ Client Secret الجديد:
   ```
   DISCORD_CLIENT_SECRET=القيمة_الجديدة_من_Discord
   ```

4. **احفظ الملف**

### الخطوة 3: إعادة تشغيل الخادم

1. **أوقف الخادم الحالي**:
   - اضغط `Ctrl + C` في Terminal

2. **شغل الخادم مرة أخرى**:
   ```bash
   npm run dev
   ```

## ✅ التحقق من الحل

### اختبار سريع:
```bash
node -e "require('dotenv').config(); console.log('Client Secret:', process.env.DISCORD_CLIENT_SECRET ? 'موجود' : 'مفقود');"
```

### رابط اختبار Discord OAuth:
```
https://discord.com/api/oauth2/authorize?client_id=1389217214409998468&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fcallback%2Fdiscord&response_type=code&scope=identify+email&prompt=consent
```

## 🔍 علامات نجاح الحل

### في السجلات (Logs):
- ✅ لا يظهر خطأ `invalid_client`
- ✅ يظهر `NextAuth: User signed in successfully`
- ✅ إعادة توجيه ناجحة إلى الصفحة الرئيسية

### في المتصفح:
- ✅ تسجيل دخول ناجح عبر Discord
- ✅ عرض اسم المستخدم في Navbar
- ✅ لا توجد رسائل خطأ

## 🚨 أخطاء شائعة

### 1. نسخ Client Secret خاطئ
- **المشكلة**: نسخ جزء من Secret أو إضافة مسافات
- **الحل**: انسخ Secret كاملاً بدون مسافات

### 2. عدم إعادة تشغيل الخادم
- **المشكلة**: الخادم لا يقرأ التغييرات الجديدة
- **الحل**: أعد تشغيل `npm run dev`

### 3. استخدام Bot Token بدلاً من Client Secret
- **المشكلة**: Bot Token مختلف عن Client Secret
- **الحل**: استخدم Client Secret من General Information

## 📞 إذا استمرت المشكلة

1. **تأكد من صحة Client ID**:
   ```
   DISCORD_CLIENT_ID=1389217214409998468
   ```

2. **تأكد من Redirect URI في Discord**:
   - يجب أن يكون مُضاف بالضبط: `http://localhost:3000/api/auth/callback/discord`

3. **تحقق من حالة التطبيق**:
   - تأكد أن التطبيق مفعل في Discord Developer Portal

---
**آخر تحديث**: تم اكتشاف أن Client Secret غير صحيح
**الحالة**: يحتاج تحديث Client Secret في ملف .env