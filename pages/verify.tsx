import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function VerifyPage() {
  const router = useRouter();
  const { token } = router.query;

  const [message, setMessage] = useState('Verifying...');
  const [success, setSuccess] = useState(false);
  const [statusChecked, setStatusChecked] = useState(false); // To control showing the design only after loading

  useEffect(() => {
    if (!token) return;

    fetch(`/api/verify?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSuccess(true);
          setMessage('Your account has been successfully verified! You can now log in.');
        } else {
          setSuccess(false);
          setMessage(data.message || 'Verification failed. The link may be invalid or expired.');
        }
        setStatusChecked(true);
      })
      .catch(() => {
        setSuccess(false);
        setMessage('Something went wrong during verification.');
        setStatusChecked(true);
      });
  }, [token]);

  const handleGoToLogin = () => {
    router.push('/auth'); // Make sure `/auth` is your login page route
  };

  const getStatusColor = () => {
    if (!statusChecked) return 'border-yellow-600';
    return success ? 'border-green-600' : 'border-red-600';
  };

  const getStatusIcon = () => {
    if (!statusChecked)
      return <i className="fas fa-spinner fa-spin text-yellow-400 text-5xl mb-6"></i>;
    return success ? (
      <i className="fas fa-check-circle text-green-500 text-6xl mb-6 animate-bounce"></i>
    ) : (
      <i className="fas fa-times-circle text-red-500 text-6xl mb-6 animate-pulse"></i>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center px-4 py-8">
      <div className={`w-full max-w-md bg-gray-800 rounded-lg shadow-2xl p-8 text-center border-t-8 ${getStatusColor()}`}>
        {getStatusIcon()}

        <h1 className="text-3xl font-bold mb-4">
          {!statusChecked && 'Verifying...'}
          {statusChecked && success && 'Verification Complete!'}
          {statusChecked && !success && 'Verification Failed'}
        </h1>

        <p className="text-gray-300 text-lg mb-8">{message}</p>

        {statusChecked && (
          <button
            onClick={handleGoToLogin}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-md w-full transition duration-300 transform hover:scale-105"
          >
            Go to Login Page
          </button>
        )}

        <p className="text-gray-500 text-sm mt-8">
          If you encounter any issues, please contact our support team.
        </p>
      </div>
    </div>
  );
}
