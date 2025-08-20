import { useState, useEffect } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function AdminTest() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [adminUsers, setAdminUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState([]);

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const fetchAdminUsers = async () => {
    try {
      const response = await fetch('/api/test-admin-accounts');
      const data = await response.json();
      setAdminUsers(data.admins || []);
    } catch (error) {
      console.error('Error fetching admin users:', error);
    }
  };

  const testAdminAccess = async () => {
    setLoading(true);
    const results = [];
    
    try {
      // Test current session
      results.push(`Current session status: ${status}`);
      if (session) {
        results.push(`Logged in as: ${session.user.email}`);
        results.push(`User role: ${session.user.role}`);
        results.push(`Is admin: ${session.user.role === 'ADMIN' || session.user.role === 'admin'}`);
      } else {
        results.push('No active session found');
      }
      
      // Test admin page access
      const adminResponse = await fetch('/admin');
      const adminHtml = await adminResponse.text();
      const hasMainContent = adminHtml.includes('<main') && !adminHtml.includes('<main class="jsx-75e52f6b681a2bfa"></main>');
      results.push(`Admin page accessible: ${adminResponse.ok}`);
      results.push(`Admin page has content: ${hasMainContent}`);
      
      if (!hasMainContent) {
        results.push('⚠️ Admin page main content is empty - user likely not authenticated or not admin');
      }
      
    } catch (error) {
      results.push(`Error testing admin access: ${error.message}`);
    }
    
    setTestResults(results);
    setLoading(false);
  };

  const handleCredentialLogin = async (email) => {
    try {
      const result = await signIn('credentials', {
        email: email,
        password: 'admin123', // Default password for test accounts
        redirect: false
      });
      
      if (result?.error) {
        alert(`Login failed: ${result.error}`);
      } else {
        alert('Login successful! Testing admin access...');
        setTimeout(() => {
          testAdminAccess();
        }, 1000);
      }
    } catch (error) {
      alert(`Login error: ${error.message}`);
    }
  };

  const handleDiscordLogin = async () => {
    try {
      await signIn('discord', { callbackUrl: '/admin-test' });
    } catch (error) {
      alert(`Discord login error: ${error.message}`);
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    setTestResults([]);
  };

  const goToAdminPage = () => {
    router.push('/admin');
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🔐 Admin Access Test</h1>
      
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h2>Current Session Status</h2>
        <p><strong>Status:</strong> {status}</p>
        {session ? (
          <div>
            <p><strong>Email:</strong> {session.user.email}</p>
            <p><strong>Role:</strong> {session.user.role}</p>
            <p><strong>Is Admin:</strong> {session.user.role === 'ADMIN' || session.user.role === 'admin' ? '✅ YES' : '❌ NO'}</p>
            <button onClick={handleLogout} style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              Sign Out
            </button>
          </div>
        ) : (
          <p>Not logged in</p>
        )}
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e8f4fd', borderRadius: '5px' }}>
        <h2>Available Admin Accounts</h2>
        {adminUsers.length > 0 ? (
          <div>
            <p>Found {adminUsers.length} admin accounts:</p>
            {adminUsers.map((user, index) => (
              <div key={user.id} style={{ marginBottom: '10px', padding: '10px', backgroundColor: 'white', borderRadius: '3px' }}>
                <p><strong>{index + 1}. {user.email}</strong></p>
                <p>Role: {user.role} | Username: {user.username || 'N/A'}</p>
                <button 
                  onClick={() => handleCredentialLogin(user.email)}
                  style={{ padding: '5px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '10px' }}
                >
                  Login with Credentials
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p>No admin accounts found</p>
        )}
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
        <h2>Login Options</h2>
        <button 
          onClick={handleDiscordLogin}
          style={{ padding: '10px 20px', backgroundColor: '#5865F2', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' }}
        >
          Sign in with Discord
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testAdminAccess}
          disabled={loading}
          style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' }}
        >
          {loading ? 'Testing...' : 'Test Admin Access'}
        </button>
        
        <button 
          onClick={goToAdminPage}
          style={{ padding: '10px 20px', backgroundColor: '#6f42c1', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          Go to Admin Page
        </button>
      </div>

      {testResults.length > 0 && (
        <div style={{ padding: '15px', backgroundColor: '#d4edda', borderRadius: '5px' }}>
          <h2>Test Results</h2>
          {testResults.map((result, index) => (
            <p key={index} style={{ margin: '5px 0', fontFamily: 'monospace' }}>{result}</p>
          ))}
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
        <h3>📋 Instructions</h3>
        <ol>
          <li>Try logging in with one of the admin accounts using credentials</li>
          <li>Or sign in with Discord (if your Discord account is linked to an admin user)</li>
          <li>After login, click "Test Admin Access" to verify the session</li>
          <li>Click "Go to Admin Page" to check if the admin content loads properly</li>
        </ol>
        <p><strong>Note:</strong> Default password for test accounts is "admin123"</p>
      </div>
    </div>
  );
}