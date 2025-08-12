import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import sendVerificationEmail from '../../lib/sendVerificationEmail';
import { withErrorHandler, sendSuccess, sendError } from '../../lib/apiWrapper';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return sendError(res, 'Method not allowed', 405, 'method');
  }

  const { email } = req.body;

  if (!email) {
    return sendError(res, 'Email is required', 400, 'validation');
  }

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if email exists or not for security
      return sendSuccess(res, null, 'If this email is registered, you will receive a password reset link.');
    }

    // Generate reset token
    const resetToken = uuidv4();
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Update user with reset token
    await prisma.user.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Send reset email (reusing the verification email function for now)
    try {
      await sendVerificationEmail(email, resetToken, true); // true flag for password reset
      return sendSuccess(res, null, 'Password reset link sent to your email.');
    } catch (err) {
      console.error('❌ Failed to send reset email:', err);
      return sendError(res, 'Failed to send reset email', 500, 'email');
    }
  } catch (error: any) {
    throw error; // Will be handled by withErrorHandler
  }
}

export default withErrorHandler(handler);