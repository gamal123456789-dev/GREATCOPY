import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import { useUser } from '../context/UserContext';
import { useSocket } from '../hooks/useSocket';
import NotificationCenter from './NotificationCenter';
import { performLogout } from '../utils/logout';

export default function Navbar() {
  const router = useRouter();
  const { data: session } = useSession();
  const { user, setUser } = useUser();
  const { notifications, isConnected, unreadMessagesCount } = useSocket();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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

  const handleLogout = async () => {
    try {
      console.log('🚪 Navbar logout initiated...');
      await performLogout(session, setUser);
    } catch (error) {
      console.error('❌ Navbar logout error:', error);
      // Fallback to simple signOut if comprehensive logout fails
      await signOut({ callbackUrl: 'https://gear-score.com/auth?mode=login' });
    }
  };

  const firstName = session?.user?.name || user?.username || session?.user?.email?.split('@')[0] || user?.email?.split('@')[0] || 'User';



  return (
    <nav className="navbar-modern sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center px-6 py-4">
        <Link href="/" className="navbar-logo text-3xl font-bold tracking-wide flex items-center gap-3">
          <div className="logo-icon-wrapper">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="logo-text">⚡ GearScore</span>
        </Link>
        <div className="hidden md:flex items-center space-x-8 navbar-links text-gray-300 text-lg">
          <Link href="/" className="navbar-link">🏠 Home</Link>
          <Link href="/games" className="navbar-link">🎮 Games</Link>
          <Link href="/#services" className="navbar-link">⚙️ Services</Link>
          <Link href="/how-it-works" className="navbar-link">🔧 How It Works</Link>
          <Link href="/faq" className="navbar-link">❓ FAQ</Link>
          <Link href="/contact" className="navbar-link">📞 Contact</Link>
          {(session?.user || user) ? (
            <div className="relative flex items-center space-x-4">
              {/* Notification Center - Only show on orders page */}
              {router.pathname === '/orders' && <NotificationCenter className="mr-2" />}
              
              {/* Notification Bell */}
              <button
                onClick={() => {
                  // Play notification sound when clicking the bell
                  if (typeof window !== 'undefined' && window.playNotificationSound) {
                    window.playNotificationSound();
                  }
                }}
                className="notification-bell flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 hover:bg-gray-700/50 relative"
                title="Notifications"
              >
                <svg className="w-6 h-6 text-gray-300 hover:text-white transition-colors" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
                {notifications.length > 0 && (
                  <span className="notification-badge absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
                    {notifications.length > 99 ? '99+' : notifications.length}
                  </span>
                )}
              </button>
              
              {/* Messages Button */}
              <Link href="/orders" className="relative">
                <button
                  onClick={() => {
                    // Play notification sound when clicking the messages button
                    if (typeof window !== 'undefined' && window.playNotificationSound) {
                      window.playNotificationSound();
                    }
                  }}
                  className="messages-button flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 hover:bg-gray-700/50"
                >
                  <svg className="w-6 h-6 text-gray-300 hover:text-white transition-colors" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  {unreadMessagesCount > 0 && (
                    <span className="unread-badge absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
                      {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                    </span>
                  )}
                </button>
              </Link>
              
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="user-menu-button flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 hover:bg-gray-700/50"
                >
                  <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                  </svg>
                  <span className="text-white font-semibold">Hi, {firstName}</span>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <div
                  className={`user-menu-dropdown absolute right-0 mt-3 w-48 ${menuOpen ? 'scale-y-100 opacity-100 pointer-events-auto' : 'scale-y-0 opacity-0 pointer-events-none'}`}
                >
                  <Link href="/profile" className="user-menu-item">Profile</Link>
                  <Link href="/orders" className="user-menu-item">My Orders</Link>
                  {(session?.user?.role === 'ADMIN' || user?.role === 'ADMIN') && (
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
          ) : (
            <Link href="/auth?mode=login" className="navbar-link">Login / Register</Link>
          )}
        </div>
      </div>

      <style jsx>{`
        .navbar-modern {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #1d4ed8 50%, #2563eb 75%, #3b82f6 100%);
          backdrop-filter: blur(20px);
          border-bottom: 2px solid;
          border-image: linear-gradient(90deg, #1d4ed8, #2563eb, #3b82f6, #60a5fa) 1;
          box-shadow: 0 8px 32px rgba(29, 78, 216, 0.3), 0 4px 16px rgba(0, 0, 0, 0.2);
          padding: 1rem 2rem;
          position: relative;
          overflow: hidden;
        }
        .navbar-modern::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, rgba(255, 255, 255, 0.05) 0%, rgba(147, 197, 253, 0.02) 100%);
        }
        .logo-icon-wrapper {
          background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%);
          border-radius: 12px;
          padding: 8px;
          box-shadow: 0 4px 15px rgba(29, 78, 216, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2);
          position: relative;
          overflow: hidden;
        }
        .logo-icon-wrapper::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
        }
        .logo-text {
          background: linear-gradient(135deg, #ffffff 0%, #dbeafe 25%, #bfdbfe 50%, #93c5fd 75%, #3b82f6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 800;
          text-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
        }
        .navbar-logo {
          font-size: 2.5rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          transition: all 0.3s ease;
          position: relative;
          z-index: 1;
        }
        .navbar-logo:hover {
          transform: scale(1.05) translateY(-2px);
        }
        .navbar-logo:hover .logo-icon-wrapper {
          box-shadow: 0 8px 25px rgba(29, 78, 216, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }
        .navbar-links .navbar-link {
          color: #dbeafe;
          font-weight: 600;
          padding: 0.75rem 1.25rem;
          border-radius: 12px;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
          background: rgba(59, 130, 246, 0.05);
          border: 1px solid rgba(59, 130, 246, 0.1);
        }
        .navbar-links .navbar-link::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(29, 78, 216, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .navbar-links .navbar-link::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background: linear-gradient(90deg, #1d4ed8, #2563eb, #3b82f6);
          transform: scaleX(0);
          transform-origin: bottom right;
          transition: transform 0.3s ease-out;
        }
        .navbar-links .navbar-link:hover::before {
          opacity: 1;
        }
        .navbar-links .navbar-link:hover::after {
          transform: scaleX(1);
          transform-origin: bottom left;
        }
        .navbar-links .navbar-link:hover {
          color: #ffffff;
          text-shadow: 0 0 15px rgba(59, 130, 246, 0.6);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(29, 78, 216, 0.3);
          border-color: rgba(59, 130, 246, 0.3);
        }
        .user-menu-button {
          color: white;
          font-weight: 600;
          transition: all 0.3s ease;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 12px;
          padding: 0.75rem 1rem;
        }
        .user-menu-button:hover {
          color: #93c5fd;
          background: rgba(59, 130, 246, 0.2);
          border-color: rgba(59, 130, 246, 0.4);
          box-shadow: 0 4px 15px rgba(29, 78, 216, 0.3);
          transform: translateY(-1px);
        }
        .user-menu-dropdown {
          position: absolute;
          right: 0;
          margin-top: 0.75rem;
          width: 14rem;
          background: linear-gradient(135deg, rgba(10, 22, 40, 0.95) 0%, rgba(30, 58, 138, 0.95) 100%);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(29, 78, 216, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.2);
          z-index: 50;
          border: 1px solid rgba(59, 130, 246, 0.3);
          transform: scaleY(0);
          opacity: 0;
          pointer-events: none;
          transition: all 0.3s ease;
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
          padding: 1rem 1.25rem;
          font-size: 0.9rem;
          color: #dbeafe;
          transition: all 0.3s ease;
          border-radius: 8px;
          margin: 0.25rem;
          position: relative;
          overflow: hidden;
        }
        .user-menu-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(29, 78, 216, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .user-menu-item:hover::before {
          opacity: 1;
        }
        .user-menu-item:hover {
          color: white;
          transform: translateX(5px);
          text-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        }
        .user-menu-logout {
          color: #fca5a5;
        }
        .user-menu-logout:hover {
          color: #ef4444;
        }
        .user-menu-logout::before {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(248, 113, 113, 0.2) 100%) !important;
        }
        .notification-bell {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 12px;
          transition: all 0.3s ease;
        }
        .notification-bell:hover {
          transform: scale(1.05) translateY(-1px);
          background: rgba(59, 130, 246, 0.2);
          border-color: rgba(59, 130, 246, 0.4);
          box-shadow: 0 4px 15px rgba(29, 78, 216, 0.3);
        }
        .notification-bell:active {
          transform: scale(0.95);
        }
        .messages-button {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 12px;
          transition: all 0.3s ease;
        }
        .messages-button:hover {
          background: rgba(59, 130, 246, 0.2);
          border-color: rgba(59, 130, 246, 0.4);
          box-shadow: 0 4px 15px rgba(29, 78, 216, 0.3);
          transform: translateY(-1px);
        }
        .notification-badge, .unread-badge {
          background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
          animation: pulse 2s infinite;
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.1);
          }
        }
      `}</style>
    </nav>
  );
}