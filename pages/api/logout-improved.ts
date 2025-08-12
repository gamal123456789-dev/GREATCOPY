// API تسجيل الخروج المحسن
// تم إعادة كتابته من الصفر لضمان البساطة والموثوقية

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';

/**
 * معالج API لتسجيل الخروج
 * يقوم بمسح جميع كوكيز الجلسة وإرجاع استجابة JSON
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // التأكد من أن الطلب POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      message: 'يُسمح فقط بطلبات POST'
    });
  }

  try {
    console.log('🚪 بدء عملية تسجيل الخروج من الخادم...');
    
    // الحصول على الجلسة الحالية
    const session = await getServerSession(req, res, authOptions);
    
    if (session) {
      console.log(`👤 تسجيل خروج المستخدم: ${session.user?.email || 'غير معروف'}`);
    }
    
    // مسح جميع كوكيز NextAuth
    const cookiesToClear = [
      'next-auth.session-token',
      'next-auth.csrf-token',
      'next-auth.callback-url',
      'next-auth.state',
      '__Secure-next-auth.session-token',
      '__Host-next-auth.csrf-token',
      '__Secure-next-auth.callback-url'
    ];
    
    // مسح الكوكيز
    cookiesToClear.forEach(cookieName => {
      res.setHeader('Set-Cookie', [
        `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`,
        `${cookieName}=; Path=/; Domain=.gear-score.com; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`,
        `${cookieName}=; Path=/; Domain=gear-score.com; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`
      ]);
    });
    
    console.log('✅ تم مسح جميع كوكيز الجلسة');
    
    // إرجاع استجابة نجاح
    return res.status(200).json({
      success: true,
      message: 'تم مسح الجلسة بنجاح. يرجى تحديث الصفحة وتسجيل الدخول مرة أخرى.',
      timestamp: new Date().toISOString(),
      clearedCookies: cookiesToClear.length
    });
    
  } catch (error) {
    console.error('❌ خطأ في تسجيل الخروج:', error);
    
    // إرجاع استجابة خطأ مع JSON
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'حدث خطأ أثناء تسجيل الخروج. يرجى المحاولة مرة أخرى.',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * إعدادات API
 */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb'
    }
  }
};