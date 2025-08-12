import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";
import ChangePassword from '../components/ChangePassword';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showChangePassword, setShowChangePassword] = useState(false);

  // ⛔️ If not logged in → redirect
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status]);

  // ⏳ Still loading
  if (status === "loading") {
    return <p className="text-white text-center mt-10">Loading...</p>;
  }

  // ✅ After confirming user is logged in
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-6">Your Profile</h1>

      <div className="bg-gray-800 rounded-xl p-6 shadow-md w-96 text-center">
        <img
          src={session?.user?.image || '/default-avatar.png'}
          alt="User avatar"
          className="w-32 h-32 rounded-full shadow-lg border-4 border-indigo-600 mx-auto mb-4"
        />
        <p className="text-xl font-semibold mb-2">{session?.user?.name}</p>
        <p className="text-gray-400 mb-2">{session?.user?.email}</p>
        <p className="text-sm text-gray-500">Signed in with: Discord</p>
        
        <div className="space-y-3 mt-6">
          <button
            onClick={() => setShowChangePassword(!showChangePassword)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition-colors w-full"
          >
            <i className="fas fa-key mr-2"></i>
            {showChangePassword ? 'Hide Change Password' : 'Change Password'}
          </button>
          
          <button
            onClick={() => signOut({ callbackUrl: 'https://gear-score.com/auth' })}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors w-full"
          >
            <i className="fas fa-sign-out-alt mr-2"></i>
            Sign Out
          </button>
        </div>
      </div>
      
      {showChangePassword && (
        <div className="mt-6">
          <ChangePassword />
        </div>
      )}
    </div>
  );
}
