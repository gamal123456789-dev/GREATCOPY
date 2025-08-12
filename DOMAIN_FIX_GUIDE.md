# دليل إصلاح مشكلة الدومين - Domain Fix Guide

## المشكلة
الموقع يعمل على `http://62.169.19.154:3000/` لكن الدومين `https://gear-score.com/` لا يعمل.

## السبب
كان هناك عدم تطابق في إعدادات البورت بين nginx وإعدادات PM2.

## الحلول المطبقة

### 1. تصحيح إعدادات nginx
- تم تغيير البورت في `nginx-gear-score.conf` من `5200` إلى `3000`
- الآن nginx يوجه الطلبات إلى `127.0.0.1:3000`

### 2. تصحيح إعدادات PM2
- تم تحديث `ecosystem.config.js` لاستخدام البورت `3000`
- تم ضبط متغيرات البيئة للإنتاج

### 3. إنشاء ملف البيئة للإنتاج
- تم إنشاء `.env.production` مع الإعدادات الصحيحة للدومين

## خطوات التطبيق على VPS

### 1. رفع الملفات المحدثة
```bash
# رفع ملفات الإعدادات المحدثة
scp nginx-gear-score.conf root@62.169.19.154:/etc/nginx/sites-available/gear-score.com
scp ecosystem.config.js root@62.169.19.154:/var/www/gear-score/
scp .env.production root@62.169.19.154:/var/www/gear-score/.env
```

### 2. إعادة تشغيل nginx
```bash
ssh root@62.169.19.154
sudo nginx -t  # فحص الإعدادات
sudo systemctl reload nginx
```

### 3. إعادة تشغيل التطبيق
```bash
cd /var/www/gear-score
pm2 reload ecosystem.config.js --env production
```

### 4. فحص الحالة
```bash
# فحص حالة nginx
sudo systemctl status nginx

# فحص حالة PM2
pm2 status
pm2 logs gear-score

# فحص البورت
sudo netstat -tlnp | grep :3000
```

## التحقق من الحل

### 1. فحص الاتصال المحلي
```bash
curl -I http://127.0.0.1:3000
```

### 2. فحص الدومين
```bash
curl -I https://gear-score.com
```

### 3. فحص شهادة SSL
```bash
ssl-cert-check -c /etc/letsencrypt/live/gear-score.com/fullchain.pem
```

## مشاكل محتملة وحلولها

### 1. إذا كانت شهادة SSL منتهية الصلاحية
```bash
sudo certbot renew
sudo systemctl reload nginx
```

### 2. إذا كان البورت 3000 مشغول
```bash
sudo lsof -i :3000
# قم بإيقاف العملية المتضاربة أو غير البورت
```

### 3. إذا كان DNS لا يشير للخادم
```bash
nslookup gear-score.com
# تأكد من أن A record يشير إلى 62.169.19.154
```

## ملاحظات مهمة

1. **تأكد من أن الدومين يشير للخادم الصحيح**
   - A record: gear-score.com → 62.169.19.154
   - A record: www.gear-score.com → 62.169.19.154

2. **تأكد من أن شهادة SSL صالحة**
   - يجب أن تكون شهادة Let's Encrypt محدثة

3. **تأكد من إعدادات الجدار الناري**
   ```bash
   sudo ufw status
   sudo ufw allow 80
   sudo ufw allow 443
   ```

4. **مراقبة السجلات**
   ```bash
   # سجلات nginx
   sudo tail -f /var/log/nginx/error.log
   
   # سجلات التطبيق
   pm2 logs gear-score --lines 50
   ```

## اختبار نهائي

بعد تطبيق جميع الخطوات، يجب أن يعمل الموقع على:
- ✅ `https://gear-score.com`
- ✅ `https://www.gear-score.com`
- ✅ `http://gear-score.com` (يتم إعادة توجيهه إلى HTTPS)
- ✅ `http://www.gear-score.com` (يتم إعادة توجيهه إلى HTTPS)