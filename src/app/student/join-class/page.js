"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Users, ArrowRight, AlertCircle } from "lucide-react";

export default function JoinClass() {
  const router = useRouter();

  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoinClass = async () => {
    if (loading) return;

    if (!joinCode.trim()) {
      setError("Join Code is required.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const classesRef = collection(db, "classes");
      const q = query(classesRef, where("joinCode", "==", joinCode.trim().toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("Invalid Join Code.");
      }

      const classDoc = querySnapshot.docs[0];
      const classId = classDoc.id;

      const user = auth.currentUser;

      if (!user) {
        throw new Error("User not authenticated.");
      }

      await updateDoc(doc(db, "users", user.uid), {
        classId: classId
      });

      router.push("/student/dashboard");

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleJoinClass();
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Animated Background Gradient Circles */}
      <div className="fixed top-[-200px] sm:top-[-300px] left-[-100px] sm:left-[-200px] w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] rounded-full bg-linear-to-br from-[#00D9FF] to-[#0A4D5C] opacity-20 blur-[100px] sm:blur-[150px] animate-float"></div>
      <div className="fixed bottom-[-200px] sm:bottom-[-300px] right-[-100px] sm:right-[-200px] w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] rounded-full bg-linear-to-br from-[#00D9FF] to-[#0A4D5C] opacity-15 blur-[100px] sm:blur-[150px] animate-float-delayed"></div>

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        
        {/* Glass Morphism Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 sm:p-10 shadow-2xl">
          
          {/* Logo/Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-linear-to-br from-[#00D9FF] to-[#0EA5E9] rounded-2xl flex items-center justify-center shadow-lg shadow-[#00D9FF]/50 hover:scale-110 transition-all duration-300">
              <Users className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-center text-white mb-3">
            Join Class
          </h1>
          <p className="text-center text-gray-400 mb-8">
            Enter your class join code to get started
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Join Code Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Join Code
            </label>
            <input
              type="text"
              placeholder="Enter 6-digit code"
              className="w-full bg-transparent border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-[#00D9FF] focus:outline-none transition-colors duration-300 font-mono text-lg tracking-wider uppercase"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              maxLength={6}
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-2">
              💡 Ask your Class Representative for the join code
            </p>
          </div>

          {/* Join Button */}
          <button
            onClick={handleJoinClass}
            disabled={loading || !joinCode.trim()}
            className={`w-full py-4 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 ${
              loading || !joinCode.trim()
                ? "bg-linear-to-r from-[#00D9FF]/50 to-[#0EA5E9]/50 cursor-not-allowed"
                : "bg-linear-to-r from-[#00D9FF] to-[#0EA5E9] hover:scale-105 hover:shadow-lg hover:shadow-[#00D9FF]/50"
            }`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                Joining Class...
              </>
            ) : (
              <>
                Join Class
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          {/* Back to Login Link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push("/student/login")}
              className="text-gray-400 hover:text-[#00D9FF] transition-colors text-sm"
            >
              ← Back to Login
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            Powered by{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-[#00D9FF] to-[#7C3AED] font-bold">
              ATS
            </span>
          </p>
        </div>

      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(20px, -20px) scale(1.05);
          }
        }

        @keyframes floatDelayed {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-20px, 20px) scale(1.05);
          }
        }

        .animate-float {
          animation: float 8s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: floatDelayed 10s ease-in-out infinite;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>

    </div>
  );
}
