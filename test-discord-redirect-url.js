require('dotenv').config();

// اختبار URL الخاص بتسجيل الدخول بالديسكورد
function generateDiscordAuthUrl() {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const nextAuthUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const redirectUri = `${nextAuthUrl}/api/auth/callback/discord`;
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify email',
    prompt: 'consent'
  });
  
  const authUrl = `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  
  return {
    authUrl,
    redirectUri,
    clientId: clientId ? clientId.substring(0, 8) + '...' : 'غير موجود'
  };
}

console.log('🔗 اختبار URL تسجيل الدخول بالديسكورد');
console.log('=' .repeat(50));

const { authUrl, redirectUri, clientId } = generateDiscordAuthUrl();

console.log('\n📋 معلومات التكوين:');
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
console.log('DISCORD_CLIENT_ID:', clientId);
console.log('Redirect URI:', redirectUri);

console.log('\n🔗 رابط تسجيل الدخول:');
console.log(authUrl);

console.log('\n✅ خطوات التحقق من Discord Developer Portal:');
console.log('1. اذهب إلى: https://discord.com/developers/applications');
console.log('2. اختر تطبيقك');
console.log('3. اذهب إلى OAuth2 > General');
console.log('4. تأكد من وجود هذا الـ Redirect URI:');
console.log('   ', redirectUri);
console.log('5. تأكد من أن Client ID صحيح');

console.log('\n🧪 اختبار يدوي:');
console.log('1. انسخ الرابط أعلاه والصقه في المتصفح');
console.log('2. سجل دخول بحساب Discord');
console.log('3. اقبل الصلاحيات');
console.log('4. يجب أن يعيد توجيهك إلى:', redirectUri);
console.log('5. إذا ظهر خطأ "Invalid OAuth2 redirect_uri", أضف الـ URI في Discord Portal');

console.log('\n🔍 نصائح لحل المشاكل:');
console.log('- تأكد من أن الـ redirect URI مطابق تماماً (حساس للأحرف الكبيرة/الصغيرة)');
console.log('- تأكد من عدم وجود مسافات إضافية في الـ URI');
console.log('- تأكد من أن NEXTAUTH_URL لا ينتهي بـ /');
console.log('- امسح الكوكيز في المتصفح قبل المحاولة مرة أخرى');