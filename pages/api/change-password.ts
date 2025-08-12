// pages/api/change-password.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../lib/prisma'
import bcrypt from 'bcrypt'
import { authLimiter, getClientIdentifier } from '../../lib/rateLimiter'
import { withErrorHandler, sendSuccess, sendError } from '../../lib/apiWrapper'

export default withErrorHandler(async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  // Security: Rate limiting for password change attempts
  const clientId = getClientIdentifier(req);
  if (!authLimiter.isAllowed(clientId)) {
    console.log(`[SECURITY] Password change rate limit exceeded for ${clientId} at ${new Date().toISOString()}`);
    return res.status(429).json({ error: 'Too many password change attempts. Please try again later.' });
  }

  const { email, oldPassword, newPassword } = req.body

  if (!email || !oldPassword || !newPassword) {
    return sendError(res, 'All fields are required', 400, 'validation')
  }

  // Security: Password strength validation
  if (newPassword.length < 8) {
    return sendError(res, 'New password must be at least 8 characters', 400, 'validation')
  }

  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
    return sendError(res, 'Password must contain at least one uppercase letter, lowercase letter, and number', 400, 'validation')
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user || !user.password) {
      return sendError(res, 'User not found or no password set', 404, 'not_found')
    }

    const isValid = await bcrypt.compare(oldPassword, user.password)

    if (!isValid) {
      // Security logging for failed password change attempts
      console.log(`[SECURITY] Failed password change attempt for user ${email} from ${clientId} at ${new Date().toISOString()}`);
      return sendError(res, 'Old password is incorrect', 401, 'authentication')
    }

    const newHashed = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { email },
      data: { password: newHashed },
    })

    // Security logging for successful password changes
    console.log(`[SECURITY] Password changed successfully for user ${email} from ${clientId} at ${new Date().toISOString()}`);

    return sendSuccess(res, null, 'Password changed successfully');
  } catch (error) {
    console.error('[ERROR] Password change failed:', error);
    return sendError(res, 'Internal server error', 500, 'server_error');
  }
})
