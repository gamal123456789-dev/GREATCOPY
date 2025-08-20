import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  data: {
    orderId: string;
    customerName: string;
    game: string;
    service: string;
    price: number;
    status: string;
    paymentMethod: string;
    timestamp: string;
  };
  timestamp: string;
  read: boolean;
}

const NotificationPopup: React.FC = () => {
  const [notification, setNotification] = useState<NotificationData | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [countdown, setCountdown] = useState(30);
  const router = useRouter();

  useEffect(() => {
    // Get notification data from URL parameters
    const { query } = router;
    if (query.data) {
      try {
        const notificationData = JSON.parse(decodeURIComponent(query.data as string));
        setNotification(notificationData);
      } catch (error) {
        console.error('Error parsing notification data:', error);
      }
    }

    // Auto-close countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Play notification sound
    const audio = new Audio('/chat-sound.mp3');
    audio.play().catch(console.error);

    return () => clearInterval(timer);
  }, [router]);

  const handleClose = () => {
    setIsVisible(false);
    window.close();
  };

  const handleViewOrder = () => {
    if (notification?.data.orderId) {
      // Open admin panel in the parent window
      window.opener?.location.assign(`https://gear-score.com/admin?order=${notification.data.orderId}`);
      handleClose();
    }
  };

  const handleMarkAsRead = async () => {
    if (notification?.id) {
      try {
        await fetch('/api/admin/notifications', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            notificationId: notification.id,
            read: true,
          }),
        });
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
    handleClose();
  };

  if (!isVisible || !notification) {
    return null;
  }

  return (
    <>
      <Head>
        <title>🔔 إشعار جديد - Gear Score</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="notification-popup">
        <div className="popup-container">
          {/* Header */}
          <div className="popup-header">
            <div className="header-content">
              <div className="notification-icon">🔔</div>
              <h1 className="popup-title">إشعار طلب جديد</h1>
              <div className="countdown">إغلاق تلقائي خلال {countdown}ث</div>
            </div>
            <button onClick={handleClose} className="close-btn">×</button>
          </div>

          {/* Content */}
          <div className="popup-content">
            <div className="notification-details">
              <h2 className="order-title">{notification.title}</h2>
              <p className="order-message">{notification.message}</p>
              
              <div className="order-info">
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">رقم الطلب:</span>
                    <span className="value">{notification.data.orderId}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">العميل:</span>
                    <span className="value">{notification.data.customerName}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">اللعبة:</span>
                    <span className="value">{notification.data.game}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">الخدمة:</span>
                    <span className="value">{notification.data.service}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">السعر:</span>
                    <span className="value price">${notification.data.price}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">طريقة الدفع:</span>
                    <span className="value">{notification.data.paymentMethod}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">الحالة:</span>
                    <span className={`value status ${notification.data.status}`}>
                      {notification.data.status === 'pending' ? 'في الانتظار' : notification.data.status}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">الوقت:</span>
                    <span className="value">
                      {new Date(notification.data.timestamp).toLocaleString('ar-EG')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="popup-actions">
            <button onClick={handleViewOrder} className="btn btn-primary">
              عرض الطلب في لوحة الإدارة
            </button>
            <button onClick={handleMarkAsRead} className="btn btn-secondary">
              تم الاطلاع
            </button>
            <button onClick={handleClose} className="btn btn-outline">
              إغلاق
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .notification-popup {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          direction: rtl;
        }

        .popup-container {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          overflow: hidden;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-50px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .popup-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .notification-icon {
          font-size: 32px;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .popup-title {
          font-size: 24px;
          font-weight: bold;
          margin: 0;
        }

        .countdown {
          background: rgba(255, 255, 255, 0.2);
          padding: 5px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }

        .close-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          font-size: 24px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .popup-content {
          padding: 30px;
          max-height: 400px;
          overflow-y: auto;
        }

        .order-title {
          font-size: 20px;
          font-weight: bold;
          color: #333;
          margin: 0 0 10px 0;
        }

        .order-message {
          color: #666;
          margin: 0 0 25px 0;
          line-height: 1.5;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .label {
          font-size: 12px;
          font-weight: 600;
          color: #888;
          text-transform: uppercase;
        }

        .value {
          font-size: 14px;
          font-weight: 500;
          color: #333;
        }

        .value.price {
          color: #10b981;
          font-weight: bold;
          font-size: 16px;
        }

        .value.status {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
          text-align: center;
        }

        .value.status.pending {
          background: #fef3c7;
          color: #d97706;
        }

        .popup-actions {
          padding: 20px 30px;
          background: #f8fafc;
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }

        .btn {
          padding: 12px 20px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          font-size: 14px;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover {
          background: #2563eb;
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: #10b981;
          color: white;
        }

        .btn-secondary:hover {
          background: #059669;
          transform: translateY(-1px);
        }

        .btn-outline {
          background: transparent;
          color: #6b7280;
          border: 2px solid #e5e7eb;
        }

        .btn-outline:hover {
          background: #f3f4f6;
          border-color: #d1d5db;
        }

        @media (max-width: 768px) {
          .popup-container {
            width: 95%;
            margin: 20px;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }

          .popup-actions {
            flex-direction: column;
          }

          .header-content {
            flex-direction: column;
            gap: 10px;
            align-items: flex-start;
          }
        }
      `}</style>
    </>
  );
};

export default NotificationPopup;