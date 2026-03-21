import Link from "next/link";
import { User, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-gray-900 to-gray-950 text-white p-6">

      {/* Title */}
      <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center tracking-wide animate-fadeIn">
        Attendance Tracker System
        <span className="text-indigo-500"> (ATS)</span>
      </h1>

      {/* Subtitle */}
      <p className="text-gray-400 mb-12 text-center max-w-md">
        Manage attendance efficiently with role-based access for Class Representatives and Students.
      </p>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-4xl">

        {/* CR Card */}
        <Link href="/cr">
          <div className="group cursor-pointer bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-xl transition duration-300 hover:scale-105 hover:border-indigo-500 hover:shadow-indigo-500/30">

            <div className="flex justify-center mb-6">
              <div className="bg-indigo-600/20 p-4 rounded-full group-hover:bg-indigo-600/30 transition">
                <Users className="w-8 h-8 text-indigo-400" />
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-center mb-3">
              Class Representative
            </h2>

            <p className="text-gray-400 text-center text-sm">
              Manage attendance, update records, and oversee student data.
            </p>

          </div>
        </Link>

        {/* Student Card */}
        <Link href="/student">
          <div className="group cursor-pointer bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-xl transition duration-300 hover:scale-105 hover:border-cyan-500 hover:shadow-cyan-500/30">

            <div className="flex justify-center mb-6">
              <div className="bg-cyan-600/20 p-4 rounded-full group-hover:bg-cyan-600/30 transition">
                <User className="w-8 h-8 text-cyan-400" />
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-center mb-3">
              Student
            </h2>

            <p className="text-gray-400 text-center text-sm">
              Track your attendance, view records, and stay updated.
            </p>

          </div>
        </Link>

      </div>

    </div>
  );
}