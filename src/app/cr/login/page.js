"use client";

import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function CRLogin() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Auto redirect if already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role === "cr") {
          router.push("/cr/dashboard");
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogin = async () => {
    if (!email || !password) {
      return setError("Please fill all fields");
    }

    if (loading) return;

    try {
      setLoading(true);
      setError("");

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password.trim()
      );

      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists()) {
        throw new Error("User data not found");
      }

      if (userDoc.data().role !== "cr") {
        throw new Error("Access denied: Not a CR account");
      }

      router.push("/cr/dashboard");

    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F0F0F] text-white p-6 relative overflow-hidden">

      {/* Large Purple Gradient Circle - Top Left (Fixed positioning as in Figma) */}
      <div className="fixed top-[-200px] sm:top-[-250px] left-[-100px] sm:left-[-150px] w-[350px] h-[350px] sm:w-[600px] sm:h-[600px] bg-gradient-to-br from-[#530061] to-[#0D0A30] rounded-full opacity-80"></div>

      {/* Smaller Purple Gradient Glow - Bottom Right (subtle) */}
      <div className="fixed bottom-[-50px] right-[-50px] w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] bg-gradient-to-tl from-[#530061]/40 to-[#0D0A30]/20 rounded-full opacity-60 blur-3xl"></div>

      <div className="w-full max-w-[420px] relative z-10">

        {/* Login Card - Glass Morphism */}
        <div className="bg-white/5 backdrop-blur-xl p-8 sm:p-10 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">

          {/* Inner subtle glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl pointer-events-none"></div>

          <div className="relative z-10">
            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Login</h1>
            <p className="text-gray-400 text-sm mb-8">Glad you're back !</p>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Form */}
            <div className="flex flex-col gap-4 mb-4">

              {/* Username/Email Input */}
              <div>
                <input
                  type="email"
                  placeholder="Username"
                  className="w-full p-3.5 rounded-xl bg-transparent border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#7C3AED] transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="w-full p-3.5 rounded-xl bg-transparent border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#7C3AED] transition-all pr-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2 mb-6">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-transparent checked:bg-[#7C3AED] checked:border-[#7C3AED] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#7C3AED]"
              />
              <label htmlFor="remember" className="text-sm text-gray-300 cursor-pointer select-none">
                Remember me
              </label>
            </div>

            {/* Login Button */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className={`w-full py-3.5 rounded-xl font-medium transition-all duration-300 mb-4 ${
                loading
                  ? "bg-gradient-to-r from-[#6366F1]/50 to-[#7C3AED]/50 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#6366F1] to-[#7C3AED] hover:shadow-lg hover:shadow-[#7C3AED]/50 hover:scale-[1.02]"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Logging in...
                </span>
              ) : (
                "Login"
              )}
            </button>

            {/* Forgot Password */}
            <div className="text-center mb-8">
              <Link href="/cr/forgot-password" className="text-sm text-gray-400 hover:text-white transition-colors">
                Forgot password ?
              </Link>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <p className="text-gray-400 text-sm">
                Don't have an account ?{" "}
                <Link href="/cr/register" className="text-white hover:text-[#7C3AED] transition-colors font-medium">
                  Signup
                </Link>
              </p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}