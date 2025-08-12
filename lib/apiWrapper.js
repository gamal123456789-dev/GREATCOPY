// Wrapper for API routes to handle errors
const { handleError, logError } = require('./errorHandler');

// API routes wrapper function
function withErrorHandler(handler) {
  return async (req, res) => {
    try {
      // Check that response hasn't been sent yet
      if (res.headersSent) {
        return;
      }

      await handler(req, res);
    } catch (error) {
      // Gather context information
      const context = {
        userAgent: req.headers?.['user-agent'],
        ip: req.ip || req.connection?.remoteAddress || req.headers?.['x-forwarded-for'],
        url: req.url,
        method: req.method,
        userId: req.session?.user?.id || req.user?.id,
        body: req.method === 'POST' ? JSON.stringify(req.body) : undefined,
        query: JSON.stringify(req.query),
        timestamp: new Date().toISOString(),
        apiRoute: true
      };

      // Log the error
      logError(error, context);

      // Check again that response hasn't been sent
      if (!res.headersSent) {
        handleError(error, req, res);
      }
    }
  };
}

// Special wrapper function for API routes that need authentication
function withAuthErrorHandler(handler) {
  return withErrorHandler(async (req, res) => {
    try {
      // Check authentication
      if (!req.session?.user && !req.user) {
        return res.status(401).json({
          success: false,
          message: 'Please log in to continue.',
          errorType: 'authentication',
          redirect: '/login'
        });
      }

      await handler(req, res);
    } catch (error) {
      throw error; // Will be handled by withErrorHandler
    }
  });
}

// Special wrapper function for Admin API routes
function withAdminErrorHandler(handler) {
  return withAuthErrorHandler(async (req, res) => {
    try {
      const user = req.session?.user || req.user;
      
      // Check admin permissions
      if (!user || user.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this page.',
          errorType: 'authorization'
        });
      }

      await handler(req, res);
    } catch (error) {
      throw error; // Will be handled by withErrorHandler
    }
  });
}

// Special wrapper function for database operations
function withDatabaseErrorHandler(handler) {
  return withErrorHandler(async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      // Special handling for database errors
      if (error.code === 'P2002') {
        // Unique constraint violation
        return res.status(400).json({
          success: false,
          message: 'Data already exists. Please use different data.',
          errorType: 'validation'
        });
      }
      
      if (error.code === 'P2025') {
        // Record not found
        return res.status(404).json({
          success: false,
          message: 'The requested data was not found.',
          errorType: 'not_found'
        });
      }
      
      throw error; // Will be handled by withErrorHandler
    }
  });
}

// Special wrapper function for file upload operations
function withFileUploadErrorHandler(handler) {
  return withErrorHandler(async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      // Special handling for file upload errors
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size is too large. Maximum allowed size is 10MB.',
          errorType: 'file_size'
        });
      }
      
      if (error.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Too many files uploaded.',
          errorType: 'file_count'
        });
      }
      
      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          message: 'Unexpected file field.',
          errorType: 'file_field'
        });
      }
      
      throw error; // Will be handled by withErrorHandler
    }
  });
}



// Helper function to send unified success response
function sendSuccess(res, data = null, message = 'Success') {
  return res.status(200).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
}

// Helper function to send unified error response
function sendError(res, message = 'An error occurred', statusCode = 500, errorType = 'server') {
  return res.status(statusCode).json({
    success: false,
    message,
    errorType,
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  withErrorHandler,
  withAuthErrorHandler,
  withAdminErrorHandler,
  withDatabaseErrorHandler,
  withFileUploadErrorHandler,
  sendSuccess,
  sendError
};