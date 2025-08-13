#!/bin/bash

# Script لرفع المشروع إلى GitHub
# الاستخدام: ./upload-to-github.sh YOUR_GITHUB_TOKEN

if [ -z "$1" ]; then
    echo "❌ خطأ: يجب تمرير GitHub Personal Access Token"
    echo "الاستخدام: ./upload-to-github.sh YOUR_GITHUB_TOKEN"
    echo ""
    echo "للحصول على Token:"
    echo "1. اذهب إلى: https://github.com/settings/tokens"
    echo "2. اضغط 'Generate new token (classic)'"
    echo "3. اختر صلاحيات 'repo' و 'workflow'"
    echo "4. انسخ الـ Token واستخدمه هنا"
    exit 1
fi

TOKEN=$1
REPO_URL="https://gamal123456789-dev:${TOKEN}@github.com/gamal123456789-dev/GREATCOPY.git"

echo "🚀 بدء رفع المشروع إلى GitHub..."
echo ""

# تحديث remote URL
echo "📡 تحديث remote URL..."
git remote set-url origin "$REPO_URL"

if [ $? -eq 0 ]; then
    echo "✅ تم تحديث remote URL بنجاح"
else
    echo "❌ فشل في تحديث remote URL"
    exit 1
fi

# رفع المشروع
echo "📤 رفع المشروع..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 تم رفع المشروع بنجاح!"
    echo "🔗 الريبو متاح على: https://github.com/gamal123456789-dev/GREATCOPY"
    echo ""
    echo "📋 ملخص ما تم رفعه:"
    echo "   - موقع gear-score.com كاملاً"
    echo "   - إعدادات Nginx المحسنة"
    echo "   - إصلاحات Rate Limiting"
    echo "   - جميع ملفات التوثيق والإعداد"
else
    echo "❌ فشل في رفع المشروع"
    echo "تأكد من:"
    echo "1. صحة الـ Token"
    echo "2. وجود صلاحيات كافية"
    echo "3. وجود الريبو على GitHub"
    exit 1
fi