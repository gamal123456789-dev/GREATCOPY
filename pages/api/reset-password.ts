import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';
import bcrypt from 'bcrypt';
import { withErrorHandler, sendSuccess, sendError } from '../../lib/apiWrapper';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return sendError(res, 'Method not allowed', 405, 'method');
  }

  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return sendError(res, 'Token and new password are required', 400, 'validation');
  }

  // Check password strength
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    return sendError(res, 'Password requirements: At least 8 characters with uppercase letter (A-Z), lowercase letter (a-z), and number (0-9).', 400, 'validation');
  }

  try {
    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(), // Token must not be expired
        },
      },
    });

    if (!user) {
      return sendError(res, 'Invalid or expired reset token', 400, 'validation');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return sendSuccess(res, null, 'Password reset successful');
  } catch (error: any) {
    throw error; // Will be handled by withErrorHandler
  }
}

export default withErrorHandler(handler);