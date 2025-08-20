# 🔧 حل مشكلة Discord OAuth - خطأ invalid_client

## 📋 المشكلة الحالية
عند محاولة تسجيل الدخول عبر Discord، يظهر الخطأ التالي:
```
https://gear-score.com/auth?callbackUrl=https%3A%2F%2Fgear-score.com%2F&error=OAuthCallback
```

## 🔍 سبب المشكلة
من سجلات الخادم:
```
[next-auth][error][OAUTH_CALLBACK_ERROR] invalid_client
```

هذا الخطأ يعني أن **Redirect URI** غير مُضاف في إعدادات Discord Developer Portal.

## ✅ الحل المطلوب

### الخطوة الوحيدة المطلوبة:

1. **اذهب إلى Discord Developer Portal**:
   - افتح: https://discord.com/developers/applications
   - سجل الدخول بحسابك

2. **اختر التطبيق الخاص بك**:
   - ابحث عن التطبيق بـ Client ID: `1389217214409998468`
   - اضغط عليه لفتحه

3. **اذهب إلى تبويب OAuth2**:
   - في القائمة الجانبية، اضغط على "OAuth2"
   - ثم اضغط على "General"

4. **أضف Redirect URIs**:
   في قسم "Redirects"، أضف هذين الرابطين:
   ```
   https://gear-score.com/api/auth/callback/discord
   http://localhost:3000/api/auth/callback/discord
   ```
   
   **مهم**: تأكد من كتابة الروابط بالضبط كما هي مكتوبة أعلاه

5. **احفظ التغييرات**:
   - اضغط على "Save Changes" في أسفل الصفحة

## 🧪 اختبار الحل

بعد إضافة Redirect URIs:

1. **اذهب إلى الموقع**: https://gear-score.com/auth
2. **اضغط على "تسجيل الدخول بـ Discord"**
3. **أكمل عملية المصادقة في Discord**
4. **يجب أن يتم تسجيل دخولك بنجاح**

## 📊 معلومات تقنية

### إعدادات Discord الحالية:
- **Client ID**: `1389217214409998468`
- **Client Secret**: `o1w_WpDqXdUYAJCBvW72VfoXPFrHdqHl` (محدث)
- **Scopes المطلوبة**: `identify email`
- **Redirect URI المطلوب**: `https://gear-score.com/api/auth/callback/discord`

### إعدادات NextAuth:
- **NEXTAUTH_URL**: `https://gear-score.com`
- **NEXTAUTH_SECRET**: مُعرَّف بشكل صحيح
- **Discord Provider**: مُكوَّن بشكل صحيح

## ❗ ملاحظات مهمة

1. **لا تغير أي شيء في الكود** - المشكلة فقط في إعدادات Discord Developer Portal
2. **تأكد من كتابة Redirect URI بالضبط** - أي خطأ إملائي سيمنع عمل OAuth
3. **قد تحتاج إلى انتظار دقائق قليلة** بعد الحفظ حتى تصبح التغييرات فعالة

## 🆘 إذا استمرت المشكلة

إذا لم يعمل الحل، تحقق من:

1. **تأكد من أن Redirect URI مُضاف بالضبط**:
   ```
   https://gear-score.com/api/auth/callback/discord
   ```

2. **تحقق من أن التطبيق مفعل** في Discord Developer Portal

3. **جرب في متصفح خاص/incognito** لتجنب مشاكل الكاش

4. **تحقق من سجلات الخادم**:
   ```bash
   pm2 logs gear-score --lines 10
   ```

---

**الحالة**: جاهز للاختبار بعد إضافة Redirect URI في Discord Developer Portal
**آخر تحديث**: 16 أغسطس 2025