import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6">

      <h1 className="text-4xl font-bold mb-8">
        Attendance Tracker System (ATS)
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-xl">

        {/* CR Section */}
        <div className="border border-gray-700 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4 text-center">
            Class Representative
          </h2>

          <div className="flex flex-col gap-3">
            <Link
              href="/cr/register"
              className="bg-green-600 hover:bg-green-700 text-center py-2 rounded"
            >
              CR Register
            </Link>

            <Link
              href="/cr/login"
              className="bg-blue-600 hover:bg-blue-700 text-center py-2 rounded"
            >
              CR Login
            </Link>
          </div>
        </div>

        {/* Student Section */}
        <div className="border border-gray-700 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4 text-center">
            Student
          </h2>

          <div className="flex flex-col gap-3">
            <Link
              href="/student/register"
              className="bg-green-600 hover:bg-green-700 text-center py-2 rounded"
            >
              Student Register
            </Link>

            <Link
              href="/student/login"
              className="bg-blue-600 hover:bg-blue-700 text-center py-2 rounded"
            >
              Student Login
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}