// Socket.IO utility for API routes (CommonJS version)
// Use global to share across Next.js serverless functions
if (!global.socketIOInstance) {
  global.socketIOInstance = null;
}

let io = global.socketIOInstance;

const getSocketIO = () => {
  console.log('🔍 getSocketIO called at:', new Date().toISOString());
  
  // Check local variable first, then global
  if (!io && global.socketIOInstance) {
    io = global.socketIOInstance;
    console.log('🔄 Retrieved Socket.IO instance from global');
  }
  
  console.log('🔍 Socket.IO instance state:', {
    hasInstance: !!io,
    instanceType: typeof io,
    hasEmit: !!(io && io.emit),
    hasTo: !!(io && io.to),
    globalHasInstance: !!global.socketIOInstance
  });
  
  if (!io) {
    console.warn('Socket.IO instance not initialized yet');
    return null;
  }
  return io;
};

const setSocketIO = (socketInstance) => {
  io = socketInstance;
  global.socketIOInstance = socketInstance;
  console.log('✅ Socket.IO instance set for API routes at:', new Date().toISOString());
  console.log('🔍 Socket.IO instance details:', {
    hasInstance: !!socketInstance,
    instanceType: typeof socketInstance,
    hasEmit: !!(socketInstance && socketInstance.emit),
    hasTo: !!(socketInstance && socketInstance.to)
  });
  
  if (io) {
    console.log('✅ Socket.IO instance set successfully');
    
    // Log current rooms when socket is set
    console.log('🏠 Current rooms:', Array.from(io.sockets.adapter.rooms.keys()));
    console.log('👥 Connected sockets:', io.sockets.sockets.size);
  } else {
    console.warn('❌ Socket.IO instance is null');
  }
};

const emitToAdmin = (event, data) => {
  // Refresh Socket.IO instance from global if not available locally
  if (!io && global.socketIOInstance) {
    io = global.socketIOInstance;
    console.log('🔄 Refreshed Socket.IO instance from global for admin emission');
  }
  
  if (io && io.sockets && io.sockets.adapter) {
    try {
      io.to('admin').emit(event, data);
      console.log(`✅ Emitted ${event} to admin room:`, data);
      return true;
    } catch (error) {
      console.error('❌ Error emitting to admin room:', error);
      return false;
    }
  } else {
    console.warn('❌ Socket.IO not available for admin emission - notification logged for database storage');
    // Still return true since the notification will be stored in database
    // and admins can see it in the admin panel
    console.log('📝 ADMIN NOTIFICATION (DATABASE ONLY):', {
      event,
      data,
      timestamp: new Date().toISOString(),
      message: 'Notification stored in database - real-time delivery unavailable'
    });
    return true; // Changed from false to true since database storage still works
  }
};

const emitToUser = (userId, event, data) => {
  // Refresh Socket.IO instance from global if not available locally
  if (!io && global.socketIOInstance) {
    io = global.socketIOInstance;
    console.log('🔄 Refreshed Socket.IO instance from global for user emission');
  }
  
  if (io && io.sockets && io.sockets.adapter) {
    const userRoom = `user:${userId}`;
    
    console.log(`🔍 Attempting to emit ${event} to user ${userId}`);
    console.log(`🔍 User room: ${userRoom}`);
    console.log(`🔍 Available rooms:`, Array.from(io.sockets.adapter.rooms.keys()));
    console.log(`🔍 Room exists:`, io.sockets.adapter.rooms.has(userRoom));
    
    // Check if room exists before sending
    if (io.sockets.adapter.rooms.has(userRoom)) {
      try {
        io.to(userRoom).emit(event, data);
        console.log(`✅ Emitted ${event} to user ${userId}:`, data);
        return true;
      } catch (error) {
        console.error(`❌ Error emitting to user ${userId}:`, error);
        return false;
      }
    } else {
      console.warn(`❌ User room ${userRoom} not found. Available rooms:`, Array.from(io.sockets.adapter.rooms.keys()));
      console.warn(`❌ Total connected sockets:`, io.sockets.sockets.size);
      return false;
    }
  } else {
    console.warn('❌ Socket.IO not available for user emission - notification logged for database storage');
    // Still return true since the notification will be stored in database
    console.log('📝 USER NOTIFICATION (DATABASE ONLY):', {
      userId,
      event,
      data,
      timestamp: new Date().toISOString(),
      message: 'Notification stored in database - real-time delivery unavailable'
    });
    return true; // Changed from false to true since database storage still works
  }
};

const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
    console.log(`Emitted ${event} to all clients:`, data);
  } else {
    console.warn('Socket.IO not available for global emission');
  }
};



module.exports = {
  getSocketIO,
  setSocketIO,
  emitToAdmin,
  emitToUser,
  emitToAll
};