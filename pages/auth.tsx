import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useUser } from "../context/UserContext";
import { signIn, useSession } from "next-auth/react";

export default function AuthPage() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState("");

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
  const router = useRouter();
  const { setUser } = useUser();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && router.pathname === "/auth") {
      router.push(router.query.from as string || "/");
    }
  }, [status, router]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setForgotPasswordMessage("");
    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });

      const result = await res.json();
      if (res.ok) {
        setForgotPasswordMessage("✅ Password reset link sent to your email!");
        setForgotPasswordEmail("");
      } else {
        let errorMessage = result.error || "❌ Failed to send reset email";
        // Translate common error messages
        if (errorMessage.includes('User not found')) {
          errorMessage = "❌ No account found with this email address. Please check your email or register first.";
        } else if (errorMessage.includes('Invalid email')) {
          errorMessage = "❌ Invalid email format. Please enter a valid email address.";
        }
        setForgotPasswordMessage(errorMessage);
      }
    } catch (error) {
      setForgotPasswordMessage("❌ Network error. Please check your internet connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    if (!isLoginMode) {
      // Password validation
      const passwordErrors = validatePassword(password);
      if (passwordErrors.length > 0) {
        setError(`❌ Password does not meet requirements:\n• ${passwordErrors.join('\n• ')}`);
        setLoading(false);
        return;
      }
      
      // Check password confirmation
      if (password !== confirmPassword) {
        setError("❌ Passwords do not match. Please ensure you enter the same password in both fields.");
        setLoading(false);
        return;
      }
    }

    try {
      if (isLoginMode) {
        const result = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });

        if (result?.error) {
          let errorMessage = result.error;
          // Translate common error messages
          if (errorMessage.includes('Invalid credentials') || errorMessage.includes('CredentialsSignin')) {
            errorMessage = "❌ Invalid login credentials. Please check your email and password.";
          } else if (errorMessage.includes('User not found')) {
            errorMessage = "❌ No account found with this email address. Please register first.";
          } else if (errorMessage.includes('Account not verified')) {
            errorMessage = "❌ Account not verified. Please check your email and activate your account.";
          }
          setError(errorMessage);
        } else {
          setUser({
            id: session?.user?.id || "",
            email,
            username: session?.user?.username || email.split("@")[0],
            role: session?.user?.role || "user",
          });
          router.push(router.query.from as string || "/");
        }
      } else {
        const endpoint = "/api/register";
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, username }),
        });

        const result = await res.json();
        if (!res.ok) {
          // Show specific error message from server
          let errorMessage = result.error || "❌ Registration failed";
          
          // Translate and improve common error messages
          if (errorMessage.includes('email already exists')) {
            errorMessage = "❌ This email is already registered. Please use a different email or try logging in.";
          } else if (errorMessage.includes('username must be at least 3 characters')) {
            errorMessage = "❌ Username must be at least 3 characters long.";
          } else if (errorMessage.includes('password must be at least 8 characters')) {
            errorMessage = "❌ Password does not meet requirements. Must contain at least 8 characters with uppercase, lowercase, and number.";
          } else if (errorMessage.includes('required fields')) {
            errorMessage = "❌ All fields are required. Please fill in email, password, and username.";
          } else if (errorMessage.includes('failed to send verification email')) {
            errorMessage = "❌ Failed to send verification email. Please try again later.";
          } else if (errorMessage.includes('Invalid email format')) {
            errorMessage = "❌ Invalid email format. Please enter a valid email address.";
          }
          
          setError(errorMessage);
        } else {
          // Clear any previous errors and show success message
          setError("");
          setSuccessMessage(result.message);
          
          // If it's local development (immediate login), redirect to dashboard
          if (result.message && result.message.includes('immediately')) {
            // Auto-login for local development
            const loginResult = await signIn("credentials", {
              redirect: false,
              email,
              password,
            });
            
            if (loginResult && !loginResult.error) {
              router.push("/");
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "❌ An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDiscordLogin = () => {
    signIn("discord", { callbackUrl: router.query.from as string || "/" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-100 flex items-center justify-center px-4 py-8 relative">
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="w-full max-w-md bg-gray-800 bg-opacity-40 backdrop-filter backdrop-blur-3xl rounded-3xl shadow-glow p-9 border border-gray-700 border-opacity-50 relative z-10">
        <h1 className="text-6xl font-extrabold text-center text-white mb-3 tracking-tighter drop-shadow-lg">
          Gearscore
        </h1>
        <p className="text-center text-gray-300 mb-9 text-lg opacity-80">
          Unlock your true gaming potential.
        </p>

        <div className="flex bg-gray-700 bg-opacity-30 rounded-2xl p-1 mb-8 shadow-inner-lg">
          <button
            onClick={() => setIsLoginMode(true)}
            className={`flex-1 py-3 px-5 text-lg font-bold rounded-xl transition-all duration-300 ease-in-out transform ${
              isLoginMode
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg-md scale-105"
                : "text-gray-300 hover:text-white hover:bg-gray-600 hover:bg-opacity-50"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsLoginMode(false)}
            className={`flex-1 py-3 px-5 text-lg font-bold rounded-xl transition-all duration-300 ease-in-out transform ${
              !isLoginMode
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg-md scale-105"
                : "text-gray-300 hover:text-white hover:bg-gray-600 hover:bg-opacity-50"
            }`}
          >
            Sign Up
          </button>
        </div>

        <div className="mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">
            {isLoginMode ? "Welcome Back, Champion!" : "Forge Your Legend"}
          </h2>
          <p className="text-gray-400 mb-4 text-md opacity-90">
            {isLoginMode
              ? "Enter your credentials to continue your journey."
              : "Create your account and embark on new adventures."}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-7">
          {error && (
            <div className="px-5 py-4 rounded-lg relative shadow-md flex items-center bg-red-900 border border-red-600 text-red-100">
              <i className="mr-3 text-xl fas fa-exclamation-triangle"></i>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="px-5 py-4 rounded-lg relative shadow-md flex items-center bg-green-900 border border-green-600 text-green-100">
              <i className="mr-3 text-xl fas fa-check-circle"></i>
              <span className="block sm:inline">✅ {successMessage}</span>
            </div>
          )}

          {!isLoginMode && (
            <input
              type="text"
              placeholder="Username"
              className="shadow-sm border border-gray-600 rounded-lg w-full py-4 px-5 bg-gray-700 text-gray-200"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          )}

          <input
            type="email"
            placeholder="Email"
            className="shadow-sm border border-gray-600 rounded-lg w-full py-4 px-5 bg-gray-700 text-gray-200"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="shadow-sm border border-gray-600 rounded-lg w-full py-4 px-5 bg-gray-700 text-gray-200 pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          {!isLoginMode && (
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                className="shadow-sm border border-gray-600 rounded-lg w-full py-4 px-5 bg-gray-700 text-gray-200 pr-10"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>
          )}

          <button
            type="submit"
            className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg w-full transition duration-300 transform hover:scale-105 focus:outline-none"
            disabled={loading}
          >
            {loading
              ? isLoginMode
                ? "Signing In..."
                : "Creating Account..."
              : isLoginMode
              ? "Sign In"
              : "Create Account"}
          </button>

          {isLoginMode && (
                 <div className="text-center">
                   <button
                     type="button"
                     onClick={() => setShowForgotPassword(true)}
                     className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors duration-200"
                   >
                     <i className="fas fa-key mr-2"></i>
                     Forgot Password?
                   </button>
                 </div>
               )}
          <p className="text-center text-sm text-gray-400">
            By {isLoginMode ? "signing in" : "signing up"}, you agree to our{" "}
            <a href="/terms" className="text-blue-400 hover:text-blue-300 underline">
              Terms of Service
            </a>
            {" "}and{" "}
            <a href="/privacy" className="text-blue-400 hover:text-blue-300 underline">
              Privacy Policy
            </a>
            .
          </p>
        </form>

        <div className="flex items-center my-7">
          <div className="flex-grow border-t border-gray-700 opacity-40"></div>
          <span className="flex-shrink mx-4 text-gray-500 text-sm opacity-80">
            OR
          </span>
          <div className="flex-grow border-t border-gray-700 opacity-40"></div>
        </div>

        <button
          onClick={handleDiscordLogin}
          className="bg-purple-700 hover:bg-purple-800 text-white font-semibold py-3 px-6 rounded-lg w-full flex items-center justify-center transition duration-300 transform hover:scale-105 focus:outline-none"
        >
          <i className="fab fa-discord text-xl mr-3"></i>{" "}
          {isLoginMode ? "Login with Discord" : "Sign up with Discord"}
        </button>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-lg w-full max-w-md mx-4 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">Reset Password</h3>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotPasswordMessage("");
                  setForgotPasswordEmail("");
                }}
                className="text-gray-400 hover:text-white text-xl"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {forgotPasswordMessage && (
              <div className={`mb-4 p-3 border rounded ${
                forgotPasswordMessage.includes('✅') 
                  ? 'bg-green-900 border-green-600 text-green-100' 
                  : 'bg-red-900 border-red-600 text-red-100'
              }`}>
                <i className={`mr-3 ${
                  forgotPasswordMessage.includes('✅') ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle'
                }`}></i>
                {forgotPasswordMessage}
              </div>
            )}

            <form onSubmit={handleForgotPassword}>
              <p className="text-gray-300 mb-4 text-sm">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full py-4 px-5 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 mb-6"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                required
              />
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordMessage("");
                    setForgotPasswordEmail("");
                  }}
                  className="flex-1 py-3 px-4 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0, 0) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite cubic-bezier(0.68, -0.55, 0.27, 1.55);
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .shadow-glow {
          box-shadow: 0 0 15px rgba(99, 102, 241, 0.4),
            0 0 30px rgba(168, 85, 247, 0.3);
        }
        .shadow-lg-md {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2),
            0 2px 4px -1px rgba(0, 0, 0, 0.12),
            0 0 15px rgba(99, 102, 241, 0.3);
        }
        .shadow-inner-lg {
          box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.2),
            inset 0 -2px 4px 0 rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}