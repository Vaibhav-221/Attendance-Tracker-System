import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-gray-900 to-gray-950 text-white p-6">

      {/* Title */}
      <h1 className="text-4xl md:text-5xl font-bold mb-12 text-center tracking-wide">
        Attendance Tracker System
        <span className="text-indigo-500"> (ATS)</span>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-3xl">

        {/* CR Section */}
        <div className="bg-gray-900 border border-gray-800 p-8 rounded-xl shadow-xl hover:shadow-indigo-900/40 transition duration-300">

          <h2 className="text-2xl font-semibold mb-6 text-center text-gray-200">
            Class Representative
          </h2>

          <div className="flex flex-col gap-4">

            <Link
              href="/cr/register"
              className="bg-indigo-600 hover:bg-indigo-700 transition py-3 rounded-lg text-center font-medium tracking-wide"
            >
              CR Register
            </Link>

            <Link
              href="/cr/login"
              className="bg-cyan-600 hover:bg-cyan-700 transition py-3 rounded-lg text-center font-medium tracking-wide"
            >
              CR Login
            </Link>

          </div>
        </div>

        {/* Student Section */}
        <div className="bg-gray-900 border border-gray-800 p-8 rounded-xl shadow-xl hover:shadow-indigo-900/40 transition duration-300">

          <h2 className="text-2xl font-semibold mb-6 text-center text-gray-200">
            Student
          </h2>

          <div className="flex flex-col gap-4">

            <Link
              href="/student/register"
              className="bg-indigo-600 hover:bg-indigo-700 transition py-3 rounded-lg text-center font-medium tracking-wide"
            >
              Student Register
            </Link>

            <Link
              href="/student/login"
              className="bg-cyan-600 hover:bg-cyan-700 transition py-3 rounded-lg text-center font-medium tracking-wide"
            >
              Student Login
            </Link>

          </div>
        </div>

      </div>

    </div>
  );
}