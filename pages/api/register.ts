import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import sendVerificationEmail from '../../lib/sendVerificationEmail';
import { withErrorHandler, sendSuccess, sendError } from '../../lib/apiWrapper';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return sendError(res, 'Request method not supported', 405, 'method');
  }

  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    return sendError(res, 'Email, password, and username are required', 400, 'validation');
  }

  if (typeof username !== 'string' || username.length < 3) {
    return sendError(res, 'Username must be at least 3 characters', 400, 'validation');
  }

  // Check password strength
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!passwordRegex.test(password)) {
    return sendError(res, 'Password must be at least 8 characters and contain uppercase, lowercase, and number', 400, 'validation');
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return sendError(res, 'Email already registered', 409, 'validation');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verifyToken = uuidv4();
    
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email,
        password: hashedPassword,
        username,
        verifyToken,
        // Require email verification for all users
        emailVerified: null,
      },
    });

    // Send verification email to all users
    try {
      await sendVerificationEmail(email, verifyToken);
      console.log('✅ Verification email sent to:', email);
      return sendSuccess(res, null, 'Registration successful. Please check your email to verify your account');
    } catch (err) {
      console.error('❌ Failed to send verification email:', err);
      // Delete user if email sending fails to avoid invalid data
      await prisma.user.delete({ where: { id: user.id } });
      return sendError(res, 'Failed to send verification email', 500, 'email');
    }
  } catch (error: any) {
    throw error; // Will be handled by withErrorHandler
  }
}

export default withErrorHandler(handler);
