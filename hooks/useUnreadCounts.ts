import { useState, useEffect } from 'react';
import { useSocket } from './useSocket';

/**
 * Custom hook to manage unread message counts for orders in admin panel
 * Fetches initial counts and updates them in real-time via socket events
 */
export const useUnreadCounts = () => {
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { socket } = useSocket();

  // Fetch initial unread counts
  const fetchUnreadCounts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/orders/unread-counts');
      const data = await response.json();
      
      if (data.success) {
        setUnreadCounts(data.unreadCounts || {});
      } else {
        setError(data.error || 'Failed to fetch unread counts');
      }
    } catch (err) {
      console.error('Error fetching unread counts:', err);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Update unread count for a specific order
  const updateUnreadCount = (orderId: string, count: number) => {
    setUnreadCounts(prev => ({
      ...prev,
      [orderId]: Math.max(0, count) // Ensure count doesn't go below 0
    }));
  };

  // Increment unread count for a specific order
  const incrementUnreadCount = (orderId: string) => {
    setUnreadCounts(prev => ({
      ...prev,
      [orderId]: (prev[orderId] || 0) + 1
    }));
  };

  // Mark messages as read for a specific order
  const markAsRead = (orderId: string) => {
    setUnreadCounts(prev => ({
      ...prev,
      [orderId]: 0
    }));
  };

  // Get unread count for a specific order
  const getUnreadCount = (orderId: string): number => {
    return unreadCounts[orderId] || 0;
  };

  // Socket event listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    // Listen for new messages to increment unread count
    const handleNewMessage = (data: any) => {
      if (data.orderId && data.userId !== data.currentUserId) {
        incrementUnreadCount(data.orderId);
      }
    };

    // Listen for messages being marked as read
    const handleMessagesRead = (data: { orderId: string }) => {
      if (data.orderId) {
        markAsRead(data.orderId);
      }
    };

    // Listen for unread count updates
    const handleUnreadCountUpdate = (data: { orderId: string; count: number }) => {
      if (data.orderId !== undefined && data.count !== undefined) {
        updateUnreadCount(data.orderId, data.count);
      }
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('messagesRead', handleMessagesRead);
    socket.on('unreadCountUpdate', handleUnreadCountUpdate);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('messagesRead', handleMessagesRead);
      socket.off('unreadCountUpdate', handleUnreadCountUpdate);
    };
  }, [socket]);

  // Fetch initial data on mount
  useEffect(() => {
    fetchUnreadCounts();
  }, []);

  return {
    unreadCounts,
    loading,
    error,
    getUnreadCount,
    updateUnreadCount,
    incrementUnreadCount,
    markAsRead,
    refetch: fetchUnreadCounts
  };
};

export default useUnreadCounts;