#!/bin/bash

# GitHub Upload Script for MainWebsite
# This script uploads the project to GitHub using Personal Access Token (PAT)

if [ -z "$1" ]; then
    echo "❌ خطأ: تحتاج إلى Personal Access Token من GitHub!"
    echo ""
    echo "📋 كيفية الحصول على Personal Access Token:"
    echo "1. اذهب إلى: https://github.com/settings/tokens"
    echo "2. اضغط 'Generate new token' → 'Generate new token (classic)'"
    echo "3. أعط التوكن اسماً (مثل: 'MainWebsite-Upload')"
    echo "4. اختر الصلاحيات: 'repo' و 'workflow'"
    echo "5. اضغط 'Generate token'"
    echo "6. انسخ التوكن (سيظهر مرة واحدة فقط!)"
    echo ""
    echo "🚀 الاستخدام: ./upload-to-github.sh YOUR_TOKEN_HERE"
    echo ""
    echo "مثال: ./upload-to-github.sh ghp_xxxxxxxxxxxxxxxxxxxx"
    echo ""
    echo "📧 البريد الإلكتروني المستخدم: gamalkhaled9123@gmail.com"
    echo "👤 اسم المستخدم: gamal123456789-dev"
    echo "📁 المستودع: https://github.com/gamal123456789-dev/GREATCOPY.git"
    exit 1
fi

TOKEN=$1
USERNAME="gamal123456789-dev"
REPO="GREATCOPY"

echo "🔄 تحديث عنوان URL البعيد باستخدام Personal Access Token..."
git remote set-url origin https://${USERNAME}:${TOKEN}@github.com/${USERNAME}/${REPO}.git

echo "📤 رفع المشروع إلى GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo "✅ تم رفع المشروع بنجاح إلى GitHub!"
    echo "🌐 رابط المستودع: https://github.com/${USERNAME}/${REPO}"
    echo "📊 يمكنك الآن زيارة المستودع ومشاهدة جميع الملفات"
else
    echo "❌ فشل في رفع المشروع. تحقق من التوكن وحاول مرة أخرى."
    echo "💡 تأكد من أن التوكن يحتوي على صلاحيات 'repo' و 'workflow'."
    echo "🔗 للحصول على توكن جديد: https://github.com/settings/tokens"
fi