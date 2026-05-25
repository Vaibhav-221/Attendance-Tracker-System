"use client";

import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function StudentRegister() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (loading) return;

    if (!name || !email || !password) {
      setError("All fields are required.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password.trim()
      );

      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        name: name.trim(),
        email: email.trim(),
        role: "student",
        classId: null,
        createdAt: new Date()
      });

      await signOut(auth);

      router.push("/student/login");

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F0F0F] text-white p-6 relative overflow-hidden">

      {/* Large Cyan Gradient Circle - Top Left (Fixed positioning as in Figma) */}
      <div className="fixed top-[-200px] sm:top-[-250px] left-[-100px] sm:left-[-150px] w-[350px] h-[350px] sm:w-[600px] sm:h-[600px] bg-linear-to-br from-[#00D9FF] to-[#0A4D5C] rounded-full opacity-80"></div>

      {/* Smaller Cyan Gradient Glow - Bottom Right (subtle) */}
      <div className="fixed bottom-[-50px] right-[-50px] w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] bg-linear-to-tl from-[#00D9FF]/40 to-[#0A4D5C]/20 rounded-full opacity-60 blur-3xl"></div>

      <div className="w-full max-w-[420px] relative z-10">

        {/* Register Card - Glass Morphism */}
        <div className="bg-white/5 backdrop-blur-xl p-8 sm:p-10 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">

          {/* Inner subtle glow */}
          <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent rounded-3xl pointer-events-none"></div>

          <div className="relative z-10">
            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Sign Up</h1>
            <p className="text-gray-400 text-sm mb-8">Create your student account</p>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Form */}
            <div className="flex flex-col gap-4 mb-6">

              {/* Full Name Input */}
              <div>
                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full p-3.5 rounded-xl bg-transparent border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#00D9FF] transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleRegister()}
                />
              </div>

              {/* Email Input */}
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full p-3.5 rounded-xl bg-transparent border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#00D9FF] transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleRegister()}
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="w-full p-3.5 rounded-xl bg-transparent border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#00D9FF] transition-all pr-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleRegister()}
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

            {/* Register Button */}
            <button
              onClick={handleRegister}
              disabled={loading}
              className={`w-full py-3.5 rounded-xl font-medium transition-all duration-300 mb-8 ${
                loading
                  ? "bg-linear-to-r from-[#00D9FF]/50 to-[#0EA5E9]/50 cursor-not-allowed"
                  : "bg-linear-to-r from-[#00D9FF] to-[#0EA5E9] hover:shadow-lg hover:shadow-[#00D9FF]/50 hover:scale-[1.02]"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Creating account...
                </span>
              ) : (
                "Sign Up"
              )}
            </button>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-gray-400 text-sm">
                Already have an account ?{" "}
                <Link href="/student/login" className="text-white hover:text-[#00D9FF] transition-colors font-medium">
                  Login
                </Link>
              </p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
