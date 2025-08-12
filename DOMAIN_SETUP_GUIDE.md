# دليل إعداد الدومين gear-score.com

## المتطلبات الأساسية

1. **خادم VPS** مع عنوان IP ثابت
2. **دومين gear-score.com** مسجل ومُعد للاستخدام
3. **صلاحيات الجذر (root)** على الخادم

## خطوات الإعداد

### 1. إعداد DNS للدومين

قم بتوجيه الدومين إلى عنوان IP الخادم:

```
A Record: gear-score.com → [عنوان IP الخادم]
A Record: www.gear-score.com → [عنوان IP الخادم]
```

### 2. تشغيل سكريبت الإعداد

```bash
sudo /root/MainWebsite/setup-domain.sh
```

هذا السكريبت سيقوم بـ:
- تثبيت Nginx و Certbot
- إعداد جدار الحماية
- نسخ إعدادات Nginx
- الحصول على شهادة SSL
- إنشاء خدمة systemd

### 3. بدء تشغيل التطبيق

```bash
# بدء الخدمة
sudo systemctl start gear-score

# تفعيل البدء التلقائي
sudo systemctl enable gear-score

# فحص حالة الخدمة
sudo systemctl status gear-score
```

### 4. مراقبة السجلات

```bash
# سجلات التطبيق
sudo journalctl -u gear-score -f

# سجلات Nginx
sudo tail -f /var/log/nginx/gear-score.access.log
sudo tail -f /var/log/nginx/gear-score.error.log
```

## الإعدادات الحالية

### متغيرات البيئة (.env)
- `NEXTAUTH_URL`: https://gear-score.com
- `NEXT_PUBLIC_BASE_URL`: https://gear-score.com
- `APP_URL`: https://gear-score.com

### إعدادات الخادم
- **المنفذ**: 3002
- **البروتوكول**: HTTPS مع شهادة SSL
- **Nginx**: يعمل كـ reverse proxy

### الأمان
- شهادة SSL من Let's Encrypt
- تجديد تلقائي للشهادة
- جدار حماية UFW
- رؤوس الأمان في Nginx
- تحديد معدل الطلبات (Rate Limiting)

## استكشاف الأخطاء

### مشكلة: الموقع لا يعمل
1. تحقق من حالة الخدمة: `systemctl status gear-score`
2. تحقق من سجلات التطبيق: `journalctl -u gear-score -f`
3. تحقق من إعدادات Nginx: `nginx -t`

### مشكلة: شهادة SSL لا تعمل
1. تحقق من DNS: `dig gear-score.com`
2. جدد الشهادة: `certbot renew --dry-run`
3. أعد تشغيل Nginx: `systemctl restart nginx`

### مشكلة: Socket.IO لا يعمل
1. تحقق من إعدادات CORS في server.js
2. تحقق من إعدادات WebSocket في Nginx
3. تحقق من جدار الحماية: `ufw status`

## الأوامر المفيدة

```bash
# إعادة تشغيل جميع الخدمات
sudo systemctl restart gear-score nginx

# فحص حالة جميع الخدمات
sudo systemctl status gear-score nginx

# تحديث الشهادة يدوياً
sudo certbot renew

# فحص إعدادات Nginx
sudo nginx -t

# إعادة تحميل إعدادات Nginx
sudo nginx -s reload
```

## ملاحظات مهمة

1. **النسخ الاحتياطي**: قم بعمل نسخة احتياطية من قاعدة البيانات والملفات بانتظام
2. **التحديثات**: راقب تحديثات الأمان للنظام والتطبيق
3. **المراقبة**: استخدم أدوات مراقبة لتتبع أداء الموقع
4. **السجلات**: راجع السجلات بانتظام للتأكد من عدم وجود أخطاء

## الدعم

في حالة وجود مشاكل:
1. راجع السجلات أولاً
2. تحقق من إعدادات DNS
3. تأكد من أن جميع الخدمات تعمل
4. راجع هذا الدليل للحلول الشائعة