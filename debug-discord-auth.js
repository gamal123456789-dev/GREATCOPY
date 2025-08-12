// ملف تشخيص شامل لمشكلة تسجيل الدخول بالديسكورد
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugDiscordAuth() {
  console.log('🔍 تشخيص شامل لمشكلة تسجيل الدخول بالديسكورد');
  console.log('=' .repeat(60));
  
  // 1. فحص متغيرات البيئة
  console.log('\n1️⃣ فحص متغيرات البيئة:');
  const requiredEnvVars = {
    'NEXTAUTH_URL': process.env.NEXTAUTH_URL,
    'NEXTAUTH_SECRET': process.env.NEXTAUTH_SECRET ? '✅ موجود' : '❌ مفقود',
    'DISCORD_CLIENT_ID': process.env.DISCORD_CLIENT_ID ? '✅ موجود' : '❌ مفقود',
    'DISCORD_CLIENT_SECRET': process.env.DISCORD_CLIENT_SECRET ? '✅ موجود' : '❌ مفقود',
    'NODE_ENV': process.env.NODE_ENV || 'development'
  };
  
  Object.entries(requiredEnvVars).forEach(([key, value]) => {
    console.log(`${key}: ${value}`);
  });
  
  // 2. فحص قاعدة البيانات
  console.log('\n2️⃣ فحص قاعدة البيانات:');
  try {
    await prisma.$connect();
    console.log('✅ الاتصال بقاعدة البيانات ناجح');
    
    const userCount = await prisma.user.count();
    console.log(`📊 عدد المستخدمين: ${userCount}`);
    
    if (userCount > 0) {
      const recentUsers = await prisma.user.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        select: {
          email: true,
          username: true,
          image: true,
          createdAt: true
        }
      });
      
      console.log('آخر المستخدمين:');
      recentUsers.forEach((user, index) => {
        const hasDiscordImage = user.image && user.image.includes('discord');
        console.log(`  ${index + 1}. ${user.email} - ${hasDiscordImage ? '🎮 Discord' : '👤 عادي'}`);
      });
    }
  } catch (error) {
    console.log('❌ خطأ في قاعدة البيانات:', error.message);
  }
  
  // 3. إنشاء رابط تسجيل الدخول
  console.log('\n3️⃣ رابط تسجيل الدخول بالديسكورد:');
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/callback/discord`;
  
  if (clientId) {
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify+email&prompt=consent`;
    console.log('🔗 الرابط:', authUrl);
    console.log('📍 Redirect URI:', redirectUri);
  } else {
    console.log('❌ DISCORD_CLIENT_ID غير موجود');
  }
  
  // 4. نصائح لحل المشكلة
  console.log('\n4️⃣ خطوات حل المشكلة:');
  console.log('\n🔧 في Discord Developer Portal:');
  console.log('1. اذهب إلى: https://discord.com/developers/applications');
  console.log(`2. اختر التطبيق بـ Client ID: ${process.env.DISCORD_CLIENT_ID || 'غير موجود'}`);
  console.log('3. اذهب إلى OAuth2 > General');
  console.log('4. أضف هذه الـ Redirect URIs:');
  console.log(`   - ${redirectUri}`);
  console.log('   - https://gear-score.com/api/auth/callback/discord (للإنتاج)');
  
  console.log('\n🔧 في الكود:');
  console.log('1. تأكد من أن debug: true في NextAuth config');
  console.log('2. تحقق من سجلات الخادم أثناء تسجيل الدخول');
  console.log('3. امسح الكوكيز في المتصفح');
  
  console.log('\n🔧 اختبار يدوي:');
  console.log('1. افتح المتصفح واذهب إلى: http://localhost:3000/auth');
  console.log('2. اضغط على "تسجيل الدخول بالديسكورد"');
  console.log('3. راقب سجلات الخادم للأخطاء');
  console.log('4. تحقق من أن الـ callback يتم استدعاؤه');
  
  // 5. إنشاء ملف تمكين debug
  console.log('\n5️⃣ تمكين وضع التشخيص:');
  const debugConfig = `
// أضف هذا إلى [...nextauth].ts لتمكين debug mode
export const authOptions: AuthOptions = {
  // ... باقي الإعدادات
  debug: true, // تمكين وضع التشخيص
  logger: {
    error(code, metadata) {
      console.error('❌ NextAuth Error:', code, metadata);
    },
    warn(code) {
      console.warn('⚠️ NextAuth Warning:', code);
    },
    debug(code, metadata) {
      console.log('🔍 NextAuth Debug:', code, metadata);
    },
  },
};
`;
  
  console.log('تم إنشاء إعدادات debug - راجع الكود أعلاه');
  
  await prisma.$disconnect();
  console.log('\n✅ انتهى التشخيص');
}

// تشغيل التشخيص
debugDiscordAuth().catch(console.error);