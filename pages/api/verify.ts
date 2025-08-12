import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';
import { withErrorHandler, sendSuccess, sendError } from '../../lib/apiWrapper';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return sendError(res, 'Request method not supported', 405, 'method');
  }

  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return sendError(res, 'Verification code is missing or invalid', 400, 'validation');
  }

  try {
    // Looking for user with verification token

    const user = await prisma.user.findFirst({
      where: { verifyToken: token },
    });

    if (!user || !user.id) {
      console.warn('❌ Token not found or already used');
      return sendError(res, 'Verification code is invalid or expired', 404, 'validation');
    }

    console.log('✅ Found user:', user.email, '| Verifying now...');
    console.log("🧩 Verifying user ID:", user.id);

    const updatedUser = await prisma.user.update({
  where: { id: user.id },
  data: {
    emailVerified: new Date(), // ✅ Correct
    verifyToken: null,
  },
});


    console.log('🎉 Verification complete for:', updatedUser.email);

    return sendSuccess(res, null, 'Email verified successfully');
  } catch (error: any) {
    throw error; // Will be handled by withErrorHandler
  }
}

export default withErrorHandler(handler);
