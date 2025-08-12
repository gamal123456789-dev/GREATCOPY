# حل سريع لمشكلة الدومين - gear-score.com

## المشكلة
- الموقع يعمل على `http://62.169.19.154:3000/` ✅
- الدومين `https://gear-score.com/` لا يعمل ❌

## الحل السريع

### 1. رفع الملفات للخادم
```bash
# من جهازك المحلي
scp nginx-gear-score.conf root@62.169.19.154:/var/www/gear-score/
scp ecosystem.config.js root@62.169.19.154:/var/www/gear-score/
scp .env.production root@62.169.19.154:/var/www/gear-score/
scp apply-domain-fix.sh root@62.169.19.154:/var/www/gear-score/
scp check-domain-status.sh root@62.169.19.154:/var/www/gear-score/
```

### 2. تشغيل سكريبت الإصلاح التلقائي
```bash
# اتصل بالخادم
ssh root@62.169.19.154

# انتقل لمجلد الموقع
cd /var/www/gear-score

# اجعل السكريبت قابل للتنفيذ
chmod +x apply-domain-fix.sh
chmod +x check-domain-status.sh

# شغل سكريبت الإصلاح
sudo ./apply-domain-fix.sh
```

### 3. فحص الحالة
```bash
# فحص شامل للحالة
./check-domain-status.sh

# أو فحص سريع
curl -I https://gear-score.com
```

## إذا لم يعمل الحل

### تحقق من DNS
```bash
# فحص DNS
nslookup gear-score.com

# يجب أن يظهر:
# gear-score.com has address 62.169.19.154
```

### إذا كان DNS لا يعمل:
1. اذهب لموقع مزود الدومين (Hostinger, GoDaddy, إلخ)
2. تأكد من إعدادات DNS:
   - A Record: `gear-score.com` → `62.169.19.154`
   - A Record: `www.gear-score.com` → `62.169.19.154`

### تحقق من شهادة SSL
```bash
# فحص شهادة SSL
sudo certbot certificates

# إذا كانت منتهية الصلاحية
sudo certbot renew
sudo systemctl reload nginx
```

### إذا كانت شهادة SSL غير موجودة
```bash
# إنشاء شهادة SSL جديدة
sudo certbot --nginx -d gear-score.com -d www.gear-score.com
```

## فحص سريع للمشاكل الشائعة

### 1. هل nginx يعمل؟
```bash
sudo systemctl status nginx
```

### 2. هل التطبيق يعمل على البورت 3000؟
```bash
sudo netstat -tlnp | grep :3000
```

### 3. هل PM2 يعمل؟
```bash
pm2 status
pm2 logs gear-score
```

### 4. هل الجدار الناري يسمح بالاتصالات؟
```bash
sudo ufw status
# يجب أن يسمح بالبورت 80 و 443
sudo ufw allow 80
sudo ufw allow 443
```

## اختبار نهائي

بعد تطبيق جميع الخطوات:

```bash
# اختبار محلي
curl -I http://127.0.0.1:3000

# اختبار الدومين
curl -I https://gear-score.com
curl -I http://gear-score.com  # يجب أن يعيد توجيه لـ HTTPS
```

## إذا استمرت المشكلة

1. **انتظر انتشار DNS** (قد يستغرق حتى 48 ساعة)
2. **تحقق من إعدادات الدومين** في لوحة التحكم
3. **اتصل بدعم مزود الاستضافة** إذا كانت المشكلة في DNS

## أرقام مهمة للتحقق

- ✅ IP الخادم: `62.169.19.154`
- ✅ البورت: `3000`
- ✅ الدومين: `gear-score.com`
- ✅ SSL: يجب أن يكون فعال

---

**ملاحظة:** إذا كان كل شيء يعمل محلياً على IP لكن الدومين لا يعمل، فالمشكلة غالباً في إعدادات DNS عند مزود الدومين.