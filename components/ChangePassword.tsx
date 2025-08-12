import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function ChangePassword() {
  const { data: session } = useSession();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Password validation function
  const validatePassword = (password: string) => {
    const errors = [];
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter (a-z)");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter (A-Z)");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number (0-9)");
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    // Password validation
    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      setError(`❌ Password does not meet requirements:\n• ${passwordErrors.join('\n• ')}`);
      return;
    }

    // Check password confirmation
    if (newPassword !== confirmPassword) {
      setError("❌ Passwords do not match. Please ensure you enter the same password in both fields.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: session?.user?.email,
          oldPassword, 
          newPassword 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '❌ An unexpected error occurred. Please try again.');
      } else {
        setMessage('✅ Password changed successfully!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      setError('❌ Network error. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md shadow-xl">
      <div className="text-center mb-6">
        <i className="fas fa-lock text-indigo-400 text-3xl mb-4"></i>
        <h3 className="text-2xl font-bold text-white">Change Password</h3>
        <p className="text-gray-300 mt-2">Update your account password</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900 border border-red-600 text-red-100 rounded flex items-center">
          <i className="fas fa-exclamation-triangle mr-3"></i>
          <div className="whitespace-pre-line">{error}</div>
        </div>
      )}
      
      {message && (
        <div className="mb-4 p-3 bg-green-900 border border-green-600 text-green-100 rounded flex items-center">
          <i className="fas fa-check-circle mr-3"></i>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            type={showOldPassword ? "text" : "password"}
            placeholder="Current Password"
            className="w-full py-4 px-5 pr-12 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200 transition-colors duration-200"
            onClick={() => setShowOldPassword(!showOldPassword)}
          >
            {showOldPassword ? '🙈' : '👁️'}
          </button>
        </div>

        <div className="relative">
          <input
            type={showNewPassword ? "text" : "password"}
            placeholder="New Password"
            className="w-full py-4 px-5 pr-12 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200 transition-colors duration-200"
            onClick={() => setShowNewPassword(!showNewPassword)}
          >
            {showNewPassword ? '🙈' : '👁️'}
          </button>
        </div>

        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm New Password"
            className="w-full py-4 px-5 pr-12 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200 transition-colors duration-200"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? '🙈' : '👁️'}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 w-full py-3 rounded font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Changing Password...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}