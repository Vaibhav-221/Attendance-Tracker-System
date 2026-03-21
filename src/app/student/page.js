import Link from "next/link";
import { LogIn, UserPlus } from "lucide-react";

export default function StudentPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-gray-900 to-gray-950 text-white p-6">

      <h1 className="text-3xl font-bold mb-10 text-cyan-400 animate-fadeIn">
        Student Panel
      </h1>

      <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md transition hover:shadow-cyan-500/20">

        <div className="flex flex-col gap-5">

          {/* Register */}
          <Link
            href="/student/register"
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 transition py-3 rounded-lg font-medium hover:scale-105"
          >
            <UserPlus size={18} />
            Student Register
          </Link>

          {/* Login */}
          <Link
            href="/student/login"
            className="flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 transition py-3 rounded-lg font-medium hover:scale-105"
          >
            <LogIn size={18} />
            Student Login
          </Link>

        </div>

      </div>

    </div>
  );
}