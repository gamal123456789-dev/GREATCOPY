import { withErrorHandler, sendSuccess, sendError } from '../../lib/apiWrapper';

/**
 * API endpoint for logging client-side errors
 * Receives errors from browser and logs them in the system
 */
async function handler(req, res) {
  // Check request method
  if (req.method !== 'POST') {
    return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Request method not supported');
  }

  try {
    const { error, context } = req.body;

    // Check for error data
    if (!error || !error.message) {
      return sendError(res, 400, 'MISSING_ERROR_DATA', 'Error data is required');
    }

    // Setup error context
    const errorContext = {
      source: 'client',
      userAgent: req.headers['user-agent'] || 'Unknown',
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'Unknown',
      referer: req.headers.referer || 'Unknown',
      timestamp: new Date().toISOString(),
      ...context
    };

    // Create error object
    const clientError = new Error(error.message);
    clientError.name = error.name || 'ClientError';
    clientError.stack = error.stack || 'No stack trace available';

    // Simple console logging instead of file system operations
    console.error('🚨 Client Error:', {
      message: clientError.message,
      name: clientError.name,
      stack: clientError.stack,
      context: errorContext
    });

    // Send success response
    return sendSuccess(res, {
      message: 'Error logged successfully',
      logged: true
    }, 'Error logged successfully');

  } catch (err) {
    // In case of logging failure
    console.error('Failed to log client error:', err);
    return sendError(res, 500, 'LOGGING_FAILED', 'Failed to log error');
  }
}

export default withErrorHandler(handler);