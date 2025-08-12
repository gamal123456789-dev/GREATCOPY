// Comprehensive error handling system
const fs = require('fs');
const path = require('path');
const os = require('os');

// Determine logs directory (in dev, use temp dir to avoid HMR rebuild loops)
const logsDir = (process.env.LOGS_DIR
  ? path.resolve(process.env.LOGS_DIR)
  : (process.env.NODE_ENV === 'development'
      ? path.join(os.tmpdir(), 'gearscore-logs')
      : path.join(process.cwd(), 'logs')));
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Error logging function
function logError(error, context = {}) {
  const isDev = process.env.NODE_ENV === 'development';
  const isSocketDisconnect = context?.type === 'socket_disconnect_error' ||
    (typeof error?.message === 'string' && error.message.includes('Socket disconnect'));
  if (isDev && isSocketDisconnect) {
    return; // avoid noisy logs in development
  }
  const timestamp = new Date().toISOString();
  const errorLog = {
    timestamp,
    message: error.message,
    stack: error.stack,
    context,
    userAgent: context.userAgent || 'Unknown',
    ip: context.ip || 'Unknown',
    url: context.url || 'Unknown',
    method: context.method || 'Unknown'
  };

  // Write error to log file
  const logFile = path.join(logsDir, `error-${new Date().toISOString().split('T')[0]}.log`);
  const logEntry = `[${timestamp}] ${JSON.stringify(errorLog)}\n`;
  
  fs.appendFileSync(logFile, logEntry);
  
  // Print error to console for development (skip noisy socket disconnect logs)
  if (process.env.NODE_ENV === 'development') {
    const isNoisySocketDisconnect = errorLog?.context?.type === 'socket_disconnect_error' ||
      (typeof errorLog.message === 'string' && errorLog.message.includes('Socket disconnect'));
    if (!isNoisySocketDisconnect) {
      console.error('🚨 Error logged:', errorLog);
    }
  }
}

// User-friendly error messages
const userFriendlyMessages = {
  // Database errors
  'database': 'Sorry, a system error occurred. Please try again later.',
  'connection': 'Connection problem. Please check your internet connection and try again.',
  
  // Authentication errors
  'authentication': 'Please log in to continue.',
  'authorization': 'You do not have permission to access this page.',
  'session': 'Session expired. Please log in again.',
  
  // Validation errors
  'validation': 'The entered data is incorrect. Please review and try again.',
  'file': 'An error occurred while uploading the file. Please check the file type and size.',
  'not_found': 'The requested data was not found.',
  
  // General errors
  'server': 'A server error occurred. The support team has been notified and the issue will be resolved soon.',
  'network': 'Network problem. Please try again.',
  'timeout': 'Request timeout. Please try again.',
  'method': 'Request method not supported.',

  // Default message
  'default': 'An unexpected error occurred. Please try again or contact technical support.'
};

// Determine error type
function getErrorType(error) {
  const message = error.message.toLowerCase();
  const stack = error.stack?.toLowerCase() || '';
  const errorCode = error.code;
  
  // Database errors
  if (message.includes('database') || message.includes('prisma') || message.includes('sql') || 
      errorCode === 'P2002' || errorCode === 'P2025' || errorCode === 'P2003') {
    return 'database';
  }
  
  // Connection errors
  if (message.includes('connection') || message.includes('econnrefused') || message.includes('enotfound') ||
      errorCode === 'ECONNREFUSED' || errorCode === 'ENOTFOUND') {
    return 'connection';
  }
  
  // Authentication errors
  if (message.includes('unauthorized') || message.includes('authentication') ||
      message.includes('login') || message.includes('signin')) {
    return 'authentication';
  }
  
  // Authorization errors
  if (message.includes('forbidden') || message.includes('authorization') ||
      message.includes('permission') || message.includes('access denied')) {
    return 'authorization';
  }
  
  // Session errors
  if (message.includes('session') || message.includes('token') ||
      message.includes('expired') || message.includes('invalid token')) {
    return 'session';
  }
  
  // Validation errors
  if (message.includes('validation') || message.includes('invalid') ||
      message.includes('required') || message.includes('missing')) {
    return 'validation';
  }
  
  // File errors
  if (message.includes('file') || message.includes('upload') ||
      errorCode === 'LIMIT_FILE_SIZE' || errorCode === 'LIMIT_UNEXPECTED_FILE') {
    return 'file';
  }
  
  // Not found errors
  if (message.includes('not found') || message.includes('does not exist') ||
      errorCode === 'P2025' || message.includes('404')) {
    return 'not_found';
  }
  
  // Timeout errors
  if (message.includes('timeout') || message.includes('etimedout') ||
      errorCode === 'ETIMEDOUT') {
    return 'timeout';
  }
  
  // Network errors
  if (message.includes('network') || message.includes('fetch') ||
      message.includes('request failed')) {
    return 'network';
  }
  
  // HTTP method errors
  if (message.includes('method not allowed') || message.includes('405')) {
    return 'method';
  }
  
  return 'server';
}

