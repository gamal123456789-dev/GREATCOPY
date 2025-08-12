import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SignInRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the custom auth page
    router.replace('/auth');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p>Redirecting to authentication...</p>
      </div>
    </div>
  );
}