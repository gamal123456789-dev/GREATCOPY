import React, { useState } from 'react';
import { useSocket, Notification } from '../hooks/useSocket';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

interface NotificationCenterProps {
  className?: string;
}

/**
 * Real-time Notification Center Component
 * Displays and manages real-time notifications for users and admins
 */
const NotificationCenter: React.FC<NotificationCenterProps> = ({ className = '' }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const {
    notifications,
    clearNotifications,
    removeNotification,
    isConnected,
    unreadMessagesCount,
    getUnreadMessagesCount,
    clearUnreadMessages,
    clearAllMessages
  } = useSocket();
  
  const [isOpen, setIsOpen] = useState(false);
  const isAdmin = session?.user?.role === 'ADMIN';

  // Handle notification click to navigate to chat
  const handleNotificationClick = (notification: Notification) => {
    if (notification.orderId) {
      router.push(`/orders?orderId=${notification.orderId}`);
      setIsOpen(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new-message':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
            />
          </svg>
        );
      case 'admin-reply':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" 
            />
          </svg>
        );
      // Removed order-update notification type
      case 'new-order':
        return (
          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" 
            />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM4 15h8v-2H4v2zM4 11h10V9H4v2z" 
            />
          </svg>
        );
    }
  };

  const formatTime = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return date.toLocaleDateString('ar-SA');
  };

  // Calculate total unread count (notifications + unread messages)
  const totalUnreadCount = notifications.length + (getUnreadMessagesCount ? getUnreadMessagesCount() : unreadMessagesCount);

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="notification-bell"
        title={isConnected ? 'Notifications' : 'Not connected to server'}
      >
        <i className={`fas fa-bell ${!isConnected ? 'text-red-500' : ''}`}></i>
        
        {/* Notification Badge */}
        {isConnected && totalUnreadCount > 0 && (
          <span className="notification-badge">
            {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
          </span>
        )}
        
        {/* Connection Status Indicator */}
        <div className={`connection-indicator ${
          isConnected ? 'connected' : 'disconnected'
        }`}></div>
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          ></div>
          
          {/* Notification Panel */}
          <div className="notification-dropdown">
            {/* Header */}
            <div className="notification-header flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Notifications</h3>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                {totalUnreadCount > 0 && (
                  <button
                    onClick={() => {
                      clearNotifications();
                      clearAllMessages();
                      // Clear NotificationSystem notifications if available
                      if (typeof window !== 'undefined' && window.clearAllNotifications) {
                        window.clearAllNotifications();
                      }
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="notification-list">
              {!isConnected ? (
                <div className="flex flex-col items-center justify-center p-8 text-red-500">
                  <div className="text-2xl mb-2">⚠️</div>
                  <p className="font-medium">Not connected to server</p>
                <p className="text-sm text-gray-500 mt-1">New notifications will not arrive</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="mt-3 bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-white text-sm transition-colors"
                  >
                    Reload
                  </button>
                </div>
              ) : totalUnreadCount === 0 ? (
                <div className="notification-empty">
                  <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM4 15h8v-2H4v2zM4 11h10V9H4v2z" 
                    />
                  </svg>
                  <p className="text-center">
                    No new notifications or messages<br />
                <span className="text-sm">Notifications and messages will appear here when they arrive</span>
                  </p>
                </div>
              ) : (
                <>
                  {/* Show unread messages count if any */}
                  {(getUnreadMessagesCount ? getUnreadMessagesCount() : unreadMessagesCount) > 0 && (
                    <div className="notification-item bg-blue-900/30">
                      <div className="flex-shrink-0 mr-3">
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-blue-200 font-medium">
                          You have {getUnreadMessagesCount ? getUnreadMessagesCount() : unreadMessagesCount} unread messages
                        </p>
                        <p className="text-xs text-blue-300 mt-1">
                          Check your orders to read new messages
                        </p>
                      </div>
                    </div>
                  )}
                  {/* Regular notifications */}
                  {notifications.map((notification, index) => (
                  <div 
                    key={index}
                    className="notification-item group cursor-pointer hover:bg-gray-700/30 transition-colors"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex-shrink-0 mr-3">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200 break-words">
                        {notification.message}
                      </p>
                      {(notification as any).serviceName && (
                        <p className="text-xs text-blue-400 mt-1">
                          Service: {(notification as any).serviceName}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTime(notification.timestamp)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(index);
                      }}
                      className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  ))}
                </>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 bg-gray-50 text-center border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  {notifications.length} new notification(s)
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;