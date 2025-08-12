// API endpoint to force refresh the NextAuth session
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Force a fresh session check
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Return the fresh session data
    return res.status(200).json({ 
      message: 'Session refreshed successfully',
      user: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
        isAdmin: session.user.isAdmin
      }
    });
  } catch (error) {
    console.error('Error refreshing session:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}