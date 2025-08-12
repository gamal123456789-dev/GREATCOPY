# 🧪 دليل اختبار المصادقة - Authentication Testing Guide

## 🎯 الهدف:

اختبار جميع وظائف المصادقة (تسجيل الدخول، تسجيل الخروج، إدارة الجلسات) للتأكد من أنها تعمل بشكل صحيح.

## 🚀 كيفية الاختبار:

### 1. **افتح صفحة الاختبار:**
```
http://localhost:3000/test-auth-complete.html
```

### 2. **شغل الاختبارات التلقائية:**
الصفحة ستشغل الاختبارات تلقائياً عند التحميل.

### 3. **راجع النتائج:**
ستظهر لك 4 بطاقات حالة تعرض حالة كل جزء:
- 🟢 **Server Status**: حالة الخادم
- 🟢 **NextAuth Status**: حالة نظام المصادقة
- 🟢 **CSRF Status**: حالة حماية CSRF
- 🟢 **Session Status**: حالة الجلسة

## 📋 الاختبارات المتاحة:

### **1. Server Health Check:**
- ✅ اختبار استجابة الخادم للصفحة الرئيسية
- ✅ اختبار استجابة نقاط النهاية API

### **2. NextAuth Endpoints Test:**
- ✅ `/api/auth/providers` - مزودي المصادقة
- ✅ `/api/auth/csrf` - رمز حماية CSRF
- ✅ `/api/auth/session` - معلومات الجلسة
- ✅ `/api/auth/signout` - تسجيل الخروج

### **3. Authentication Flow Test:**
- ✅ اختبار حالة الجلسة الحالية
- ✅ اختبار مزود Discord
- ✅ اختبار مزود Credentials

### **4. Session Management Test:**
- ✅ اختبار إدارة الجلسة
- ✅ اختبار تسجيل الخروج
- ✅ اختبار مسح الجلسة

### **5. Cookie Management Test:**
- ✅ اختبار إدارة الكوكيز
- ✅ اختبار LocalStorage
- ✅ اختبار SessionStorage

## 🔍 كيفية قراءة النتائج:

### **✅ النجاح (Success):**
- Server: Online
- NextAuth: Working
- CSRF: Working
- Session: Logged In / No Session

### **⚠️ التحذير (Warning):**
- Server: Responding with errors
- Session: No Session (طبيعي إذا لم تسجل دخول)

### **❌ الخطأ (Error):**
- Server: Offline
- NextAuth: Failed
- CSRF: No Token

## 🧪 اختبار شامل:

### **اضغط على "Run Complete Diagnostic":**
سيقوم باختبار شامل لجميع الأنظمة ويعطيك تقرير مفصل.

## 🚨 إذا ظهرت أخطاء:

### **1. Server Offline:**
```bash
# تحقق من أن التطبيق يعمل
netstat -an | findstr :3000

# أعد تشغيل التطبيق
npm run dev
```

### **2. NextAuth Failed:**
```bash
# تحقق من ملف .env
Get-Content .env

# تأكد من وجود المتغيرات المطلوبة
```

### **3. CSRF No Token:**
```bash
# تحقق من NextAuth configuration
# تأكد من أن cookies تعمل بشكل صحيح
```

## 📱 اختبار في المتصفح:

### **1. افتح Developer Tools (F12):**
- اذهب إلى Console tab
- راقب الأخطاء
- اذهب إلى Application > Cookies

### **2. اختبر تسجيل الدخول:**
- اذهب إلى `http://localhost:3000/auth`
- جرب تسجيل الدخول بالديسكورد
- جرب تسجيل الدخول بالإيميل

### **3. اختبر تسجيل الخروج:**
- بعد تسجيل الدخول، اضغط على تسجيل الخروج
- تأكد من أنك تم توجيهك لصفحة تسجيل الدخول
- تحقق من حذف الكوكيز

## 🔧 إصلاح المشاكل الشائعة:

### **1. مشكلة Port Mismatch:**
```bash
# إذا كان .env يقول 5200 لكن التطبيق شغال على 3000
# غير PORT في .env إلى 3000
```

### **2. مشكلة Cookies:**
```bash
# امسح cookies المتصفح
# جرب متصفح مختلف
# تأكد من أن HTTPS يعمل إذا كنت تستخدمه
```

### **3. مشكلة NextAuth:**
```bash
# تحقق من ملف [...nextauth].ts
# تأكد من إعدادات Discord OAuth
# تحقق من environment variables
```

## 📊 النتائج المتوقعة:

بعد الاختبار الناجح:
- ✅ جميع نقاط النهاية تستجيب
- ✅ CSRF tokens يتم إنشاؤها
- ✅ الجلسات تعمل بشكل صحيح
- ✅ تسجيل الخروج يعمل
- ✅ الكوكيز يتم إدارتها بشكل صحيح

## 🆘 إذا استمرت المشكلة:

### **1. أرسل النتائج:**
- Screenshot من صفحة الاختبار
- Screenshot من Developer Tools Console
- وصف مفصل للمشكلة

### **2. تحقق من Logs:**
```bash
# في terminal التطبيق
# راقب الأخطاء عند تشغيل الاختبارات
```

---

**ملاحظة:** هذا الاختبار يساعد في تحديد المشاكل بدقة. استخدم النتائج لإصلاح أي مشاكل موجودة.
