import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { getSession } from '../../lib/session';

/**
 * API endpoint to generate JWT tokens for Socket.IO authentication
 * This endpoint creates a properly signed JWT token that the Socket.IO server can verify
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authentication and authorization - SECURITY FIX: Removed test admin bypass
    const session = await getSession(req, res);
    if (!session?.user?.id) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        details: 'No active session found',
        code: 'NO_SESSION'
      });
    }

    const user = session.user;
    
    // Security logging for socket token generation
    console.log(`[SECURITY] Socket token requested: User ${user.id} at ${new Date().toISOString()}`);

    if (!process.env.NEXTAUTH_SECRET) {
      console.error('[SOCKET-TOKEN] Missing NEXTAUTH_SECRET');
      return res.status(500).json({
        error: 'Server configuration error',
        code: 'MISSING_ENV'
      });
    }

    // Create JWT payload with user information
    const payload = {
      sub: user.id, // 'sub' is the standard JWT claim for subject (user ID)
      id: user.id,
      email: user.email,
      role: user.role || 'user',
      username: user.username || user.name,
      iat: Math.floor(Date.now() / 1000), // Issued at time
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // Expires in 24 hours
    };

    // Sign the JWT token with the same secret used by NextAuth
    const token = jwt.sign(payload, process.env.NEXTAUTH_SECRET!);

    console.log(`[SOCKET-TOKEN] Generated JWT token for user ${user.id} at ${new Date().toISOString()}`);

    return res.status(200).json({ 
      token,
      expiresIn: 3600 * 24
    });
  } catch (error) {
    console.error('[SOCKET-TOKEN] Error generating token:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'TOKEN_GENERATION_FAILED'
    });
  }
}