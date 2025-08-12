// API endpoint to force logout and clear session
// Enhanced with account deletion check and improved rate limiting
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
// Rate limiting removed for logout endpoints to prevent JSON parsing issues
// import { authLimiter, createRateLimitMiddleware, getClientIdentifier } from '../../lib/rateLimiter';
import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Rate limiting removed to prevent JSON parsing issues during rapid logout/login
  // This allows users to logout and login quickly without encountering rate limits

  try {
    const session = await getServerSession(req, res, authOptions);
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    
    // Check if user exists in database
    let userExists = false;
    let userId = null;
    
    if (session?.user?.id) {
      userId = session.user.id;
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      userExists = !!user;
    }
    
    // If account is deleted, perform force logout automatically
    if (userId && !userExists) {
      console.log('[SECURITY] Automatic force logout for deleted account:', {
        userId: userId,
        ip: clientIP,
        timestamp: new Date().toISOString(),
        reason: 'Account deleted from database'
      });
    } else if (session?.user) {
      // Log normal force logout operation for existing users
      console.log('[SECURITY] Manual force logout:', {
        userId: session.user.id,
        email: session.user.email,
        ip: clientIP,
        timestamp: new Date().toISOString()
      });
    } else {
      // Attempt force logout without active session
      console.log('[SECURITY] Force logout attempt without session:', {
        ip: clientIP,
        timestamp: new Date().toISOString()
      });
    }

    // Clear all session-related cookies
    res.setHeader('Set-Cookie', [
      'next-auth.session-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=lax',
      '__Secure-next-auth.session-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=lax',
      'next-auth.csrf-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=lax',
      '__Host-next-auth.csrf-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=lax'
    ]);

    const responseMessage = userId && !userExists 
      ? 'Account has been deleted. Session cleared automatically. Please refresh the page.'
      : 'Session cleared successfully. Please refresh the page and log in again.';

    return res.status(200).json({ 
      message: responseMessage,
      accountDeleted: userId && !userExists
    });
  } catch (error) {
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    console.error('Error in force logout:', error);
    
    console.error('[SECURITY] Force logout error:', {
      ip: clientIP,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    return res.status(500).json({ message: 'Internal server error' });
  }
}