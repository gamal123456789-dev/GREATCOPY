import React, { useEffect, useState, useCallback } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useAudioManager } from '../hooks/useAudioManager';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

interface OrderNotification {
  id: string;
  type: 'order_confirmed' | 'payment_received' | 'service_started' | 'service_completed' | 'message_received' | 'status_updated' | 'invoice_ready';
  title: string;
  message: string;
  orderId?: string;
  serviceName?: string;
  timestamp: number;
  isRead: boolean;
  icon: string;
  color: string;
}

interface NotificationSystemProps {
  showToasts?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({ 
  showToasts = true, 
  position = 'top-right' 
}) => {
  const { data: session } = useSession();
  const router = useRouter();
  const { playNotificationSound } = useAudioManager();
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [toastNotifications, setToastNotifications] = useState<OrderNotification[]>([]);
  const [lastSoundTime, setLastSoundTime] = useState(0);
  const [playedSounds, setPlayedSounds] = useState<Set<string>>(new Set());
  const SOUND_COOLDOWN = 3000; // 3 seconds cooldown between sounds

  // Notification type configurations
  const notificationConfig = {
    order_confirmed: {
      icon: '✅',
      color: 'bg-green-500',
      title: 'Order Confirmed',
      sound: true
    },
    payment_received: {
      icon: '💰',
      color: 'bg-blue-500',
      title: 'Payment Received',
      sound: true
    },
    service_started: {
      icon: '🎮',
      color: 'bg-purple-500',
      title: 'Service Started',
      sound: true
    },
    service_completed: {
      icon: '🎉',
      color: 'bg-green-600',
      title: 'Service Completed',
      sound: true
    },
    message_received: {
      icon: '💬',
      color: 'bg-indigo-500',
      title: 'New Message',
      sound: true
    },
    status_updated: {
      icon: '🔄',
      color: 'bg-yellow-500',
      title: 'Status Updated',
      sound: true
    },
    invoice_ready: {
      icon: '🧾',
      color: 'bg-orange-500',
      title: 'Invoice Ready',
      sound: true
    }
  };

  // Handle incoming notifications from Socket.IO
  const handleNotification = useCallback((data: any) => {
    console.log('🔔 Received notification:', data);
    
    const config = notificationConfig[data.type as keyof typeof notificationConfig];
    if (!config) {
      console.warn('Unknown notification type:', data.type);
      return;
    }

    const notification: OrderNotification = {
      id: `${Date.now()}-${Math.random()}`,
      type: data.type,
      title: config.title,
      message: data.message || config.title,
      orderId: data.orderId,
      serviceName: data.serviceName,
      timestamp: Date.now(),
      isRead: false,
      icon: config.icon,
      color: config.color
    };

    // Add to notifications list
    setNotifications(prev => [notification, ...prev]);

    // Show toast notification if enabled
    if (showToasts) {
      setToastNotifications(prev => [...prev, notification]);
      
      // Auto-remove toast after 5 seconds
      setTimeout(() => {
        setToastNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 5000);
    }

    // Play notification sound with enhanced duplicate prevention
    const currentTime = Date.now();
    const soundId = `${data.type}-${data.orderId}-${currentTime}`;
    
    // Check multiple conditions to prevent duplicate sounds
    const shouldPlaySound = (
      currentTime - lastSoundTime > SOUND_COOLDOWN && // Time-based cooldown
      !playedSounds.has(soundId) // Unique sound ID check
      // Removed document.hidden check to allow background sounds
    );
    
    if (shouldPlaySound) {
      setLastSoundTime(currentTime);
      setPlayedSounds(prev => {
        const newSet = new Set(prev);
        newSet.add(soundId);
        // Keep only last 50 sound IDs to prevent memory leak
        if (newSet.size > 50) {
          const soundsArray = Array.from(newSet);
          return new Set(soundsArray.slice(-25));
        }
        return newSet;
      });
      
      try {
        console.log('🔊 Playing notification sound for:', soundId);
        
        // Always try to play sound regardless of page visibility
        // Modern browsers allow audio playback even when tab is not active
        // if user has previously interacted with the page
        if (playNotificationSound) {
          playNotificationSound();
        } else if (typeof window !== 'undefined' && window.playNotificationSound) {
          window.playNotificationSound();
        }
        
        // Also try service worker as backup for background notifications
        if (document.hidden && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'PLAY_NOTIFICATION_SOUND',
            soundType: data.type === 'message_received' ? 'chat' : 'notification'
          });
        }
      } catch (error) {
        console.error('Failed to play notification sound:', error);
      }
    } else {
      console.log('🔇 Skipping duplicate notification sound:', soundId);
    }

    // Show browser notification (works in background)
    if ('Notification' in window && Notification.permission === 'granted') {
      // Use service worker for background notifications
      if (document.hidden && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_BACKGROUND_NOTIFICATION',
          notification: {
            title: config.title,
            message: notification.message,
            tag: `order-notification-${notification.id}`,
            soundType: data.type === 'message_received' ? 'chat' : 'notification'
          }
        });
      } else {
        // Show normal notification if page is visible
        new Notification(config.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: `order-notification-${notification.id}`,
          badge: '/favicon.ico'
        });
      }
    }
  }, [playNotificationSound, showToasts, lastSoundTime]);

  // Register service worker for background notifications (production only)
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // In development, ensure no service worker is controlling the page to avoid HMR reload loops
    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations?.().then((regs) => {
        regs.forEach((r) => r.unregister());
      }).catch(() => {});
      return;
    }

    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered:', registration);
        
        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'PLAY_SOUND_FROM_SW') {
            try {
              if (playNotificationSound) {
                playNotificationSound();
              }
            } catch (error) {
              console.error('Failed to play sound from SW:', error);
            }
          }
        });
      })
      .catch((error) => {
        console.error('❌ Service Worker registration failed:', error);
      });
  }, [playNotificationSound]);

  // Setup Socket.IO listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('🔔 NotificationSystem: Setting up listeners...');

    // Listen for custom notification events
    const handleSocketNotification = (data: any) => {
      handleNotification(data);
    };

    // Listen for order status updates
    const handleOrderStatusUpdate = (data: any) => {
      handleNotification({
        type: 'status_updated',
        message: `Order status updated to: ${data.status}`,
        orderId: data.orderId,
        serviceName: data.service || data.game
      });
    };

    // Listen for new messages
    const handleNewMessage = (data: any) => {
      // Only show notification if message is not from current user
      if (session?.user?.id && data.senderId !== session.user.id) {
        handleNotification({
          type: 'message_received',
          message: `New message from ${data.senderName || 'Support'}`,
          orderId: data.orderId,
          serviceName: data.service || data.game
        });
      }
    };

    // Add event listeners to window for Socket.IO events
    window.addEventListener('socket-notification', handleSocketNotification);
    window.addEventListener('socket-order-status-updated', handleOrderStatusUpdate);
    window.addEventListener('socket-new-message', handleNewMessage);

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('🔔 Notification permission:', permission);
      });
    }

    return () => {
      window.removeEventListener('socket-notification', handleSocketNotification);
      window.removeEventListener('socket-order-status-updated', handleOrderStatusUpdate);
      window.removeEventListener('socket-new-message', handleNewMessage);
    };
  }, [handleNotification, session?.user?.id]);

  // Remove toast notification
  const removeToast = (id: string) => {
    setToastNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Handle notification click to navigate to chat
  const handleNotificationClick = (notification: OrderNotification) => {
    if (notification.orderId) {
      // Navigate to orders page with orderId parameter
      router.push(`/orders?orderId=${notification.orderId}`);
      // Remove the toast notification after clicking
      removeToast(notification.id);
    }
  };

  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
    setToastNotifications([]);
  };

  // Expose clear function globally for external access
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.clearAllNotifications = clearAllNotifications;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete window.clearAllNotifications;
      }
    };
  }, []);

  // Get position classes for toast
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      default:
        return 'top-4 right-4';
    }
  };

  return (
    <>
      {/* Toast Notifications */}
      {showToasts && (
        <div className={`fixed ${getPositionClasses()} z-50 space-y-2 max-w-sm`}>
          {toastNotifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-4 transform transition-all duration-300 ease-in-out animate-slide-in cursor-pointer hover:bg-gray-750 hover:border-gray-600 hover:shadow-xl"
              style={{
                animation: 'slideInRight 0.3s ease-out'
              }}
              title={notification.orderId ? 'Click to open chat' : ''}
            >
              <div className="flex items-start space-x-3 rtl:space-x-reverse">
                <div className={`flex-shrink-0 w-8 h-8 ${notification.color} rounded-full flex items-center justify-center text-white text-sm`}>
                  {notification.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">
                    {notification.title}
                  </p>
                  <p className="text-sm text-gray-300 mt-1">
                    {notification.message}
                  </p>
                  {notification.orderId && (
                    <p className="text-xs text-gray-400 mt-1">
                      Order #{notification.orderId}
                      {notification.serviceName && (
                        <span className="ml-2 text-blue-400">• {notification.serviceName}</span>
                      )}
                      <span className="ml-2 text-green-400 font-medium">👆 Click to open chat</span>
                    </p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering the notification click
                    removeToast(notification.id);
                  }}
                  className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
                  title="Close notification"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notification Styles */}
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default NotificationSystem;