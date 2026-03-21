"use client";

import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn } from "lucide-react";

export default function StudentLogin() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (userDoc.exists() && userDoc.data().role === "student") {
          if (!userDoc.data().classId) {
            router.push("/student/join-class");
          } else {
            router.push("/student/dashboard");
          }
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

      if (!userDoc.exists() || userDoc.data().role !== "student") {
        throw new Error("Access denied: Not a student account");
      }

      if (!userDoc.data().classId) {
        router.push("/student/join-class");
      } else {
        router.push("/student/dashboard");
      }

    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-gray-950 text-white p-6">

      <div className="w-full max-w-md bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-800 animate-fadeIn">

        <h1 className="text-2xl font-bold text-center mb-6 text-cyan-400">
          Student Login
        </h1>

        {error && (
          <p className="text-red-400 text-sm text-center mb-4">{error}</p>
        )}

        <div className="flex flex-col gap-4">

          <input
            type="email"
            placeholder="Enter Email"
            className="p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-cyan-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Enter Password"
            className="p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-cyan-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={handleLogin}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 py-3 rounded-lg font-medium transition hover:scale-105 disabled:opacity-50"
          >
            <LogIn size={18} />
            {loading ? "Logging in..." : "Login"}
          </button>

        </div>

        {/* Register */}
        <p className="text-center text-sm text-gray-400 mt-6">
          Don’t have an account?{" "}
          <Link href="/student/register" className="text-cyan-400 hover:underline">
            Register here
          </Link>
        </p>

      </div>

    </div>
  );
}