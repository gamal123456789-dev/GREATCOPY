const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

// محاكاة بيانات Discord OAuth
const mockDiscordProfile = {
  id: '123456789012345678',
  username: 'testuser',
  email: 'test@example.com',
  avatar: 'avatar_hash_123',
  global_name: 'Test User'
};

const mockAccount = {
  provider: 'discord',
  providerAccountId: '123456789012345678',
  type: 'oauth'
};

// محاكاة profile function من NextAuth
function mockProfileFunction(profile) {
  return {
    id: profile.id,
    name: profile.username || profile.global_name || `User${profile.id}`,
    email: profile.email,
    image: profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` : null,
    role: "user",
  };
}

// محاكاة signIn callback
async function mockSignInCallback(user, account, profile) {
  console.log('🔄 محاكاة signIn callback...');
  console.log('User data:', user);
  console.log('Account data:', account);
  
  try {
    if (account?.provider === "discord") {
      if (!user?.email || !account?.providerAccountId) {
        console.log('❌ بيانات Discord غير مكتملة');
        return false;
      }
      
      console.log('🔍 البحث عن مستخدم موجود...');
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { id: true, role: true, username: true }
      });
      
      if (existingUser) {
        console.log('✅ مستخدم موجود، تحديث البيانات...');
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            image: user.image,
            name: user.name || existingUser.username,
          },
        });
        
        user.id = existingUser.id;
        user.role = existingUser.role;
        user.username = existingUser.username || undefined;
        console.log('✅ تم تحديث المستخدم الموجود');
        return true;
      } else {
        console.log('➕ إنشاء مستخدم جديد...');
        const { v4: uuidv4 } = require('uuid');
        const newUserId = uuidv4();
        
        const newUser = await prisma.user.create({
          data: {
            id: newUserId,
            email: user.email,
            username: user.name,
            role: "user",
            emailVerified: new Date(),
            image: user.image,
          },
        });
        
        user.id = newUser.id;
        user.role = newUser.role;
        user.username = newUser.username || undefined;
        console.log('✅ تم إنشاء مستخدم جديد:', newUser.id);
        return true;
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ خطأ في signIn callback:', error);
    return false;
  }
}

// محاكاة JWT callback
async function mockJwtCallback(token, user, account) {
  console.log('🔄 محاكاة JWT callback...');
  
  // Initial sign in - store user data in token
  if (user && account) {
    token.id = user.id;
    token.email = user.email;
    token.name = user.name;
    token.username = user.username;
    token.role = user.role || "user";
    token.image = user.image;
    token.provider = account.provider;
    token.lastUpdated = Date.now();
    console.log('✅ تم إنشاء JWT token للمستخدم:', user.email);
  }
  
  // Handle account linking for Discord
  if (account?.provider === "discord") {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: token.email },
      });

      if (existingUser) {
        token.id = existingUser.id;
        token.role = existingUser.role;
        token.provider = "discord";
        
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            image: user?.image || existingUser.image,
            name: user?.name || existingUser.name,
          },
        });
        console.log('✅ تم ربط حساب Discord بالمستخدم الموجود');
      }
    } catch (error) {
      console.error('❌ خطأ في ربط Discord:', error);
    }
  }
  
  return token;
}

// محاكاة session callback
function mockSessionCallback(session, token) {
  console.log('🔄 محاكاة Session callback...');
  
  if (token) {
    session.user.id = token.id;
    session.user.role = token.role;
    session.user.username = token.username;
    session.user.provider = token.provider;
    console.log('✅ تم إنشاء session للمستخدم:', session.user.email);
  }
  
  return session;
}

async function testCompleteDiscordFlow() {
  console.log('🧪 اختبار تدفق تسجيل الدخول بالديسكورد الكامل');
  console.log('=' .repeat(60));
  
  try {
    // 1. محاكاة profile transformation
    console.log('\n1️⃣ تحويل بيانات Discord Profile:');
    const transformedUser = mockProfileFunction(mockDiscordProfile);
    console.log('Transformed user:', transformedUser);
    
    // 2. محاكاة signIn callback
    console.log('\n2️⃣ تنفيذ signIn callback:');
    const signInResult = await mockSignInCallback(transformedUser, mockAccount, mockDiscordProfile);
    console.log('SignIn result:', signInResult ? '✅ نجح' : '❌ فشل');
    
    if (!signInResult) {
      console.log('❌ فشل في signIn callback - توقف الاختبار');
      return;
    }
    
    // 3. محاكاة JWT callback
    console.log('\n3️⃣ تنفيذ JWT callback:');
    let token = {};
    token = await mockJwtCallback(token, transformedUser, mockAccount);
    console.log('JWT Token:', token);
    
    // 4. محاكاة Session callback
    console.log('\n4️⃣ تنفيذ Session callback:');
    let session = {
      user: {
        email: transformedUser.email,
        name: transformedUser.name,
        image: transformedUser.image
      }
    };
    session = mockSessionCallback(session, token);
    console.log('Final Session:', session);
    
    // 5. التحقق من قاعدة البيانات
    console.log('\n5️⃣ التحقق من قاعدة البيانات:');
    const userInDb = await prisma.user.findUnique({
      where: { email: transformedUser.email }
    });
    
    if (userInDb) {
      console.log('✅ المستخدم موجود في قاعدة البيانات:');
      console.log('- ID:', userInDb.id);
      console.log('- Email:', userInDb.email);
      console.log('- Username:', userInDb.username);
      console.log('- Role:', userInDb.role);
      console.log('- Image:', userInDb.image ? 'موجودة' : 'غير موجودة');
      console.log('- Email Verified:', userInDb.emailVerified ? 'مفعل' : 'غير مفعل');
    } else {
      console.log('❌ المستخدم غير موجود في قاعدة البيانات');
    }
    
    console.log('\n✅ انتهى الاختبار بنجاح');
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// تشغيل الاختبار
testCompleteDiscordFlow().catch(console.error);