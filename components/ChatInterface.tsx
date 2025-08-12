import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useSocket, ChatMessage } from '../hooks/useSocket';
import ImageDisplay from './ImageDisplay';

interface ChatInterfaceProps {
  orderId: string;
  className?: string;
}

/**
 * Real-time Chat Interface Component
 * Supports text messages and real-time communication between customers and admin
 */
const ChatInterface: React.FC<ChatInterfaceProps> = ({ orderId, className = '' }) => {
  const { data: session } = useSession();
  const {
    isConnected,
    messages: socketMessages,
    notifications,
    joinOrderRoom,
    leaveOrderRoom,
    sendMessage,
    markMessagesAsRead,
    refreshMessagesManually,
    connectionRetries,
    lastMessageRefresh,
    unreadMessagesCount,
    clearUnreadMessages,
    getSessionData,
    clearSessionData,
    mergeMessages
  } = useSocket();
  

  
  
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [imagePreviewData, setImagePreviewData] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [uploadTimeEstimate, setUploadTimeEstimate] = useState(0);
  // Removed pinned messages variables

  const [messagesLoaded, setMessagesLoaded] = useState(false);
  // Removed showScrollButton state - scroll button is now always visible
  // Removed lastMessageRef to prevent auto-scrolling

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);






  const isAdmin = session?.user?.role === 'ADMIN';

  // Load saved messages immediately when orderId changes (only once)
  useEffect(() => {
    if (orderId && getSessionData && !messagesLoaded) {
      console.log('📦 Loading saved messages for order:', orderId);
      const cachedMessages = getSessionData(orderId);
      if (cachedMessages.length > 0) {
        console.log('✅ Found saved messages:', cachedMessages.length, 'messages');
        setMessagesLoaded(true);
        // Messages will be managed automatically through useSocket
      } else {
        console.log('⚠️ No saved messages for order:', orderId);
      }
    }
  }, [orderId, getSessionData, messagesLoaded]);

  // Join order room on load (only once per order)
  useEffect(() => {
    if (orderId && !messagesLoaded) {
      console.log('🔗 ChatInterface: Setting up chat for order', orderId);
      
      if (isConnected) {
        console.log('✅ Socket connected - joining order room');
        joinOrderRoom(orderId);
        setMessagesLoaded(true);
        // Mark messages as read when opening chat
        setTimeout(() => {
          markMessagesAsRead(orderId);
        }, 1000);
      } else {
        console.log('❌ Socket not connected - loading messages manually');
        // Load messages manually when no connection
        if (refreshMessagesManually) {
          console.log('🔄 ChatInterface: Loading messages manually');
          refreshMessagesManually(orderId);
          setMessagesLoaded(true);
        }
      }
    }
    
    return () => {
      // Keep connection alive when leaving chat interface
      // Don't disconnect or leave room - maintain connection for better UX
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 ChatInterface cleanup - keeping connection and room active');
      }
    };
  }, [orderId, isConnected, messagesLoaded]);
  
  // Load messages on reconnection only if not already loaded
  useEffect(() => {
    if (orderId && isConnected && !messagesLoaded) {
      // If there are no messages and we haven't loaded them yet, load them
      if (socketMessages.length === 0) {
        console.log('🔄 No messages found - loading messages for order', orderId);
        joinOrderRoom(orderId);
        setMessagesLoaded(true);
        // Also update messages manually to ensure
        setTimeout(() => {
          if (refreshMessagesManually) {
            refreshMessagesManually(orderId);
          }
        }, 500);
      }
    }
  }, [isConnected, orderId, messagesLoaded]);
  
  // Force re-render when new messages arrive to ensure immediate display
  useEffect(() => {
    if (socketMessages.length > 0) {
      // Force component re-render to show new messages immediately
      const timer = setTimeout(() => {
        // Trigger a state update to force re-render
        setMessagesLoaded(prev => prev);
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [socketMessages.length, socketMessages]);
  
  // Listen for image messages specifically to ensure immediate display
  useEffect(() => {
    const handleImageMessage = (event: CustomEvent) => {
      console.log('🖼️ ChatInterface: Received image message event', event.detail);
      const messageData = event.detail;
      
      // Only process if this message belongs to current order
      if (messageData.orderId === orderId) {
        console.log('🔄 Forcing immediate re-render for image in current order');
        
        // Multiple strategies to ensure immediate display
        setMessagesLoaded(prev => !prev); // Toggle to force re-render
        
        // Force component update with a small delay
        setTimeout(() => {
          setMessagesLoaded(prev => !prev); // Toggle back
          // Additional force update
          const chatContainer = document.querySelector('.chat-messages-container');
          if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
          }
        }, 50);
        
        // Additional update after a longer delay to ensure image loads
        setTimeout(() => {
          setMessagesLoaded(prev => !prev);
          setTimeout(() => setMessagesLoaded(prev => !prev), 10);
        }, 200);
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('socket-new-image-message', handleImageMessage as EventListener);
      
      return () => {
        window.removeEventListener('socket-new-image-message', handleImageMessage as EventListener);
      };
    }
  }, [orderId]);
  
  // Reset messagesLoaded when orderId changes
  useEffect(() => {
    if (orderId) {
      setMessagesLoaded(false);
    }
  }, [orderId]);
  
  // Auto-scroll to bottom when messages change (only if messages exist)
  useEffect(() => {
    if (socketMessages.length > 0) {
      scrollToBottom();
    }
  }, [socketMessages]);

  // Auto-scroll to bottom on initial load (only if messages exist)
  useEffect(() => {
    if (socketMessages.length > 0) {
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [socketMessages.length]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Removed handleScroll function - no auto-scroll behavior needed

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!newMessage.trim() && !selectedFile) || isLoading) return;
    
    setIsLoading(true);
    
    try {
      if (selectedFile) {
        // Send image message
        const success = await sendImageMessage(selectedFile, newMessage.trim());
        if (success) {
          setNewMessage('');
          setSelectedFile(null);
          setImagePreviewData([]);
          setTimeout(() => scrollToBottom(), 100);
        }
      } else {
        // Send text message
        const success = await sendMessage(orderId, newMessage.trim());
        if (success) {
          setNewMessage('');
          setTimeout(() => scrollToBottom(), 100);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
    
    setIsLoading(false);
  };

  const sendImageMessage = async (file: File, message: string = '') => {
    try {
      // Create optimistic image message for immediate display
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const imageUrl = URL.createObjectURL(file);
      
      const optimisticMessage = {
        id: tempId,
        orderId,
        senderId: session?.user?.id || '',
        senderName: session?.user?.username || session?.user?.name || 'You',
        message: message.trim() || 'Image',
        messageType: 'image' as const,
        imageUrl: imageUrl,
        isSystem: false,
        timestamp: new Date(),
        isDelivered: false,
        isRead: false,
        senderRole: session?.user?.role || 'customer'
      };

      // Add optimistic message immediately - Force update through custom event
      window.dispatchEvent(new CustomEvent('socket-new-image-message', {
        detail: optimisticMessage
      }));

      const formData = new FormData();
      formData.append('image', file);
      if (message.trim()) {
        formData.append('message', message.trim());
      }

      const response = await fetch(`/api/chat/${orderId}`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Image message sent successfully:', result);
        
        // Clean up the temporary object URL
        URL.revokeObjectURL(imageUrl);
        
        return true;
      } else {
        console.error('Failed to send image message');
        // Clean up the temporary object URL on failure
        URL.revokeObjectURL(imageUrl);
        return false;
      }
    } catch (error) {
      console.error('Error sending image message:', error);
      return false;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview for any file type
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = {
          name: file.name,
          size: formatFileSize(file.size),
          url: e.target?.result as string,
          preview: e.target?.result as string
        };
        setImagePreviewData([preview]);
        setShowImagePreview(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const cancelSendImages = () => {
    setSelectedFile(null);
    setImagePreviewData([]);
    setShowImagePreview(false);
  };

  const confirmSendImages = () => {
    if (selectedFile) {
      setShowImagePreview(false);
      handleSendMessage(new Event('submit') as any);
    }
  };

  const removeImageFromPreview = (index: number) => {
    setImagePreviewData(prev => prev.filter((_, i) => i !== index));
    if (imagePreviewData.length === 1) {
      setSelectedFile(null);
      setShowImagePreview(false);
    }
  };

  const [currentEmojiPage, setCurrentEmojiPage] = useState(0);
  
  const emojiPages = [
    {
      name: 'Happy Faces',
      emojis: [
        '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
        '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
        '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔'
      ]
    },
    {
      name: 'Other Faces',
      emojis: [
        '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
        '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧',
        '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐'
      ]
    },
    {
      name: 'Hands & Gestures',
      emojis: [
        '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
        '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏',
        '🙌', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶'
      ]
    },
    {
      name: 'Hearts & Symbols',
      emojis: [
        '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
        '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
        '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐'
      ]
    },
    {
      name: 'Games & Activities',
      emojis: [
        '🎮', '🕹️', '🎯', '🎲', '🃏', '🎴', '🀄', '🎪', '🎨', '🎭',
        '🎪', '🎨', '🎭', '🎪', '🎨', '🎭', '🏆', '🥇', '🥈', '🥉',
        '🏅', '🎖️', '🏵️', '🎗️', '🎫', '🎟️', '🎪', '🎨', '🎭', '🎪'
      ]
    },
    {
      name: 'Food & Drink',
      emojis: [
        '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒',
        '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬',
        '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠'
      ]
    }
  ];

  const handleEmojiClick = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  const insertEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    // Focus back to input
    const messageInput = document.querySelector('input[placeholder*="message"]') as HTMLInputElement;
    if (messageInput) {
      messageInput.focus();
    }
  };

  const handleSystemEmojiPicker = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform.toLowerCase();
    
    // Try to open system emoji picker
    if (userAgent.includes('windows') || platform.includes('win')) {
      // Windows: Win + . or Win + ;
      try {
        // Create a proper Windows key event
        const event = new KeyboardEvent('keydown', {
          key: 'Meta',
          code: 'MetaLeft',
          metaKey: true,
          bubbles: true,
          cancelable: true
        });
        
        const periodEvent = new KeyboardEvent('keydown', {
          key: '.',
          code: 'Period',
          metaKey: true,
          bubbles: true,
          cancelable: true
        });
        
        document.dispatchEvent(event);
        setTimeout(() => document.dispatchEvent(periodEvent), 50);
        
      } catch (error) {
        console.log('System emoji picker not available, using built-in picker');
        setShowEmojiPicker(true);
      }
    } else if (userAgent.includes('mac') || platform.includes('mac')) {
      // macOS: Ctrl + Cmd + Space
      try {
        const event = new KeyboardEvent('keydown', {
          key: ' ',
          code: 'Space',
          ctrlKey: true,
          metaKey: true,
          bubbles: true,
          cancelable: true
        });
        document.dispatchEvent(event);
      } catch (error) {
        console.log('System emoji picker not available, using built-in picker');
        setShowEmojiPicker(true);
      }
    } else {
      // For mobile and other platforms, use built-in picker
      setShowEmojiPicker(true);
    }
  };

  // Mark messages as read when user views them
  useEffect(() => {
    if (socketMessages.length > 0 && isConnected) {
      const unreadMessages = socketMessages.filter(msg => 
        msg.senderId !== session?.user?.id && !msg.isRead
      );
      
      if (unreadMessages.length > 0) {
        // Mark messages as read after a short delay
        const timer = setTimeout(() => {
          markMessagesAsRead(orderId);
          clearUnreadMessages();
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [socketMessages, isConnected, orderId, session?.user?.id, markMessagesAsRead]);

  // Update browser title with unread count
  useEffect(() => {
    const originalTitle = document.title;
    if (unreadMessagesCount > 0) {
      document.title = `(${unreadMessagesCount}) ${originalTitle.replace(/^\(\d+\) /, '')}`;
    } else {
      document.title = originalTitle.replace(/^\(\d+\) /, '');
    }
    
    return () => {
      document.title = originalTitle.replace(/^\(\d+\) /, '');
    };
  }, [unreadMessagesCount]);

  // Request notification permission on component mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Handle pin/unpin message
  // Removed message pinning function

  // Removed function to fetch pinned messages

  const formatMessageTime = (timestamp: Date | string) => {
  const date = new Date(timestamp);
  return isNaN(date.getTime()) ? '' : date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

  const getDisplayName = (message: ChatMessage) => {
    if (message.isSystem) return 'System';
    if (message.senderRole === 'ADMIN') return 'Support Team';
    
    // Fallback for customer name
    return message.senderName || 'Customer';
  };

  const getNameColor = (message: ChatMessage) => {
    if (message.isSystem || message.senderRole === 'ADMIN') {
      return 'text-red-500 font-semibold';
    }
    return 'text-green-400 font-semibold'; // Distinctive green color for customer names
  };



  const getMessageAlignment = (message: ChatMessage) => {
    if (message.isSystem) return 'justify-center';
    if (message.senderId === session?.user?.id) return 'justify-end';
    return 'justify-start';
  };

  const getMessageStyle = (message: ChatMessage) => {
    if (message.isSystem) {
      return 'bg-gray-700 text-gray-200 text-center italic';
    }
    if (message.senderId === session?.user?.id) {
      return 'bg-blue-700 text-white border-blue-600';
    }
    return 'bg-gray-800 text-white border-gray-700';
  };













  return (
    <>
    <div 
      ref={chatContainerRef}
      className={`flex flex-col bg-gray-900 border border-gray-700 rounded-lg ${className}`}
      style={{
        height: '750px',
        minHeight: '750px',
        maxHeight: '750px',
        position: 'relative',
        transform: 'translateZ(0)',
        willChange: 'auto'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-white">
            💬 Chat Support
          </h3>
          {/* Unread Messages Counter */}
          {unreadMessagesCount > 0 && (
            <div className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
              {unreadMessagesCount}
            </div>
          )}
        </div>
        {/* Connection Status Indicator */}
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <span className={`text-xs ${
            isConnected ? 'text-green-400' : 'text-red-400'
          }`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          {connectionRetries > 0 && !isConnected && (
             <span className="text-xs text-yellow-400">
               (Retrying...)
             </span>
           )}
           {/* Manual Refresh Button */}
           <button
             onClick={() => refreshMessagesManually && refreshMessagesManually(orderId)}
             className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded transition-colors"
             title="Refresh messages manually"
           >
             🔄 Refresh
           </button>
         </div>
        </div>
        {/* Connection Warning */}
        {!isConnected && (
          <div className="mt-2 p-2 bg-yellow-900 border border-yellow-600 rounded text-yellow-200 text-xs">
            ⚠️ Connection lost. Messages will be refreshed automatically. You can still send messages.
            <br />
            Last refresh: {lastMessageRefresh ? new Date(lastMessageRefresh).toLocaleTimeString() : 'Never'}
          </div>
        )}

      {/* Removed pinned messages section */}

      {/* Messages Area with Manual Scroll */}
      {/* Messages Area - Now with flex-grow and a defined height container */}
      <div className="flex-1 flex flex-col min-h-0">
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900 relative"
          style={{ 
            scrollBehavior: 'auto', 
            overflowAnchor: 'none',
            scrollbarGutter: 'stable',
            contain: 'layout style paint',
            position: 'relative',
            transform: 'translateZ(0)',
            willChange: 'auto',
            overscrollBehavior: 'contain'
          }}
        >
        {!isConnected ? (
          <div className="flex-1 flex items-center justify-center text-center p-4">
            <div>
              <div className="text-red-400 text-xl mb-2">⚠️</div>
              <p className="text-gray-300 mb-2">🔌 No connection to server</p>
              <p className="text-gray-400 text-sm mb-4">Please make sure you are logged in and reload the page</p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white text-sm transition-colors"
              >
                🔄 Reload Page
              </button>
            </div>
          </div>
        ) : socketMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-300">
            <svg className="w-12 h-12 mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
              />
            </svg>
            <p className="text-center">
              💭 No messages yet<br />
              <span className="text-sm text-gray-400">Start the conversation by sending a message</span>
            </p>
          </div>
        ) : (
          socketMessages.map((message, index) => {
            const isCurrentUser = message.senderId === session?.user?.id;
            const messageStyle = getMessageStyle(message);
            return (
              <div 
                key={message.id || index} 
                className={`flex w-full ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}
              >
                <div className={`flex flex-col max-w-[70%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-medium ${getNameColor(message)}`}>
                      {getDisplayName(message)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatMessageTime(message.timestamp)}
                    </span>
                    {/* Message Status Indicators */}
                    {isCurrentUser && (
                      <span className="text-xs text-gray-400 ml-1">
                        {message.isRead ? '✓✓' : '✓'}
                      </span>
                    )}
                    {/* Removed pinning buttons */}
                  </div>
                  <div 
                    className={`rounded-lg px-4 py-2 shadow-md ${messageStyle} ${message.isSystem ? 'italic' : ''}`}
                  >
                  <div className="whitespace-pre-wrap break-words">
                    {message.messageType === 'image' ? (
                      <div>
                        <div className="mb-3 text-sm opacity-75 flex items-center gap-2">
                          📸 <span>Attached image</span>
                        </div>
                        <ImageDisplay
                          src={message.imageUrl || message.message}
                           alt="Attached image"
                           className="max-w-[200px] max-h-[150px] w-auto h-auto rounded-lg border border-gray-600 shadow-xl hover:shadow-2xl transition-shadow duration-300 cursor-pointer ml-2"
                           onClick={() => setSelectedImage(message.imageUrl || message.message)}
                           showHoverOverlay={true}
                        />
                      </div>
                    ) : (
                      message.message
                    )}
                  </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        </div>
      </div>

      {/* New image preview section - Enhanced design */}
      {showImagePreview && imagePreviewData.length > 0 && (
        <div className="border-t border-gray-700 bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900 p-6">
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl p-6 border border-gray-600 shadow-2xl backdrop-blur-sm">
            {/* Title */}
            <div className="text-center mb-6">
              <h3 className="text-white text-xl font-bold mb-2 flex items-center justify-center gap-3">
                <span className="text-2xl animate-pulse">🖼️</span>
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  File Preview
                </span>
              </h3>
              <p className="text-gray-400 text-sm">
                {imagePreviewData.length} file(s) selected • Click ❌ to remove any file
              </p>
            </div>
            
            {/* Enhanced image grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {imagePreviewData.map((item, index) => (
                <div key={index} className="relative group bg-gray-800 rounded-xl overflow-hidden border border-gray-600 hover:border-blue-500 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-blue-500/20">
                  {/* Image */}
                  <div className="relative aspect-video overflow-hidden bg-gray-700">
                    <img
                      src={item.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        console.error('Error loading image:', item.preview);
                        e.currentTarget.style.display = 'none';
                      }}
                      onLoad={() => {
                        console.log('Image loaded successfully:', item.preview);
                      }}
                    />
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Delete button */}
                    <button
                      onClick={() => removeImageFromPreview(index)}
                      className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110 shadow-lg"
                      title="Delete this file"
                    >
                      ❌
                    </button>
                    
                    {/* Image number */}
                    <div className="absolute top-3 left-3 bg-blue-600 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                      {index + 1}
                    </div>
                    
                    {/* Zoom icon */}
                    <div className="absolute bottom-3 right-3 bg-gray-900/80 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      🔍
                    </div>
                  </div>
                  
                  {/* File information */}
                  <div className="p-4 bg-gradient-to-r from-gray-800 to-gray-750">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-medium text-sm truncate flex-1 mr-2" title={item.name}>
                        📄 {item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name}
                      </h4>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 flex items-center gap-1">
                        📊 <span>{item.size}</span>
                      </span>
                      <span className="text-green-400 font-medium">
                        ✅ Ready to send
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Enhanced control buttons */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <button
                onClick={cancelSendImages}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl transition-all duration-300 text-lg font-bold shadow-xl hover:shadow-2xl hover:shadow-red-500/25 flex items-center justify-center gap-3 transform hover:scale-105"
              >
                <span className="text-xl">🚫</span>
                <span>Cancel All</span>
              </button>
              
              <button
                onClick={confirmSendImages}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl transition-all duration-300 text-lg font-bold shadow-xl hover:shadow-2xl hover:shadow-green-500/25 flex items-center justify-center gap-3 transform hover:scale-105"
              >
                <span className="text-xl">🚀</span>
                <span>Send ({imagePreviewData.length}) file(s)</span>
              </button>
            </div>
            
            {/* Helpful tips */}
            <div className="mt-6 p-4 bg-blue-900/30 border border-blue-600/30 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-blue-400 text-lg">💡</span>
                <div className="text-sm text-blue-200">
                  <p className="font-medium mb-1">Helpful tips:</p>
                  <ul className="text-xs text-blue-300 space-y-1">
                    <li>• You can delete any file by clicking ❌ in the corner</li>
                    <li>• No size limits - upload any file size</li>
                    <li>• All file types supported - images, videos, documents, etc.</li>
                    <li>• Drag & drop files directly into the chat area</li>
                    <li>• Files are uploaded in their original quality without compression</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Enhanced upload progress indicator */}
      {isLoading && uploadProgress.total > 0 && (
        <div className="border-t border-gray-700 bg-gradient-to-br from-gray-800 via-blue-900/20 to-gray-900 p-6">
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl p-6 border border-blue-600/30 shadow-2xl">
            <div className="flex flex-col items-center space-y-6">
              {/* Title and icon */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-4 mb-3">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500/30 border-t-blue-500"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-blue-400 text-lg">📤</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-white text-xl font-bold">
                      Uploading files...
                    </h3>
                    <p className="text-gray-400 text-sm">
                      ({uploadProgress.current} of {uploadProgress.total}) file(s)
                    </p>
                    {uploadTimeEstimate > 0 && (
                      <p className="text-green-400 text-xs mt-1">
                        ⏱️ ~{uploadTimeEstimate}s remaining
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Enhanced progress bar */}
              <div className="w-full max-w-lg">
                <div className="bg-gray-700 rounded-full h-4 shadow-inner border border-gray-600">
                  <div 
                    className="bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 h-4 rounded-full transition-all duration-700 shadow-lg relative overflow-hidden"
                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                  >
                    {/* Reflection effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                  </div>
                </div>
                
                {/* Percentage */}
                <div className="flex justify-between items-center mt-3">
                  <span className="text-sm text-gray-400">
                    🚀 Uploading...
                  </span>
                  <span className="text-lg font-bold text-white bg-blue-600 px-3 py-1 rounded-full">
                    {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%
                  </span>
                </div>
              </div>
              
              {/* Encouraging message */}
              <div className="text-center p-3 bg-blue-900/30 border border-blue-600/30 rounded-lg">
                <p className="text-blue-200 text-sm">
                  ⏳ Please wait until all files are uploaded
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="border-t border-gray-700 p-4 bg-gray-800">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          {/* Input with integrated send button */}
          <div className="flex-1 relative">
            <input
              ref={messageInputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
  
              placeholder={isConnected ? "💬 Type your message here..." : "🔄 Connecting..."}
              disabled={!isConnected || isLoading}
              className="w-full px-4 py-2 pr-12 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-700 disabled:cursor-not-allowed bg-gray-700 text-white placeholder-gray-400"
              dir="ltr"
            />
            {/* Send Button Inside Input */}
            <button
              type="submit"
              disabled={(!newMessage.trim() && !selectedFile) || !isConnected || isLoading}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 rounded text-white transition-colors"
            >
              ➤
            </button>
          </div>
          
          {/* Enhanced Emoji Button */}
          <div className="relative">
            <button
              type="button"
              onClick={handleEmojiClick}
              disabled={!isConnected || isLoading}
              className="group relative w-10 h-10 rounded-lg transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-br from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-600"
              title="Open emoji picker"
            >
              <span className="text-xl transition-all duration-300 group-hover:scale-125 group-hover:rotate-12 filter drop-shadow-sm">😊</span>
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
          
          {/* Image Upload Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={!isConnected || isLoading}
              className="group relative w-10 h-10 rounded-lg transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-br from-green-500 to-blue-500 hover:from-green-400 hover:to-blue-600"
              title="Upload file"
            >
              <span className="text-xl transition-all duration-300 group-hover:scale-125 group-hover:rotate-12 filter drop-shadow-sm">📎</span>
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
            
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="*"
              onChange={handleFileSelect}
              className="hidden"
              multiple={false}
            />
            
            {/* Built-in Emoji Picker - Fixed Rectangle with Pages */}
            {showEmojiPicker && (
              <div className="absolute bottom-12 right-0 bg-gray-800 border border-gray-600 rounded-lg shadow-2xl z-50 w-80 h-72">
                {/* Header */}
                <div className="flex justify-between items-center p-3 border-b border-gray-600">
                  <h3 className="text-white font-semibold text-sm">{emojiPages[currentEmojiPage].name}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSystemEmojiPicker}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
                      title="Open system picker"
                    >
                      System
                    </button>
                    <button
                      onClick={() => setShowEmojiPicker(false)}
                      className="text-gray-400 hover:text-white transition-colors text-lg"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                
                {/* Page Navigation */}
                <div className="flex overflow-x-auto p-2 border-b border-gray-600 bg-gray-750">
                  {emojiPages.map((page, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentEmojiPage(index)}
                      className={`flex-shrink-0 px-3 py-1 mx-1 rounded text-xs transition-colors ${
                        currentEmojiPage === index
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {page.name}
                    </button>
                  ))}
                </div>
                
                {/* Emoji Grid - Horizontal Scrolling */}
                <div className="p-2 h-40 overflow-hidden">
                  <div className="h-full overflow-x-auto overflow-y-hidden">
                    <div className="flex flex-wrap gap-1 h-full content-start">
                      {emojiPages[currentEmojiPage].emojis.map((emoji, index) => (
                        <button
                          key={index}
                          onClick={() => insertEmoji(emoji)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-gray-700 rounded transition-colors text-base flex-shrink-0"
                          title={emoji}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Footer */}
                <div className="p-2 border-t border-gray-600 bg-gray-750">
                  <div className="flex justify-between items-center">
                    <div className="flex gap-1">
                      <button
                        onClick={() => setCurrentEmojiPage(Math.max(0, currentEmojiPage - 1))}
                        disabled={currentEmojiPage === 0}
                        className="px-2 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-xs"
                      >
                        ← Previous
                      </button>
                      <button
                        onClick={() => setCurrentEmojiPage(Math.min(emojiPages.length - 1, currentEmojiPage + 1))}
                        disabled={currentEmojiPage === emojiPages.length - 1}
                        className="px-2 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-xs"
                      >
                        Next →
                      </button>
                    </div>
                    <p className="text-xs text-gray-400">
                      {currentEmojiPage + 1} / {emojiPages.length}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          

        </form>
        
        {!isConnected && (
          <div className="mt-2 text-sm text-red-600 text-center">
            ⚠️ No connection to server. Reconnecting...
          </div>
        )}
      </div>
    </div>

    {/* Full Page Image Modal - Outside all containers */}
   {selectedImage && (
     <div 
       className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999]"
       style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}
       onClick={() => setSelectedImage(null)}
     >
       <div className="relative w-full h-full flex items-center justify-center" style={{ padding: '40px' }}>
         <button
           onClick={() => setSelectedImage(null)}
           className="absolute top-4 right-4 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-30 transition-all z-10 text-lg font-bold border border-white border-opacity-30"
         >
           ✕
         </button>
         <img
           src={selectedImage}
           alt="Full size image"
           className="max-w-[60vw] max-h-[60vh] object-contain rounded-lg shadow-2xl"
           onClick={(e) => e.stopPropagation()}
           style={{
             filter: 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.5))'
           }}
         />
       </div>
     </div>
   )}
  </>
  );
};

export default ChatInterface;