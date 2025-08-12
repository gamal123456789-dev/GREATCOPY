// Middleware for application-level error handling
const { handleError, logError } = require('../lib/errorHandler');

// General error handler for Express/Next.js
function globalErrorHandler(err, req, res, next) {
  // Log the error
  const context = {
    userAgent: req.headers?.['user-agent'],
    ip: req.ip || req.connection?.remoteAddress,
    url: req.url,
    method: req.method,
    userId: req.session?.user?.id,
    body: req.method === 'POST' ? JSON.stringify(req.body) : undefined,
    query: JSON.stringify(req.query)
  };

  logError(err, context);

  // Handle error and send appropriate response
  if (!res.headersSent) {
    handleError(err, req, res);
  }
}

// Unhandled Promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  
  const error = new Error(`Unhandled Promise Rejection: ${reason}`);
  logError(error, {
    type: 'unhandledRejection',
    promise: promise.toString(),
    reason: reason.toString()
  });
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  
  logError(error, {
    type: 'uncaughtException',
    fatal: true
  });
  
  // Terminate process safely
  process.exit(1);
});

// Socket.IO error handler
function socketErrorHandler(socket) {
  socket.on('error', (error) => {
    const context = {
      socketId: socket.id,
      userId: socket.userId,
      ip: socket.handshake.address,
      userAgent: socket.handshake.headers['user-agent'],
      type: 'socket_error'
    };
    
    logError(error, context);
    
    // Send appropriate error message to client
    socket.emit('error_message', {
      message: 'A connection error occurred. Please reload the page.',
      type: 'connection_error'
    });
  });
  
  socket.on('disconnect', (reason) => {
    // Reduce noisy logging during development for common disconnect reasons
    if (process.env.NODE_ENV !== 'development' || (reason !== 'transport error' && reason !== 'client namespace disconnect')) {
      const context = {
        socketId: socket.id,
        userId: socket.userId,
        reason,
        type: 'socket_disconnect_error'
      };
      logError(new Error(`Socket disconnect: ${reason}`), context);
    }
  });
}

// Database error handler
function databaseErrorHandler(error, operation = 'unknown') {
  const context = {
    operation,
    type: 'database_error',
    timestamp: new Date().toISOString()
  };
  
  logError(error, context);
  
  // Return appropriate message for user
  return {
    success: false,
    message: 'A system error occurred. Please try again later.',
    errorType: 'database'
  };
}

// File error handler
function fileErrorHandler(error, operation = 'file_operation') {
  const context = {
    operation,
    type: 'file_error',
    timestamp: new Date().toISOString()
  };
  
  logError(error, context);
  
  return {
    success: false,
    message: 'An error occurred while processing the file. Please try again.',
    errorType: 'file'
  };
}

// Authentication error handler
function authErrorHandler(error, operation = 'auth') {
  const context = {
    operation,
    type: 'auth_error',
    timestamp: new Date().toISOString()
  };
  
  logError(error, context);
  
  return {
    success: false,
    message: 'Please log in to continue.',
    errorType: 'authentication',
    redirect: '/login'
  };
}

// Async function wrapper
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// API function wrapper
function apiWrapper(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      globalErrorHandler(error, req, res);
    }
  };
}

// Page function wrapper
function pageWrapper(handler) {
  return async (context) => {
    try {
      return await handler(context);
    } catch (error) {
      const errorInfo = handleError(error, context.req);
      
      return {
        redirect: {
          destination: `/error?message=${encodeURIComponent(errorInfo.message)}`,
          permanent: false
        }
      };
    }
  };
}

// Enhanced middleware for handling errors in API routes
function errorMiddleware(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      // Use enhanced error handler
      const errorResponse = handleError(error, {
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection.remoteAddress,
        userId: req.user?.id || null,
        timestamp: new Date().toISOString(),
        middleware: 'errorMiddleware'
      });
      
      // Send appropriate response
      res.status(errorResponse.statusCode).json(errorResponse.response);
    }
  };
}

// Special middleware for handling errors in protected routes
function protectedErrorMiddleware(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      // Special handling for errors in protected areas
      const errorResponse = handleError(error, {
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection.remoteAddress,
        userId: req.user?.id || null,
        timestamp: new Date().toISOString(),
        middleware: 'protectedErrorMiddleware',
        protected: true
      });
      
      // In case of authentication errors, add special headers
      if (errorResponse.statusCode === 401) {
        res.setHeader('WWW-Authenticate', 'Bearer');
      }
      
      res.status(errorResponse.statusCode).json(errorResponse.response);
    }
  };
}



module.exports = {
  globalErrorHandler,
  socketErrorHandler,
  databaseErrorHandler,
  fileErrorHandler,
  authErrorHandler,
  asyncHandler,
  apiWrapper,
  pageWrapper,
  errorMiddleware,
  protectedErrorMiddleware,

};