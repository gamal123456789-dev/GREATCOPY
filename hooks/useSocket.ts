import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { useAudioManager } from './useAudioManager';

export interface ChatMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderName?: string;
  message: string;
  messageType: 'text' | 'image' | 'system';
  imageUrl?: string;
  isSystem: boolean;
  isDelivered?: boolean;
  isRead?: boolean;
  isPinned?: boolean;
  timestamp: Date;
  senderRole?: string;
}

export interface Notification {
  type: string;
  message: string;
  orderId?: string;
  serviceName?: string;
  timestamp: Date;
}

/**
 * Custom hook for Socket.IO client management
 * Handles real-time chat and notifications
 */
export const useSocket = () => {
  const { data: session } = useSession();
  const { playChatSound, playNotificationSound } = useAudioManager();
  const playedSoundsRef = useRef<Set<string>>(new Set()); // Track played sounds by message ID
  const playedNotificationsRef = useRef<Set<string>>(new Set()); // Track played notification sounds
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [sentMessages, setSentMessages] = useState<number>(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);
  const [connectionRetries, setConnectionRetries] = useState<number>(0);
  const [lastMessageRefresh, setLastMessageRefresh] = useState<Date>(new Date());
  const [sessionData, setSessionData] = useState<Map<string, ChatMessage[]>>(new Map());
  const [joinedRoomId, setJoinedRoomId] = useState<string | null>(null);
  const sessionDataRef = useRef<Map<string, ChatMessage[]>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isReconnectingRef = useRef(false);

  // Keep sessionDataRef in sync with sessionData
  useEffect(() => {
    sessionDataRef.current = sessionData;
  }, [sessionData]);

  // Initialize Socket.IO - define connection function
  const initSocket = useCallback(async () => {
    try {
      let newSocket;
      
      // If user is authenticated, get token and connect with auth
      if (session?.user?.id) {
        if (process.env.NODE_ENV === 'development') {
          // Requesting socket token for authenticated user
        }
        
        try {
          const response = await axios.post('/api/socket-token');
          const { token } = response.data;
          
          if (process.env.NODE_ENV === 'development') {
            // Socket token received, initializing connection
          }
          
          const socketUrl = process.env.NODE_ENV === 'production' 
            ? process.env.NEXT_PUBLIC_BASE_URL || 'https://gear-score.com'
            : 'http://localhost:5201';
          
          newSocket = io(socketUrl, {
            auth: { token },
            transports: ['websocket', 'polling'],
            timeout: 5000,
          });
        } catch (tokenError) {
          const err = tokenError as Error;
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ Failed to get auth token, falling back to unauthenticated connection:', err.message);
          }
          // Fall back to unauthenticated connection
          const socketUrl = process.env.NODE_ENV === 'production' 
            ? process.env.NEXT_PUBLIC_BASE_URL || 'https://gear-score.com'
            : 'http://localhost:5201';
          
          newSocket = io(socketUrl, {
            transports: ['websocket', 'polling'],
            timeout: 5000,
          });
        }
      } else {
        // No session - create unauthenticated connection for general notifications
        if (process.env.NODE_ENV === 'development') {
          // No session available, initializing unauthenticated connection
        }
        
        const socketUrl = process.env.NODE_ENV === 'production' 
          ? process.env.NEXT_PUBLIC_BASE_URL || 'https://gear-score.com'
          : 'http://localhost:5201';
        
        newSocket = io(socketUrl, {
          transports: ['websocket', 'polling'],
          timeout: 5000,
        });
      }
  
      newSocket
        .on('connect', () => {
          if (process.env.NODE_ENV === 'development') {
            // Socket connected successfully
          }
          setIsConnected(true);
          setConnectionRetries(0);
          // Reset joined room on reconnection
          setJoinedRoomId(null);
        })
        .on('connect_error', (err: any) => {
          if (process.env.NODE_ENV === 'development') {
            console.error('Connection Error:', err.message);
          }
          setIsConnected(false);
          setConnectionRetries((prev: number) => prev + 1);
        })
        .on('connect_timeout', () => {
          if (process.env.NODE_ENV === 'development') {
            console.error('Connection Timeout');
          }
          setIsConnected(false);
        })
        .on('disconnect', () => {
          if (process.env.NODE_ENV === 'development') {
            // Socket disconnected
          }
          setIsConnected(false);
          setJoinedRoomId(null);
        })
        .on('new-message', (messageData: ChatMessage) => {
          if (process.env.NODE_ENV === 'development') {
            // Received new message
          }
          
          try {
            // Force immediate update of messages
            setMessages((prev: ChatMessage[]) => {
              // Check if message already exists (avoid duplicates)
              const exists = prev.some((msg: ChatMessage) => msg.id === messageData.id);
              if (exists) {
                if (process.env.NODE_ENV === 'development') {
                  // Message already exists, skipping duplicate
                }
                return prev;
              }
              
              // Only remove temp messages that match this specific message
              // (when the real message arrives to replace the optimistic one)
              const filtered = prev.filter((msg: ChatMessage) => {
                if (!msg.id.startsWith('temp_')) return true;
                // Keep temp messages that don't match this real message
                return !(msg.orderId === messageData.orderId && 
                        msg.senderId === messageData.senderId && 
                        msg.message === messageData.message);
              });
              
              const newMessage = {
                ...messageData,
                timestamp: new Date(messageData.timestamp)
              };
              
              const updatedMessages = [...filtered, newMessage];
              
              // Force immediate UI update by triggering a re-render, especially for images
              setTimeout(() => {
                  if (process.env.NODE_ENV === 'development') {
                    // Force updating messages state for immediate display
                  }
                  setMessages((current: ChatMessage[]) => [...current]); // Force re-render
                }, 0);
              
              // Additional force update for image messages to ensure immediate display
              if (messageData.messageType === 'image') {
                // Multiple force updates with different timings to ensure image display
                setTimeout(() => {
                    if (process.env.NODE_ENV === 'development') {
                      // First additional force update for image message
                    }
                    setMessages((current: ChatMessage[]) => [...current]); // Additional force re-render for images
                  }, 50);
                
                setTimeout(() => {
                    if (process.env.NODE_ENV === 'development') {
                      // Second additional force update for image message
                    }
                    setMessages((current: ChatMessage[]) => [...current]); // Another force re-render
                  }, 150);
                
                setTimeout(() => {
                    if (process.env.NODE_ENV === 'development') {
                      // Final force update for image message
                    }
                    setMessages((current: ChatMessage[]) => [...current]); // Final force re-render
                  }, 300);
              }
              
              // Save updated messages in session data
              if (messageData.orderId) {
                setSessionData((prevData: Map<string, ChatMessage[]>) => {
                  const newData = new Map(prevData);
                  newData.set(messageData.orderId, updatedMessages);
                  return newData;
                });
                
                // Update session data ref immediately
                sessionDataRef.current.set(messageData.orderId, updatedMessages);
              }
              
              return updatedMessages;
            });
            
            // Update unread count if message is from another user
            if (session?.user?.id && messageData.senderId !== session.user.id) {
              setUnreadMessagesCount((prev: number) => prev + 1);
            }
            
            // Play sound and show notification for message recipients
            if (messageData.senderId !== session?.user?.id) {
              if (process.env.NODE_ENV === 'development') {
                // Processing new message for sound
              }
              
              // Check if we already played sound for this message
              if (!playedSoundsRef.current.has(messageData.id)) {
                playedSoundsRef.current.add(messageData.id);
                
                if (process.env.NODE_ENV === 'development') {
                  // Playing chat sound for new message
                }
                
                // Dispatch custom event for NotificationSystem
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('socket-new-message', {
                    detail: messageData
                  }));
                  
                  // Dispatch additional event for image messages to ensure immediate display
                  if (messageData.messageType === 'image') {
                    window.dispatchEvent(new CustomEvent('socket-new-image-message', {
                      detail: messageData
                    }));
                  }
                }
                
                // Sound will be handled by NotificationSystem component
                // to avoid duplicate sound playback
                
                // Show browser notification when page is not visible
                if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
                  new Notification(`New message from ${messageData.senderName}`, {
                    body: messageData.message,
                    icon: '/favicon.ico',
                    tag: 'chat-message'
                  });
                }
                
                // Clean up old played sounds to prevent memory leak (keep last 100)
                if (playedSoundsRef.current.size > 100) {
                  const soundsArray = Array.from(playedSoundsRef.current);
                  const toKeep = soundsArray.slice(-50); // Keep last 50
                  playedSoundsRef.current = new Set(toKeep);
                }
              } else {
                if (process.env.NODE_ENV === 'development') {
                  // Skipping sound for already processed message
                }
              }
            }
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.error('Error handling new message:', error);
            }
          }
        })
        .on('new-notification', (notification: Notification) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔔 Received notification:', notification);
          }
          
          try {
            // Ensure timestamp is a Date object (it might come as string from socket)
            const processedNotification = {
              ...notification,
              timestamp: notification.timestamp instanceof Date ? notification.timestamp : new Date(notification.timestamp)
            };
            
            setNotifications((prev: Notification[]) => [processedNotification, ...prev]);
            
            // Dispatch custom event for NotificationSystem
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('socket-notification', {
                detail: processedNotification
              }));
            }
            
            // Create unique identifier for notification to prevent duplicate sounds
            const notificationId = `${processedNotification.type}-${processedNotification.timestamp.getTime()}-${processedNotification.message.substring(0, 50)}`;
            
            // Check if we already played sound for this notification
            if (!playedNotificationsRef.current.has(notificationId)) {
              playedNotificationsRef.current.add(notificationId);
              
              if (process.env.NODE_ENV === 'development') {
                console.log('🔔 Playing notification sound for:', notificationId);
              }
              
              // Sound will be handled by NotificationSystem component
              // to avoid duplicate sound playback
              
              // Clean up old played notifications to prevent memory leak (keep last 100)
              if (playedNotificationsRef.current.size > 100) {
                const notificationsArray = Array.from(playedNotificationsRef.current);
                const toKeep = notificationsArray.slice(-50); // Keep last 50
                playedNotificationsRef.current = new Set(toKeep);
              }
            } else {
              if (process.env.NODE_ENV === 'development') {
                console.log('🔇 Skipping notification sound for already processed:', notificationId);
              }
            }
            
            // Show browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('New notification', {
                body: notification.message,
                icon: '/favicon.ico',
                tag: 'notification'
              });
            }
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.error('Error handling notification:', error);
            }
          }
        })
        .on('order-status-updated', (data: any) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('📋 Order status updated:', data);
          }
          
          // Dispatch custom event for NotificationSystem
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('socket-order-status-updated', {
              detail: data
            }));
          }
        })
        .on('messages-marked-read', (data: any) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('📖 Messages marked as read:', data);
          }
          // Update message read status
          setMessages((prev: ChatMessage[]) => {
            const updatedMessages = prev.map((msg: ChatMessage) => 
              msg.orderId === data.orderId && msg.senderId !== session?.user?.id
                ? { ...msg, isRead: true }
                : msg
            );
            
            // Save updated messages in session data
            if (data.orderId) {
              setSessionData((prevData: Map<string, ChatMessage[]>) => {
                const newData = new Map(prevData);
                newData.set(data.orderId, updatedMessages);
                return newData;
              });
            }
            
            return updatedMessages;
          });
        })
        .on('error', (error: any) => {
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ Socket error:', error);
          }
        });
  
      socketRef.current = newSocket;
  
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 401) {
            console.log('ℹ️ Socket token request failed - user not authenticated');
          } else {
            console.error('❌ Socket token request failed:', {
              status: err.response?.status,
              message: err.response?.data?.error || err.message,
              details: err.response?.data?.details
            });
          }
        } else {
          console.error('❌ Socket Initialization Error:', err);
        }
      }
      setIsConnected(false);
      setConnectionRetries((prev: number) => prev + 1);
      setTimeout(initSocket, 3000);
    }
  }, [session?.user?.id]);

  // Initialize Socket.IO
  useEffect(() => {
    // Disconnect existing socket if session changes
    if (socketRef.current) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Session changed, disconnecting existing socket');
      }
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
    
    // Initialize Socket for both authenticated and unauthenticated users
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Initializing Socket.IO connection');
    }
    initSocket();
    
    // Log session status
    if (!session?.user?.id) {
      if (process.env.NODE_ENV === 'development') {
        console.log('ℹ️ No session available, listening for general notifications only');
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Session available for user:', session.user.id);
      }
    }

    // Cleanup on unmount
    // In development, disconnect to avoid duplicate sockets during Fast Refresh
    // In production, keep connection alive for smoother UX
    return () => {
      if (process.env.NODE_ENV !== 'production') {
        if (socketRef.current) {
          try { socketRef.current.disconnect(); } catch {}
          socketRef.current = null;
        }
        setIsConnected(false);
        if (process.env.NODE_ENV === 'development') {
          console.log('🔌 useSocket cleanup - disconnected to avoid HMR duplicates');
        }
      }
    };
  }, [session?.user?.id, initSocket]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Handle visibility change (tab switching) and page unload
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && socketRef.current && isConnected) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Tab became visible, checking connection status');
        }
        
        // Reconnect if not connected
        if (!socketRef.current.connected) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 Reconnecting socket after tab switch');
          }
          socketRef.current.connect();
        }
        
        // Send ping to verify connection
        socketRef.current.emit('ping');
        
        // Handle pong response
        socketRef.current.on('pong', () => {
          if (process.env.NODE_ENV === 'development') {
            console.log('🏓 Pong received - connection is healthy');
          }
        });
        
        // Rejoin current room after reconnection
        setTimeout(() => {
          if (currentOrderId && isConnected) {
            if (process.env.NODE_ENV === 'development') {
              console.log('🔄 Rejoining order room after tab focus:', currentOrderId);
            }
            socketRef.current?.emit('join-order-room', currentOrderId);
          }
        }, 1000);
      }
    };

    // Handle page unload - disconnect only when page is actually closing
    const handleBeforeUnload = () => {
      if (socketRef.current) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔌 Page unloading - disconnecting socket');
        }
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isConnected, currentOrderId]);

  // Join order room
  const joinOrderRoom = (orderId: string) => {
    if (!socketRef.current || !isConnected) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Cannot join room - Socket not connected or not available');
        console.log('Socket available:', !!socketRef.current);
        console.log('Is connected:', isConnected);
      }
      return;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🚪 Attempting to join order room:', orderId);
    }
    
    // Check current order before updating
    const isSameOrder = currentOrderId === orderId;
    
    // Leave previous room if it exists and is different
    if (currentOrderId && !isSameOrder) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚪 Leaving previous room:', currentOrderId);
      }
    }
    
    // Join new room
    if (process.env.NODE_ENV === 'development') {
      console.log('🚪 Joining new room:', orderId);
    }
    socketRef.current.emit('join-order-room', orderId);
    setCurrentOrderId(orderId);
    setJoinedRoomId(orderId);
    
    // Clear messages only if different order
    if (!isSameOrder) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Different order - clearing messages');
      }
      setMessages([]);
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('📝 Same order - keeping existing messages');
      }
    }
    
    // Confirm room join
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Successfully joined room:', orderId);
    }
  };

  // Leave order room
  const leaveOrderRoom = () => {
    if (!socketRef.current) return;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🚪 Leaving order room:', currentOrderId);
    }
    // Don't clear messages - keep them in memory
    // setMessages([]);
    setCurrentOrderId(null);
    setJoinedRoomId(null);
  };

  // Send message
  const sendMessage = async (orderId: string, message: string, messageType: 'text' | 'image' = 'text') => {
    if (!message.trim()) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Cannot send message - Empty message');
      }
      return false;
    }
    
    if (!session?.user?.id) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Cannot send message - No user session');
      }
      return false;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📤 Sending message to order:', orderId);
      console.log('📤 Message content:', message);
      console.log('📤 Message type:', messageType);
      console.log('📤 Socket connected:', isConnected);
      console.log('📤 Sender ID:', session.user.id);
    }

    // Create optimistic message with temporary ID
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const optimisticMessage = {
      id: tempId,
      orderId,
      senderId: session.user.id,
      message: message.trim(),
      messageType,
      isSystem: false,
      timestamp: new Date(),
      isDelivered: false,
      isRead: false,
      senderRole: session.user.role || 'customer',
      senderName: session.user.username || session.user.name || 'You'
    };
    
    setMessages((prev: ChatMessage[]) => {
      const updatedMessages = [...prev, optimisticMessage];
      
      // Save updated messages in session data
      setSessionData((prevData: Map<string, ChatMessage[]>) => {
        const newData = new Map(prevData);
        newData.set(orderId, updatedMessages);
        return newData;
      });
      
      return updatedMessages;
    });
    
    // Try Socket.IO first if connected
    if (socketRef.current && isConnected) {
      try {
        socketRef.current.emit('send-message', {
          orderId,
          senderId: session.user.id,
          message: message.trim(),
          messageType,
          isSystem: false
        });
        
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Message sent via Socket.IO');
        }
        return true;
      } catch (socketError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Socket.IO send failed:', socketError);
        }
      }
    }
    
    // Fallback to API endpoint if Socket.IO fails or not connected
    try {
      const response = await fetch(`/api/chat/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          messageType
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Remove optimistic message and add real message
        setMessages((prev: ChatMessage[]) => {
          const filteredMessages = prev.filter((msg: ChatMessage) => msg.id !== tempId);
          const realMessage = {
            id: result.id,
            orderId: result.orderId,
            senderId: result.userId,
            message: result.message,
            messageType: result.messageType,
            isSystem: result.isSystem || false,
            timestamp: new Date(result.createdAt),
            isDelivered: true,
            isRead: false,
            senderRole: result.User?.role || session.user.role || 'customer',
            senderName: result.User?.username || result.User?.name || session.user.username || session.user.name || 'You'
          };
          
          const updatedMessages = [...filteredMessages, realMessage];
          
          // Save updated messages in session data
          setSessionData((prevData: Map<string, ChatMessage[]>) => {
            const newData = new Map(prevData);
            newData.set(orderId, updatedMessages);
            return newData;
          });
          
          return updatedMessages;
        });
        
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Message sent via API fallback');
        }
        return true;
      } else {
        throw new Error(`API request failed: ${response.status}`);
      }
    } catch (apiError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ API fallback failed:', apiError);
      }
      
      // Remove optimistic message on failure
      setMessages((prev: ChatMessage[]) => {
        const filteredMessages = prev.filter((msg: ChatMessage) => msg.id !== tempId);
        
        setSessionData((prevData: Map<string, ChatMessage[]>) => {
          const newData = new Map(prevData);
          newData.set(orderId, filteredMessages);
          return newData;
        });
        
        return filteredMessages;
      });
      
      return false;
    }
  };

  // Pin/unpin message
  const pinMessage = (messageId: string, isPinned: boolean) => {
    if (!socketRef.current || !isConnected) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Cannot pin message - Socket not connected');
      }
      return false;
    }
    
    if (!session?.user?.id) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Cannot pin message - No user session');
      }
      return false;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📌 Pinning message:', messageId, 'isPinned:', isPinned);
    }
    
    socketRef.current.emit('pin-message', {
      messageId,
      isPinned,
      userId: session.user.id
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Pin message request sent successfully');
    }
    return true;
  };

  // Send notification (admin only)
  const sendNotification = (
    type: string,
    message: string,
    targetUserId?: string,
    orderId?: string
  ) => {
    if (!socketRef.current || !isConnected) return false;
    
    socketRef.current.emit('send-notification', {
      type,
      message,
      targetUserId,
      orderId
    });
    
    return true;
  };

  // Clear notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  // Clear specific notification
  const removeNotification = (index: number) => {
    setNotifications((prev: Notification[]) => prev.filter((_, i) => i !== index));
  };

  // Clear sent messages counter
  const clearSentMessages = () => {
    setSentMessages(0);
  };

  // Clear unread messages counter
  const clearUnreadMessages = () => {
    setUnreadMessagesCount(0);
  };

  // Clear all messages and session data (for complete clear all functionality)
  const clearAllMessages = () => {
    setMessages([]);
    setSessionData(new Map());
    sessionDataRef.current = new Map();
    setUnreadMessagesCount(0);
    if (process.env.NODE_ENV === 'development') {
      console.log('🗑️ Cleared all messages and session data');
    }
  };

  // Function to determine unread message count from current messages
  const getUnreadMessagesCount = () => {
    if (!session?.user?.id) return 0;
    return messages.filter((msg: ChatMessage) => 
      msg.senderId !== session.user.id && 
      !msg.isRead && 
      !msg.isSystem
    ).length;
  };

  // Function to mark messages as read
  const markMessagesAsRead = (orderId: string) => {
    if (!socketRef.current || !isConnected) return;
    
    socketRef.current.emit('mark-messages-read', { orderId });
    
    // Emit unread count update to admin panel
    socketRef.current.emit('unreadCountUpdate', { orderId, count: 0 });
  };
  
  // Manual refresh messages
  const refreshMessages = async (orderId: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Manual refresh messages for order:', orderId);
    }
    
    try {
      const response = await fetch(`/api/messages?orderId=${orderId}`);
      if (response.ok) {
        const data = await response.json();
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Manual refresh - Messages fetched:', data.messages?.length || 0);
        }
        setMessages(data.messages || []);
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Manual refresh - Failed to fetch messages:', response.status);
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Manual refresh - Error fetching messages:', error);
      }
    }
  };

  // Update messages manually when connection fails
  const refreshMessagesManually = useCallback(async (orderId: string) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Manually refreshing messages for order:', orderId);
      }
      
      // Retrieve locally saved messages
      const cachedMessages = sessionDataRef.current.get(orderId) || [];
      
      const response = await fetch(`/api/chat/messages/${orderId}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.messages) {
          const dbMessages = data.messages.map((msg: any): ChatMessage => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          
          // Merge local messages with database messages
          const mergedMessages = mergeMessages(cachedMessages, dbMessages);
          
          // Save messages in session data
          setSessionData((prevData: Map<string, ChatMessage[]>) => {
            const newData = new Map(prevData);
            newData.set(orderId, mergedMessages);
            return newData;
          });
          
          setMessages(mergedMessages);
          setLastMessageRefresh(new Date());
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Manual message refresh and merge successful:', mergedMessages.length, 'messages');
          }
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ Manual message refresh failed:', response.status);
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error during manual message refresh:', error);
      }
    }
  }, []);
  
  // Track current order changes and reload messages
  useEffect(() => {
    if (currentOrderId) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Order changed, loading messages for:', currentOrderId);
      }
      
      // Load saved messages immediately
      const cachedMessages = sessionDataRef.current.get(currentOrderId) || [];
      if (cachedMessages.length > 0) {
        if (process.env.NODE_ENV === 'development') {
          console.log('📦 Loading cached messages:', cachedMessages.length, 'messages');
        }
        setMessages(cachedMessages);
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('⚠️ No cached messages found, clearing current messages');
        }
        setMessages([]);
      }
      
      setUnreadMessagesCount(0);
      
      if (isConnected) {
        // Join new room only if not already joined
        if (socketRef.current && joinedRoomId !== currentOrderId) {
          socketRef.current.emit('join-order-room', currentOrderId);
          setJoinedRoomId(currentOrderId);
          if (process.env.NODE_ENV === 'development') {
            console.log('🏠 Joined room for order:', currentOrderId);
          }
        }
        
        // Update messages from database after short delay
        const timer = setTimeout(() => {
          refreshMessagesManually(currentOrderId);
        }, 500);
        
        return () => clearTimeout(timer);
      } else {
        // If no connection, try to load messages manually
        const timer = setTimeout(() => {
          refreshMessagesManually(currentOrderId);
        }, 100);
        
        return () => clearTimeout(timer);
      }
    }
  }, [currentOrderId, isConnected, joinedRoomId]);

  // Auto-refresh mechanism for messages every 30 seconds if connection is down
   useEffect(() => {
     if (!isConnected && currentOrderId && connectionRetries > 0) {
       if (process.env.NODE_ENV === 'development') {
         console.log('🔄 Setting up auto-refresh for disconnected state');
       }
       
       const autoRefreshInterval = setInterval(() => {
         if (process.env.NODE_ENV === 'development') {
           console.log('🔄 Auto-refreshing messages due to disconnection');
         }
         refreshMessagesManually(currentOrderId);
       }, 30000); // Every 30 seconds
       
       return () => {
         if (process.env.NODE_ENV === 'development') {
           console.log('🛑 Clearing auto-refresh interval');
         }
         clearInterval(autoRefreshInterval);
       };
     }
   }, [isConnected, currentOrderId, connectionRetries]);

  // Retrieve saved session data
  const getSessionData = useCallback((orderId: string): ChatMessage[] => {
    return sessionData.get(orderId) || [];
  }, [sessionData]);
  
  // Clear specific session data
  const clearSessionData = useCallback((orderId: string) => {
    setSessionData((prevData: Map<string, ChatMessage[]>) => {
      const newData = new Map(prevData);
      newData.delete(orderId);
      return newData;
    });
    if (process.env.NODE_ENV === 'development') {
      console.log('🗑️ Cleared session data for order:', orderId);
    }
  }, []);
  
  // Clear all session data
  const clearAllSessionData = useCallback(() => {
    setSessionData(new Map());
    if (process.env.NODE_ENV === 'development') {
      console.log('🗑️ Cleared all session data');
    }
  }, []);

  // Merge messages from different sources
  const mergeMessages = useCallback((localMessages: ChatMessage[], dbMessages: ChatMessage[]): ChatMessage[] => {
    const messageMap = new Map<string, ChatMessage>();
    
    // Add database messages first
    dbMessages.forEach((msg: ChatMessage) => {
      messageMap.set(msg.id, {
        ...msg,
        timestamp: new Date(msg.timestamp)
      });
    });
    
    // Add local messages (update if found)
    localMessages.forEach((msg: ChatMessage) => {
      if (!msg.id.startsWith('temp_')) {
        messageMap.set(msg.id, {
          ...msg,
          timestamp: new Date(msg.timestamp)
        });
      }
    });
    
    // Sort messages by time
    return Array.from(messageMap.values()).sort((a: ChatMessage, b: ChatMessage) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, []);

  return {
    isConnected,
    messages,
    notifications,
    joinOrderRoom,
    leaveOrderRoom,
    sendMessage,
    pinMessage,
    sendNotification,
    clearNotifications,
    removeNotification,
    clearSentMessages,
    clearUnreadMessages,
    clearAllMessages,
    getUnreadMessagesCount,
    markMessagesAsRead,
    refreshMessagesManually,
    sentMessages,
    unreadMessagesCount,
    socket: socketRef.current,
    connectionRetries,
    lastMessageRefresh,
    getSessionData,
    clearSessionData,
    clearAllSessionData,
    mergeMessages
  };
};

export default useSocket;