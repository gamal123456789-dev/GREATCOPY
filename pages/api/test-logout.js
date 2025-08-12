// Simple test logout endpoint

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('🚪 Test logout called');
    
    // Clear basic session cookies
    const cookiesToClear = [
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      'next-auth.csrf-token',
      '__Host-next-auth.csrf-token'
    ];

    const clearCookieHeaders = cookiesToClear.map(cookieName => 
      `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=lax`
    );

    res.setHeader('Set-Cookie', clearCookieHeaders);

    return res.status(200).json({
      success: true,
      message: 'Test logout successful',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Test logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Test logout failed',
      error: error.message
    });
  }
}