// Session Diagnostic Tool - Run this in browser console
// Copy and paste this entire script into the browser console on your website

(async function sessionDiagnostic() {
  console.log('🔍 Starting Session Diagnostic...');
  console.log('='.repeat(50));
  
  try {
    // Check 1: Browser session storage
    console.log('\n1. Browser Storage Check:');
    console.log('- localStorage user:', localStorage.getItem('user'));
    console.log('- sessionStorage user:', sessionStorage.getItem('user'));
    
    // Check 2: Cookies
    console.log('\n2. Cookies Check:');
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});
    
    const sessionCookies = Object.keys(cookies).filter(key => 
      key.includes('session') || key.includes('auth') || key.includes('next-auth')
    );
    
    console.log('- All cookies:', Object.keys(cookies));
    console.log('- Session-related cookies:', sessionCookies);
    sessionCookies.forEach(key => {
      console.log(`  ${key}: ${cookies[key]?.substring(0, 50)}...`);
    });
    
    // Check 3: API Session endpoint
    console.log('\n3. API Session Check:');
    const sessionResponse = await fetch('/api/auth/session', {
      method: 'GET',
      credentials: 'same-origin'
    });
    
    const sessionData = await sessionResponse.json();
    console.log('- Session API Status:', sessionResponse.status);
    console.log('- Session API Response:', sessionData);
    console.log('- Has User:', !!sessionData.user);
    console.log('- User ID:', sessionData.user?.id);
    console.log('- User Email:', sessionData.user?.email);
    
    // Check 4: NextAuth Session (if available)
    console.log('\n4. NextAuth Client Session Check:');
    if (window.next && window.next.router) {
      console.log('- Next.js detected');
    }
    
    // Try to access NextAuth session from client
    try {
      // This might not work if NextAuth client isn't available
      if (window.__NEXT_DATA__) {
        console.log('- Next.js data available');
        console.log('- Page props:', window.__NEXT_DATA__.props?.pageProps?.session ? 'Has session' : 'No session');
      }
    } catch (e) {
      console.log('- NextAuth client check failed:', e.message);
    }
    
    // Check 5: Test authenticated endpoint
    console.log('\n5. Testing Authenticated Endpoint:');
    const ordersResponse = await fetch('/api/orders', {
      method: 'GET',
      credentials: 'same-origin'
    });
    
    console.log('- Orders API Status:', ordersResponse.status);
    if (ordersResponse.status === 401) {
      console.log('- ❌ Authentication required - session is invalid');
    } else if (ordersResponse.ok) {
      const ordersData = await ordersResponse.json();
      console.log('- ✅ Authenticated successfully');
      console.log('- Orders count:', ordersData.orders?.length || 0);
    } else {
      console.log('- ⚠️ Unexpected response');
    }
    
    // Check 6: Current page and authentication state
    console.log('\n6. Current Page Context:');
    console.log('- Current URL:', window.location.href);
    console.log('- Referrer:', document.referrer);
    console.log('- User Agent:', navigator.userAgent.substring(0, 100));
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 DIAGNOSTIC SUMMARY:');
    
    if (!sessionData.user) {
      console.log('❌ ISSUE IDENTIFIED: No valid session found');
      console.log('💡 SOLUTION: User needs to log in through /auth page');
      console.log('🔗 Login URL: ' + window.location.origin + '/auth');
    } else {
      console.log('✅ Session appears valid');
      console.log('👤 Logged in as:', sessionData.user.email);
    }
    
    if (sessionCookies.length === 0) {
      console.log('⚠️  WARNING: No session cookies found');
      console.log('💡 This might indicate cookie issues or expired session');
    }
    
    console.log('\n🔧 To fix payment issues:');
    console.log('1. Go to: ' + window.location.origin + '/auth');
    console.log('2. Log in with your credentials');
    console.log('3. Try the payment process again');
    console.log('4. If issues persist, clear browser cookies and try again');
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  }
})();

// Instructions for user
console.log('\n📋 INSTRUCTIONS:');
console.log('1. Open browser Developer Tools (F12)');
console.log('2. Go to Console tab');
console.log('3. Copy and paste this entire script');
console.log('4. Press Enter to run the diagnostic');
console.log('5. Share the results with support if needed');