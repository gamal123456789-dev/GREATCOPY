import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import sendVerificationEmail from '../../lib/sendVerificationEmail';
import { withErrorHandler, sendSuccess, sendError } from '../../lib/apiWrapper';
import { authLimiter, getClientIdentifier } from '../../lib/rateLimiter';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return sendError(res, 'Request method not supported', 405, 'method');
  }

  // Security: Rate limiting for registration attempts
  const clientId = getClientIdentifier(req);
  if (!authLimiter.isAllowed(clientId)) {
    console.log(`[SECURITY] Registration rate limit exceeded for ${clientId} at ${new Date().toISOString()}`);
    return sendError(res, 'Too many registration attempts. Please try again later.', 429, 'rate_limit');
  }

  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    return sendError(res, 'Email, password, and username are required', 400, 'validation');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return sendError(res, 'Please enter a valid email address', 400, 'validation');
  }

  if (typeof username !== 'string' || username.length < 3 || username.length > 20) {
    return sendError(res, 'Username must be between 3 and 20 characters', 400, 'validation');
  }

  // Enhanced username validation
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(username)) {
    return sendError(res, 'Username can only contain letters, numbers, underscores, and hyphens', 400, 'validation');
  }

  // Check password strength
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!passwordRegex.test(password)) {
    return sendError(res, 'Password must be at least 8 characters and contain uppercase, lowercase, and number', 400, 'validation');
  }

  try {
    // Check for existing email
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      console.log(`[SECURITY] Registration attempt with existing email: ${email} from ${clientId} at ${new Date().toISOString()}`);
      return sendError(res, 'Email already registered', 409, 'validation');
    }

    // Check for existing username (only if username is provided)
    if (username) {
      const existingUsername = await prisma.user.findFirst({ where: { username } });
      if (existingUsername) {
        return sendError(res, 'Username already taken', 409, 'validation');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12); // Increased salt rounds for better security
    const verifyToken = uuidv4();
    
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: email.toLowerCase(), // Store email in lowercase
        password: hashedPassword,
        username,
        verifyToken,
        role: 'user', // Default role
        emailVerified: null, // Require email verification
        createdAt: new Date(),
      },
    });

    // Send verification email
    try {
      await sendVerificationEmail(email, verifyToken);
      console.log(`[AUTH] Registration successful for ${email}, verification email sent at ${new Date().toISOString()}`);
      return sendSuccess(res, null, 'Registration successful. Please check your email to verify your account');
    } catch (err) {
      console.error(`[ERROR] Failed to send verification email to ${email}:`, err);
      // Delete user if email sending fails to maintain data consistency
      await prisma.user.delete({ where: { id: user.id } });
      return sendError(res, 'Failed to send verification email. Please try again.', 500, 'email');
    }
  } catch (error: any) {
    console.error('[ERROR] Registration error:', error);
    throw error; // Will be handled by withErrorHandler
  }
}

export default withErrorHandler(handler);
