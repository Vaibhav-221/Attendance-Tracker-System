import Link from "next/link";
import { LogIn, UserPlus } from "lucide-react";

export default function CRPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-gray-900 to-gray-950 text-white p-6">

      <h1 className="text-3xl font-bold mb-10 text-indigo-400 animate-fadeIn">
        CR Panel
      </h1>

      <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md transition hover:shadow-indigo-500/20">

        <div className="flex flex-col gap-5">

          {/* Register */}
          <Link
            href="/cr/register"
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 transition py-3 rounded-lg font-medium hover:scale-105"
          >
            <UserPlus size={18} />
            CR Register
          </Link>

          {/* Login */}
          <Link
            href="/cr/login"
            className="flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 transition py-3 rounded-lg font-medium hover:scale-105"
          >
            <LogIn size={18} />
            CR Login
          </Link>

        </div>

      </div>

    </div>
  );
}