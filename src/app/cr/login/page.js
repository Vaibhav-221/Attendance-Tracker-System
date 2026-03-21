"use client";

import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn } from "lucide-react";

export default function CRLogin() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-gray-950 text-white p-6">

      <div className="w-full max-w-md bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-800 animate-fadeIn">

        <h1 className="text-2xl font-bold text-center mb-6 text-indigo-400">
          CR Login
        </h1>

        {error && (
          <p className="text-red-400 text-sm text-center mb-4">{error}</p>
        )}

        <div className="flex flex-col gap-4">

          <input
            type="email"
            placeholder="Enter Email"
            className="p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-indigo-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Enter Password"
            className="p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-indigo-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={handleLogin}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 py-3 rounded-lg font-medium transition hover:scale-105 disabled:opacity-50"
          >
            <LogIn size={18} />
            {loading ? "Logging in..." : "Login"}
          </button>

        </div>

        {/* Register */}
        <p className="text-center text-sm text-gray-400 mt-6">
          Don’t have an account?{" "}
          <Link href="/cr/register" className="text-indigo-400 hover:underline">
            Register here
          </Link>
        </p>

      </div>

    </div>
  );
}