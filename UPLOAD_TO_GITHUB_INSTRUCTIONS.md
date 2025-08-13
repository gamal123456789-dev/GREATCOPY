# تعليمات رفع المشروع إلى GitHub

## المشكلة الحالية
GitHub لا يدعم استخدام كلمة المرور العادية للمصادقة في عمليات Git. تحتاج إلى Personal Access Token.

## الحل المطلوب فوراً

### خطوات إنشاء Personal Access Token:

1. **اذهب إلى إعدادات GitHub:**
   - افتح الرابط: https://github.com/settings/tokens
   - أو اذهب إلى: Settings → Developer settings → Personal access tokens → Tokens (classic)

2. **إنشاء توكن جديد:**
   - اضغط على "Generate new token" → "Generate new token (classic)"
   - أعط التوكن اسماً مناسباً (مثل: "MainWebsite-Upload")
   - اختر مدة انتهاء الصلاحية (يُنصح بـ 90 يوماً أو أكثر)

3. **اختيار الصلاحيات المطلوبة:**
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
   - ✅ `write:packages` (إذا كنت تستخدم GitHub Packages)

4. **إنشاء التوكن:**
   - اضغط "Generate token"
   - **مهم جداً:** انسخ التوكن فوراً (سيظهر مرة واحدة فقط)
   - احفظه في مكان آمن

### استخدام التوكن:

**الطريقة الأولى - الأمر المباشر:**
```bash
# استبدل YOUR_TOKEN بالتوكن الذي حصلت عليه
git remote set-url origin https://gamal123456789-dev:YOUR_TOKEN@github.com/gamal123456789-dev/GREATCOPY.git
git push -u origin main
```

**الطريقة الثانية - استخدام السكريبت:**
```bash
./upload-to-github.sh YOUR_TOKEN
```

### بيانات الحساب المطلوبة:
- **اسم المستخدم:** gamal123456789-dev
- **البريد الإلكتروني:** gamalkhaled9123@gmail.com
- **المستودع:** https://github.com/gamal123456789-dev/GREATCOPY.git

## ملاحظات أمنية مهمة

⚠️ **لا تشارك الـ Personal Access Token مع أي شخص**  
🔒 **احفظ التوكن في مكان آمن**  
🔄 **إذا فقدت التوكن، أنشئ واحداً جديداً**  
⏰ **تحقق من تاريخ انتهاء صلاحية التوكن**

## حالة المشروع
✅ المشروع جاهز 100% للرفع  
✅ إعدادات Git محدثة بالبيانات الصحيحة  
✅ جميع الملفات محفوظة ومجهزة  
❌ يحتاج فقط Personal Access Token صحيح من GitHub