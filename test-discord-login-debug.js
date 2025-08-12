const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');
require('dotenv').config();

const prisma = new PrismaClient();

async function testDiscordLoginFlow() {
  console.log('🔍 تشخيص مشكلة تسجيل الدخول بالديسكورد');
  console.log('=' .repeat(50));
  
  // 1. فحص متغيرات البيئة
  console.log('\n1️⃣ فحص متغيرات البيئة:');
  console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
  console.log('DISCORD_CLIENT_ID:', process.env.DISCORD_CLIENT_ID ? '✅ موجود' : '❌ مفقود');
  console.log('DISCORD_CLIENT_SECRET:', process.env.DISCORD_CLIENT_SECRET ? '✅ موجود' : '❌ مفقود');
  console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '✅ موجود' : '❌ مفقود');
  
  // 2. فحص اتصال قاعدة البيانات
  console.log('\n2️⃣ فحص اتصال قاعدة البيانات:');
  try {
    await prisma.$connect();
    console.log('✅ الاتصال بقاعدة البيانات ناجح');
    
    // عدد المستخدمين
    const userCount = await prisma.user.count();
    console.log(`📊 عدد المستخدمين في قاعدة البيانات: ${userCount}`);
  } catch (error) {
    console.log('❌ خطأ في الاتصال بقاعدة البيانات:', error.message);
  }
  
  // 3. فحص endpoints الخاصة بـ NextAuth
  console.log('\n3️⃣ فحص NextAuth endpoints:');
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  try {
    // فحص providers
    const providersResponse = await fetch(`${baseUrl}/api/auth/providers`);
    if (providersResponse.ok) {
      const providers = await providersResponse.json();
      console.log('✅ Providers endpoint يعمل');
      console.log('Discord Provider:', providers.discord ? '✅ موجود' : '❌ مفقود');
      if (providers.discord) {
        console.log('Discord Callback URL:', providers.discord.callbackUrl);
      }
    } else {
      console.log('❌ خطأ في providers endpoint:', providersResponse.status);
    }
  } catch (error) {
    console.log('❌ خطأ في الاتصال بـ providers endpoint:', error.message);
  }
  
  try {
    // فحص session
    const sessionResponse = await fetch(`${baseUrl}/api/auth/session`);
    if (sessionResponse.ok) {
      const session = await sessionResponse.json();
      console.log('✅ Session endpoint يعمل');
      console.log('Current Session:', session.user ? '✅ مسجل دخول' : '❌ غير مسجل دخول');
      if (session.user) {
        console.log('User Info:', {
          email: session.user.email,
          name: session.user.name,
          provider: session.user.provider || 'غير محدد'
        });
      }
    } else {
      console.log('❌ خطأ في session endpoint:', sessionResponse.status);
    }
  } catch (error) {
    console.log('❌ خطأ في الاتصال بـ session endpoint:', error.message);
  }
  
  // 4. فحص إعدادات الكوكيز
  console.log('\n4️⃣ فحص إعدادات الكوكيز:');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
  console.log('Secure Cookies:', process.env.NODE_ENV === 'production' ? 'مفعل' : 'معطل');
  
  // 5. نصائح لحل المشكلة
  console.log('\n5️⃣ نصائح لحل مشكلة تسجيل الدخول بالديسكورد:');
  console.log('\n🔧 الخطوات المطلوبة:');
  console.log('1. تأكد من إضافة Redirect URI في Discord Developer Portal:');
  console.log('   - http://localhost:3000/api/auth/callback/discord (للتطوير المحلي)');
  console.log('   - https://gear-score.com/api/auth/callback/discord (للإنتاج)');
  console.log('\n2. تأكد من أن NEXTAUTH_URL صحيح في ملف .env');
  console.log('\n3. تأكد من أن Discord Client ID و Secret صحيحين');
  console.log('\n4. امسح الكوكيز في المتصفح وحاول مرة أخرى');
  console.log('\n5. تأكد من أن الإيميل في Discord مفعل ومرئي');
  
  // 6. فحص آخر المستخدمين المسجلين
  console.log('\n6️⃣ آخر المستخدمين المسجلين:');
  try {
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
        image: true
      }
    });
    
    if (recentUsers.length > 0) {
      console.log('آخر 5 مستخدمين:');
      recentUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} - ${user.username || 'بدون اسم مستخدم'} - ${user.createdAt}`);
        console.log(`   الصورة: ${user.image ? 'موجودة (Discord)' : 'غير موجودة'}`);
      });
    } else {
      console.log('لا يوجد مستخدمين في قاعدة البيانات');
    }
  } catch (error) {
    console.log('❌ خطأ في جلب المستخدمين:', error.message);
  }
  
  await prisma.$disconnect();
  console.log('\n✅ انتهى التشخيص');
}

// تشغيل التشخيص
testDiscordLoginFlow().catch(console.error);