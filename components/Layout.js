import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useUser } from '../context/UserContext';
import { useEffect, useState, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { OrdersProvider } from '../context/OrdersContext';
import { useSocket } from '../hooks/useSocket';
import { useAudioManager } from '../hooks/useAudioManager';
import NotificationCenter from './NotificationCenter';
import NotificationSystem from './NotificationSystem';
import ErrorBoundary from './ErrorBoundary';
import ToastProvider from './Toast';
import { setupGlobalErrorHandling } from '../lib/clientErrorHandler';

export default function Layout({ children }) {
  const { user, setUser } = useUser();
  const { data: session } = useSession();
  const router = useRouter();
  const { playChatSound, playNotificationSound, enableAudio } = useAudioManager();

  // === Dropdown State and Ref ===
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if ((user || session?.user) && router.pathname === '/auth') {
      router.replace('/');
    }
  }, [user, session, router.pathname]);

  // Close dropdown if clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    sessionStorage.removeItem('loggedOut');
    setUser(null);
    if (session?.user) {
      signOut({ callbackUrl: 'https://gear-score.com/auth' });
    } else {
      window.location.href = 'https://gear-score.com/auth';
    }
  };

  const firstName =
    user?.username?.trim() ||
    user?.email?.split('@')[0] ||
    session?.user?.name ||
    session?.user?.email?.split('@')[0] ||
    'User';

  // Global audio notification system

  useEffect(() => {
    // Request notification permission on app load
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    console.log('🔊 Layout: Audio system will be managed by useAudioManager hook');
    
    // Test function to verify sound works (for debugging)
    window.testChatSound = () => {
      console.log('🧪 Testing chat sound manually');
      if (window.playChatSound) {
        window.playChatSound().catch(error => {
          console.error('❌ Test chat sound failed:', error);
        });
      } else {
        console.warn('⚠️ playChatSound not available on window object yet');
      }
    };
  }, [playChatSound, playNotificationSound, enableAudio]);

  // Audio will be automatically enabled by useAudioManager on user interaction
  useEffect(() => {
    if (user || session?.user) {
      console.log('🔑 User logged in - audio system ready for notifications');
    }
  }, [user, session?.user]);

  // Initialize socket connection for global notifications
  const { sentMessages, clearSentMessages } = useSocket();

  // console.log('session:', session);
  // console.log('user:', user);



  return (
    <OrdersProvider>
      <Head>
        <title>Gearscore</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="UTF-8" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <nav className="navbar-modern sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center px-6 py-4">
          <Link href="/" className="navbar-logo text-3xl font-bold tracking-wide flex items-center gap-2">
            <i className="fas fa-cog text-white text-4xl"></i>
            <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-transparent bg-clip-text">Gearscore</span>
          </Link>
          <div className="hidden md:flex items-center space-x-6 navbar-links text-gray-300 text-lg">
            <Link href="/" className="navbar-link">Home</Link>
            <Link href="/games" className="navbar-link">Games</Link>
            <Link href="/how-it-works" className="navbar-link">How It Works</Link>
            <Link href="/faq" className="navbar-link">FAQ</Link>
            <Link href="/contact" className="navbar-link">Contact Us</Link>
            {/* Notification Center */}
            <NotificationCenter className="mr-2" />
            
            {/* Messages Icon - Always visible */}
            <div className="relative">
              <Link href="/orders" className="message-icon-button flex items-center" onClick={clearSentMessages}>
                <i className="fas fa-paper-plane text-2xl text-gray-300 hover:text-white transition-colors"></i>
                {sentMessages > 0 && (
                  <span className="message-counter absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {sentMessages > 99 ? '99+' : sentMessages}
                  </span>
                )}
              </Link>
            </div>
            {(user || session?.user) ? (
              <div className="relative flex items-center space-x-4">
                <div className="relative" ref={menuRef}>
                  <button
                    className="user-menu-button flex items-center gap-2"
                    onClick={() => setMenuOpen(open => !open)}
                  >
                    <i className="fas fa-user-circle text-2xl"></i>
                    <span className="text-white font-semibold">Hi, {firstName}</span>
                  </button>
                  {/* Dropdown */}
                  <div
                    className={`user-menu-dropdown absolute right-0 mt-3 transition-all duration-200 origin-top bg-gray-800 rounded-md shadow-lg border border-gray-700 w-48 z-50 ${
                      menuOpen ? 'scale-y-100 opacity-100 pointer-events-auto' : 'scale-y-0 opacity-0 pointer-events-none'
                    }`}
                    style={{ transformOrigin: 'top' }}
                  >
                    <Link href="/profile" className="user-menu-item">Profile</Link>
                    <Link href="/orders" className="user-menu-item">My Orders</Link>
                    {(user?.role === 'ADMIN' || session?.user?.role === 'ADMIN') && (
                      <Link href="/admin" className="user-menu-item">Admin</Link>
                    )}
                    <button
                      className="user-menu-item user-menu-logout text-red-500 hover:bg-gray-700 hover:text-red-400"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : router.pathname !== '/auth' ? (
              <Link href="/auth" className="navbar-link">Login / Register</Link>
            ) : null}
          </div>
        </div>
      </nav>

      <main>{children}</main>

      {/* Notification System for Audio Alerts */}
      <NotificationSystem showToasts={false} />

      <style jsx global>{`
        .navbar-modern {
          background: linear-gradient(to right, #1a202c, #0d1117);
          border-bottom: 1px solid #2d3748;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
          padding: 1rem 2rem;
        }
        .navbar-logo {
          font-size: 2.5rem;
          font-weight: 800;
          background: linear-gradient(to right, #6366f1, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          display: flex;
          align-items: center;
          text-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
          transition: transform 0.3s ease-in-out;
        }
        .navbar-logo:hover {
          transform: scale(1.02);
        }
        .navbar-links .navbar-link {
          color: #cbd5e0;
          font-weight: 600;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          transition: all 0.3s ease-in-out;
          position: relative;
          overflow: hidden;
        }
        .navbar-links .navbar-link::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: linear-gradient(to right, #6366f1, #a78bfa);
          transform: scaleX(0);
          transform-origin: bottom right;
          transition: transform 0.3s ease-out;
        }
        .navbar-links .navbar-link:hover::before {
          transform: scaleX(1);
          transform-origin: bottom left;
        }
        .navbar-links .navbar-link:hover {
          color: #ffffff;
          text-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
        }
        .user-menu-button {
          color: white;
          font-weight: 600;
          transition: color 0.2s ease-in-out;
        }
        .user-menu-button:hover {
          color: #a78bfa;
        }
        .user-menu-dropdown {
          position: absolute;
          right: 0;
          margin-top: 0.75rem;
          width: 12rem;
          background-color: #1a202c;
          border-radius: 0.5rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
          z-index: 50;
          border: 1px solid #2d3748;
          transform: scaleY(0);
          opacity: 0;
          pointer-events: none;
        }
        .scale-y-100 {
          transform: scaleY(1) !important;
          opacity: 1 !important;
          pointer-events: auto !important;
        }
        .user-menu-item {
          display: block;
          width: 100%;
          text-align: left;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          color: #cbd5e0;
          transition: background-color 0.2s ease, color 0.2s ease;
        }
        .user-menu-item:hover {
          background-color: #2d3748;
          color: white;
        }
        .user-menu-logout {
          color: #f87171;
        }
        .user-menu-logout:hover {
          color: #ef4444;
          background-color: #2d3748;
        }
        .message-icon-button {
          position: relative;
          padding: 0.5rem;
          border-radius: 0.5rem;
          transition: all 0.3s ease;
        }
        .message-icon-button:hover {
          background-color: rgba(255, 255, 255, 0.1);
          transform: scale(1.05);
        }
        .message-counter {
          animation: pulse 2s infinite;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        }
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
      `}</style>
    </OrdersProvider>
  );
}

// تصدير مكونات Layout إضافية مع معالجة الأخطاء
export function LayoutWithErrorHandling({ children }) {
  // إعداد معالجة الأخطاء العامة
  useEffect(() => {
    setupGlobalErrorHandling();
  }, []);

  return (
    <ErrorBoundary componentName="MainLayout">
      <ToastProvider>
        <Layout>{children}</Layout>
      </ToastProvider>
    </ErrorBoundary>
  );
}