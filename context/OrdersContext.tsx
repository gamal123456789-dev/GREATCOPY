import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useSocket } from '../hooks/useSocket';

interface Order {
  id: string;
  customerName: string;
  game: string;
  service: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  price: number;
  date: string;
  notes?: string;
}

interface OrdersContextType {
  orders: Order[];
  addOrder: (order: Order) => Promise<boolean>;
  updateOrder: (orderId: string, updates: Partial<Order>) => Promise<void>;
  updateOrderStatus: (orderId: string, newStatus: Order['status']) => Promise<void>;
  updateOrderDetails: (orderId: string, updates: { status?: Order['status']; price?: number; service?: string; notes?: string }) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  refreshOrders: () => Promise<void>;
}

interface OrdersProviderProps {
  children: ReactNode;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export function OrdersProvider({ children }: OrdersProviderProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const { data: session } = useSession();
  const { isConnected, socket } = useSocket();

  useEffect(() => {
    if (!isConnected || !session?.user || !socket) {
      console.log('❌ Socket.IO not ready for order updates:', { isConnected, hasUser: !!session?.user, hasSocket: !!socket });
      return;
    }

    console.log('✅ Setting up Socket.IO event listeners for order updates');

    // Rejoin order room on reconnect
    const handleConnect = () => {
      console.log('🔄 Socket.IO reconnected, refreshing orders');
      refreshOrders();
    };

    const handleNewOrder = (orderData: any) => {
      console.log('📦 Received new-order event:', orderData);
      if (session.user.role === 'ADMIN' && orderData.order) {
        setOrders(prev => {
          // Check if order already exists to avoid duplicates
          const exists = prev.some(order => order.id === orderData.order.id);
          if (!exists) {
            const newOrders = [orderData.order, ...prev];
            console.log('✅ Updated orders with new order:', orderData.order.id);
            return newOrders;
          }
          console.log('⚠️ Order already exists, skipping:', orderData.order.id);
          return prev;
        });
      } else {
        console.log('⚠️ Invalid new order data or not admin:', orderData);
      }
    };

    const handleOrderStatusUpdate = (data: any) => {
      console.log('📋 Received order-status-updated event:', data);
      if (data.orderId && data.status) {
        setOrders(prev => {
          const updated = prev.map(order => 
            order.id === data.orderId 
              ? { ...order, status: data.status }
              : order
          );
          console.log('✅ Updated order status:', data.orderId, 'to', data.status);
          return updated;
        });
      } else {
        console.log('⚠️ Invalid order status update data:', data);
      }
    };

    // Listen for Socket.IO events
    socket.on('connect', handleConnect);
    socket.on('new-order', handleNewOrder);
    socket.on('order-status-updated', handleOrderStatusUpdate);

    return () => {
      console.log('🧹 Cleaning up Socket.IO event listeners for orders');
      socket.off('connect', handleConnect);
      socket.off('new-order', handleNewOrder);
      socket.off('order-status-updated', handleOrderStatusUpdate);
    };
  }, [isConnected, socket, session?.user?.role]);

  // Load orders on mount and when session changes
  useEffect(() => {
    if (session?.user) {
      refreshOrders();
    } else {
      setOrders([]);
    }
  }, [session]);


  // Handle visibility state change (tab switching)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && session?.user) {
        console.log('🔄 Tab became visible, refreshing orders data');
        refreshOrders();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session?.user]);

  const refreshOrders = async () => {
    try {
      // Check if user is admin to fetch all orders
      const isAdmin = session?.user?.role === 'ADMIN';
      const endpoint = isAdmin ? '/api/admin/orders' : '/api/orders';
      
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        // For admin endpoint, data is directly the orders array
        // For user endpoint, data has orders property
        setOrders(isAdmin ? data : (data.orders || []));
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const addOrder = async (order: Order): Promise<boolean> => {
    try {
      console.log('🔄 Attempting to create order:', {
        orderId: order.id,
        customerName: order.customerName,
        game: order.game,
        service: order.service,
        status: order.status,
        price: order.price,
        date: order.date
      });

      // Log session state for debugging
      console.log('🔐 Session state during order creation:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        sessionStatus: status
      });

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify(order),
      });

      console.log('📡 API Response status:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Order created successfully:', data.order);
        setOrders(prev => [...prev, data.order]);
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Failed to create order - API response not ok:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          requestBody: order,
          sessionInfo: {
            hasSession: !!session,
            userId: session?.user?.id,
            sessionStatus: status
          }
        });
        
        // Specific handling for authentication errors
        if (response.status === 401) {
          console.error('🚫 Authentication failed - session may have expired');
        }
        
        return false;
      }
    } catch (error) {
      console.error('❌ Network error while creating order:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        requestBody: order
      });
      return false;
    }
  };

  const updateOrder = async (orderId: string, updates: Partial<Order>) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const data = await response.json();
        const updatedOrderData = data.order || data;
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, ...updatedOrderData } : order
        ));
      } else {
        throw new Error('Failed to update order');
      }
    } catch (error) {
      console.error('Failed to update order:', error);
      throw error;
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Update local state immediately for better UX
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        ));
      } else {
        throw new Error('Failed to update order status');
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
      throw error;
    }
  };

  const updateOrderDetails = async (orderId: string, updates: { status?: Order['status']; price?: number; service?: string; notes?: string }) => {
    try {
      // Use admin endpoint for order updates
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const data = await response.json();
        // Update local state immediately for better UX
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, ...updates } : order
        ));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update order details');
      }
    } catch (error) {
      console.error('Failed to update order details:', error);
      throw error;
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setOrders(prev => prev.filter(order => order.id !== orderId));
      } else {
        throw new Error('Failed to delete order');
      }
    } catch (error) {
      console.error('Failed to delete order:', error);
      throw error;
    }
  };

  return (
    <OrdersContext.Provider value={{
      orders,
      addOrder,
      updateOrder,
      updateOrderStatus,
      updateOrderDetails,
      deleteOrder,
      refreshOrders
    }}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders(): OrdersContextType {
  const context = useContext(OrdersContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrdersProvider');
  }
  return context;
}
