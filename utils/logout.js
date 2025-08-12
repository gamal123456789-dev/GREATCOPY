// منطق تسجيل الخروج البسيط والفعال
// تم إعادة كتابته من الصفر لضمان الموثوقية

import { signOut } from 'next-auth/react';

/**
 * تسجيل خروج شامل وموثوق
 * @param {Object} session - جلسة المستخدم الحالية
 * @param {Function} setUser - دالة تحديث حالة المستخدم
 */
export const performLogout = async (session, setUser) => {
  console.log('🚪 بدء عملية تسجيل الخروج...');
  
  try {
    // الخطوة 1: مسح التخزين المحلي فوراً
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      console.log('✅ تم مسح التخزين المحلي');
    }
    
    // الخطوة 2: مسح حالة المستخدم
    if (setUser && typeof setUser === 'function') {
      setUser(null);
      console.log('✅ تم مسح حالة المستخدم');
    }
    
    // الخطوة 3: استدعاء API تسجيل الخروج
    try {
      const response = await fetch('/api/logout-improved', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ تم تسجيل الخروج من الخادم:', data.message);
      } else {
        console.warn('⚠️ فشل تسجيل الخروج من الخادم، المتابعة...');
      }
    } catch (apiError) {
      console.warn('⚠️ خطأ في استدعاء API:', apiError.message);
    }
    
    // الخطوة 4: تسجيل خروج NextAuth (إذا كانت هناك جلسة)
    if (session?.user) {
      console.log('🔄 تسجيل خروج NextAuth...');
      await signOut({
        callbackUrl: 'https://gear-score.com/auth',
        redirect: false
      });
      console.log('✅ تم تسجيل خروج NextAuth');
    }
    
    // الخطوة 5: إعادة التوجيه القسري
    if (typeof window !== 'undefined') {
      console.log('🔄 إعادة التوجيه لصفحة تسجيل الدخول...');
      window.location.href = 'https://gear-score.com/auth';
    }
    
  } catch (error) {
    console.error('❌ خطأ في عملية تسجيل الخروج:', error);
    
    // في حالة الخطأ، قم بإعادة التوجيه على أي حال
    if (typeof window !== 'undefined') {
      console.log('🔄 إعادة توجيه طارئة...');
      window.location.href = 'https://gear-score.com/auth';
    }
  }
};

/**
 * تسجيل خروج سريع بدون معاملات
 * للاستخدام في الحالات البسيطة
 */
export const quickLogout = async () => {
  console.log('⚡ تسجيل خروج سريع...');
  
  // مسح التخزين
  if (typeof window !== 'undefined') {
    localStorage.clear();
    sessionStorage.clear();
  }
  
  // استدعاء API
  try {
    await fetch('/api/logout-improved', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.warn('⚠️ خطأ في API:', error.message);
  }
  
  // تسجيل خروج NextAuth
  try {
    await signOut({ redirect: false });
  } catch (error) {
    console.warn('⚠️ خطأ في NextAuth:', error.message);
  }
  
  // إعادة التوجيه
  if (typeof window !== 'undefined') {
    window.location.href = 'https://gear-score.com/auth';
  }
};

// تصدير افتراضي
export default { performLogout, quickLogout };