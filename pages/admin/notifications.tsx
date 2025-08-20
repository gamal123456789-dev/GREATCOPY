import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import Head from 'next/head';
import Link from 'next/link';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  read: boolean;
  createdAt: string;
}

interface NotificationsPageProps {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export default function AdminNotifications({ user }: NotificationsPageProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'new_order'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/admin/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/admin/notifications/${notificationId}/read`, {
        method: 'POST'
      });
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await fetch('/api/admin/notifications/mark-all-read', {
        method: 'POST'
      });
      
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.read;
    if (filter === 'new_order') return notif.type === 'new_order';
    return true;
  });

  // Auto refresh every 30 seconds
  useEffect(() => {
    fetchNotifications();
    
    if (autoRefresh) {
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Format date in Arabic
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ar-EG', {
      timeZone: 'Africa/Cairo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_order':
        return '🛒';
      default:
        return '🔔';
    }
  };

  // Get notification color
  const getNotificationColor = (type: string, read: boolean) => {
    if (read) return 'bg-gray-50 border-gray-200';
    
    switch (type) {
      case 'new_order':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <Head>
        <title>إشعارات الإدارة - Gear Score</title>
        <meta name="description" content="صفحة إشعارات الإدارة" />
      </Head>

      <div className="min-h-screen bg-gray-100" dir="rtl">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4 space-x-reverse">
                <h1 className="text-2xl font-bold text-gray-900">
                  🔔 إشعارات الإدارة
                </h1>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-sm px-2 py-1 rounded-full">
                    {unreadCount} جديد
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-4 space-x-reverse">
                <Link 
                  href="/admin" 
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  ← العودة للوحة الإدارة
                </Link>
                
                <div className="text-sm text-gray-600">
                  مرحباً، {user.name}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Filters */}
              <div className="flex items-center space-x-4 space-x-reverse">
                <span className="text-sm font-medium text-gray-700">تصفية:</span>
                <select 
                  value={filter} 
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  <option value="all">جميع الإشعارات</option>
                  <option value="unread">غير المقروءة</option>
                  <option value="new_order">الطلبات الجديدة</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-4 space-x-reverse">
                <label className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">تحديث تلقائي</span>
                </label>
                
                <button
                  onClick={fetchNotifications}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-600"
                >
                  🔄 تحديث
                </button>
                
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="bg-green-500 text-white px-4 py-2 rounded-md text-sm hover:bg-green-600"
                  >
                    ✓ تحديد الكل كمقروء
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-600">جاري التحميل...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <div className="text-4xl mb-4">📭</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  لا توجد إشعارات
                </h3>
                <p className="text-gray-600">
                  {filter === 'unread' 
                    ? 'جميع الإشعارات مقروءة'
                    : filter === 'new_order'
                    ? 'لا توجد طلبات جديدة'
                    : 'لا توجد إشعارات حالياً'
                  }
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white rounded-lg shadow-sm border-r-4 p-4 cursor-pointer transition-all hover:shadow-md ${
                    getNotificationColor(notification.type, notification.read)
                  }`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 space-x-reverse flex-1">
                      <div className="text-2xl">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 space-x-reverse mb-1">
                          <h3 className="font-medium text-gray-900">
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                              جديد
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-700 mb-2">
                          {notification.message}
                        </p>
                        
                        {/* Order Details */}
                        {notification.type === 'new_order' && notification.data && (
                          <div className="bg-gray-50 rounded-md p-3 mt-2 text-sm">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              <div>
                                <span className="font-medium">رقم الطلب:</span>
                                <br />
                                <span className="text-blue-600">{notification.data.orderId}</span>
                              </div>
                              <div>
                                <span className="font-medium">اللعبة:</span>
                                <br />
                                {notification.data.game}
                              </div>
                              <div>
                                <span className="font-medium">الخدمة:</span>
                                <br />
                                {notification.data.service}
                              </div>
                              <div>
                                <span className="font-medium">السعر:</span>
                                <br />
                                <span className="text-green-600 font-medium">
                                  ${notification.data.price}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-500 mt-2">
                          {formatDate(notification.createdAt)}
                        </div>
                      </div>
                    </div>
                    
                    {notification.read && (
                      <div className="text-green-500 text-sm">
                        ✓ مقروء
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Server-side authentication and authorization
export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  
  // Check if user is authenticated
  if (!session || !session.user) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/admin/notifications',
        permanent: false,
      },
    };
  }
  
  // Check if user has admin role
  if (session.user.role !== 'ADMIN') {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }
  
  return {
    props: {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
      },
    },
  };
};