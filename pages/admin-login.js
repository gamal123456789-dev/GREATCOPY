import { useState, useEffect } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function AdminLogin() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [adminUsers, setAdminUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      router.push('/admin');
    }
  }, [session, router]);

  const fetchAdminUsers = async () => {
    try {
      const response = await fetch('/api/test-admin-accounts');
      const data = await response.json();
      setAdminUsers(data.adminUsers || []);
    } catch (error) {
      console.error('Error fetching admin users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialLogin = async (e) => {
    e.preventDefault();
    setMessage('جاري تسجيل الدخول...');
    
    try {
      const result = await signIn('credentials', {
        email: loginForm.email,
        password: loginForm.password,
        redirect: false
      });
      
      if (result?.error) {
        setMessage('خطأ في تسجيل الدخول: ' + result.error);
      } else if (result?.ok) {
        setMessage('تم تسجيل الدخول بنجاح!');
        setTimeout(() => router.push('/admin'), 1000);
      }
    } catch (error) {
      setMessage('خطأ في تسجيل الدخول: ' + error.message);
    }
  };

  const handleDiscordLogin = () => {
    signIn('discord', { callbackUrl: '/admin' });
  };

  const handleLogout = () => {
    signOut({ callbackUrl: '/' });
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-white text-center mb-8">تسجيل دخول الإدارة</h1>
        
        {session ? (
          <div className="text-center">
            <div className="mb-4 p-4 bg-green-600 rounded-lg">
              <p className="text-white">مرحباً {session.user?.email}</p>
              <p className="text-white text-sm">الدور: {session.user?.role}</p>
            </div>
            
            {session.user?.role === 'ADMIN' ? (
              <div className="space-y-4">
                <button
                  onClick={() => router.push('/admin')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                  الذهاب إلى لوحة الإدارة
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                  تسجيل الخروج
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-red-600 rounded-lg">
                  <p className="text-white">ليس لديك صلاحيات إدارية</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                  تسجيل الخروج
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Credential Login Form */}
            <form onSubmit={handleCredentialLogin} className="space-y-4">
              <div>
                <label className="block text-white text-sm font-bold mb-2">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-white text-sm font-bold mb-2">كلمة المرور</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                تسجيل الدخول
              </button>
            </form>
            
            <div className="text-center">
              <div className="text-gray-400 mb-4">أو</div>
              <button
                onClick={handleDiscordLogin}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <i className="fab fa-discord"></i>
                تسجيل الدخول بالديسكورد
              </button>
            </div>
            
            {/* Available Admin Accounts */}
            {!loading && adminUsers.length > 0 && (
              <div className="mt-6 p-4 bg-gray-700 rounded-lg">
                <h3 className="text-white font-bold mb-2">الحسابات الإدارية المتاحة:</h3>
                <div className="space-y-2">
                  {adminUsers.map((user, index) => (
                    <div key={index} className="text-sm text-gray-300">
                      <div>البريد: {user.email}</div>
                      <div>اسم المستخدم: {user.username}</div>
                      <div>الدور: {user.role}</div>
                      <hr className="border-gray-600 my-2" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {message && (
              <div className={`p-4 rounded-lg text-center ${
                message.includes('نجاح') ? 'bg-green-600' : 'bg-red-600'
              }`}>
                <p className="text-white">{message}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}