// معالج الأخطاء الرئيسي
function handleError(error, req = null, res = null) {
  // إنشاء معرف فريد للخطأ
  const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // جمع معلومات السياق
  const context = {
    errorId,
    userAgent: req?.headers?.['user-agent'],
    ip: req?.ip || req?.connection?.remoteAddress,
    url: req?.url,
    method: req?.method,
    userId: req?.session?.user?.id,
    timestamp: new Date().toISOString(),
    // إضافة معلومات إضافية بدون كشف تفاصيل حساسة
    errorName: error.name,
    errorCode: error.code
  };
  
  // تسجيل الخطأ
  logError(error, context);
  
  // تحديد نوع الخطأ والرسالة المناسبة
  const errorType = getErrorType(error);
  const userMessage = userFriendlyMessages[errorType] || userFriendlyMessages.default;
  
  // تحديد كود الاستجابة
  let statusCode = 500;
  if (errorType === 'authentication') statusCode = 401;
  if (errorType === 'authorization') statusCode = 403;
  if (errorType === 'validation') statusCode = 400;
  if (errorType === 'timeout') statusCode = 408;
  if (errorType === 'not_found') statusCode = 404;
  
  // إرسال الاستجابة إذا كان هناك response object
  if (res && !res.headersSent) {
    const response = {
      success: false,
      message: userMessage,
      errorId,
      timestamp: new Date().toISOString()
    };
    
    // في بيئة التطوير فقط، إضافة معلومات إضافية
    if (process.env.NODE_ENV === 'development') {
      response.debug = {
        errorType,
        originalMessage: error.message,
        stack: error.stack?.split('\n').slice(0, 5).join('\n') // أول 5 أسطر فقط
      };
    }
    
    return res.status(statusCode).json(response);
  }
  
  return {
    success: false,
    message: userMessage,
    errorType,
    statusCode,
    errorId
  };
}

// معالج الأخطاء للـ API routes
function apiErrorHandler(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      handleError(error, req, res);
    }
  };
}

// معالج الأخطاء للصفحات
function pageErrorHandler(handler) {
  return async (context) => {
    try {
      return await handler(context);
    } catch (error) {
      const errorInfo = handleError(error, context.req);
      
      // إعادة توجيه لصفحة خطأ مخصصة
      return {
        redirect: {
          destination: `/error?message=${encodeURIComponent(errorInfo.message)}`,
          permanent: false
        }
      };
    }
  };
}

// دالة تنظيف ملفات الـ logs القديمة (أكثر من 30 يوم)
function cleanOldLogs() {
  try {
    const files = fs.readdirSync(logsDir);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    files.forEach(file => {
      if (file.startsWith('error-') && file.endsWith('.log')) {
        const filePath = path.join(logsDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < thirtyDaysAgo) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ تم حذف ملف log قديم: ${file}`);
        }
      }
    });
  } catch (error) {
    console.error('خطأ في تنظيف ملفات logs:', error.message);
  }
}

// تشغيل تنظيف الـ logs كل يوم
setInterval(cleanOldLogs, 24 * 60 * 60 * 1000);

module.exports = {
  handleError,
  apiErrorHandler,
  pageErrorHandler,
  logError,
  userFriendlyMessages,
  cleanOldLogs
};