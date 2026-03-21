"use client";

import Link from "next/link";
import { User, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0E27] text-white p-6 relative overflow-hidden">

      {/* Enhanced Animated Background - Same as Dashboard */}
      <div className="absolute top-[-100px] right-[-100px] w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] bg-[#00D9FF]/5 rounded-full blur-[100px] animate-float"></div>
      <div className="absolute bottom-[-150px] left-[-150px] w-[350px] h-[350px] sm:w-[500px] sm:h-[500px] bg-[#7C3AED]/5 rounded-full blur-[120px] animate-float-delayed"></div>
      <div className="absolute top-1/2 left-1/2 w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] bg-[#10B981]/5 rounded-full blur-[100px] animate-pulse-slow"></div>

      <div className="relative z-10 max-w-6xl w-full">

        {/* Logo/Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-[#00D9FF] to-[#7C3AED] rounded-xl flex items-center justify-center shadow-lg shadow-[#00D9FF]/30 hover:scale-110 hover:rotate-12 transition-all duration-300 animate-bounce-slow">
            <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Title with Gradient */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 text-center tracking-wide animate-fadeIn">
          Attendance Tracker System
          <span className="block sm:inline text-transparent bg-clip-text bg-gradient-to-r from-[#00D9FF] to-[#7C3AED] animate-gradient"> (ATS)</span>
        </h1>

        <p className="text-gray-400 mb-10 text-center max-w-md mx-auto text-xs sm:text-sm">
          Select your role to continue
        </p>

        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 w-full max-w-2xl mx-auto px-4">

          {/* CR Card */}
          <Link href="/cr/login">
            <div className="group cursor-pointer bg-[#0F1629] border border-[#1A1F3A] p-6 rounded-xl shadow-xl transition-all duration-300 hover:scale-105 hover:border-[#7C3AED]/50 hover:shadow-2xl hover:shadow-[#7C3AED]/30 relative overflow-hidden">

              {/* Animated Background Glow */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#7C3AED]/5 rounded-full blur-2xl group-hover:bg-[#7C3AED]/10 transition-all duration-300"></div>
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-[#7C3AED]/5 rounded-full blur-xl group-hover:bg-[#7C3AED]/10 transition-all duration-300"></div>

              <div className="relative z-10">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <div className="bg-[#7C3AED]/10 p-4 rounded-full group-hover:bg-[#7C3AED]/20 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 border border-[#7C3AED]/20">
                    <Users className="w-8 h-8 text-[#7C3AED] group-hover:text-[#9D7FED] transition-colors duration-300" />
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-xl sm:text-2xl text-center font-semibold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#7C3AED] group-hover:to-[#9D7FED] transition-all duration-300">
                  Class Representative
                </h2>

                {/* Arrow Indicator */}
                <div className="flex justify-center mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <div className="bg-[#7C3AED]/10 px-3 py-1.5 rounded-full flex items-center gap-2 border border-[#7C3AED]/20">
                    <span className="text-[#7C3AED] text-xs font-medium">Get Started</span>
                    <svg className="w-3 h-3 text-[#7C3AED] group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>

            </div>
          </Link>

          {/* Student Card */}
          <Link href="/student/login">
            <div className="group cursor-pointer bg-[#0F1629] border border-[#1A1F3A] p-6 rounded-xl shadow-xl transition-all duration-300 hover:scale-105 hover:border-[#00D9FF]/50 hover:shadow-2xl hover:shadow-[#00D9FF]/30 relative overflow-hidden">

              {/* Animated Background Glow */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#00D9FF]/5 rounded-full blur-2xl group-hover:bg-[#00D9FF]/10 transition-all duration-300"></div>
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-[#00D9FF]/5 rounded-full blur-xl group-hover:bg-[#00D9FF]/10 transition-all duration-300"></div>

              <div className="relative z-10">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <div className="bg-[#00D9FF]/10 p-4 rounded-full group-hover:bg-[#00D9FF]/20 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 border border-[#00D9FF]/20">
                    <User className="w-8 h-8 text-[#00D9FF] group-hover:text-[#33E1FF] transition-colors duration-300" />
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-xl sm:text-2xl text-center font-semibold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#00D9FF] group-hover:to-[#33E1FF] transition-all duration-300">
                  Student
                </h2>

                {/* Arrow Indicator */}
                <div className="flex justify-center mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <div className="bg-[#00D9FF]/10 px-3 py-1.5 rounded-full flex items-center gap-2 border border-[#00D9FF]/20">
                    <span className="text-[#00D9FF] text-xs font-medium">Get Started</span>
                    <svg className="w-3 h-3 text-[#00D9FF] group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>

            </div>
          </Link>

        </div>

        {/* Footer Info */}
        <div className="mt-10 text-center">
          <p className="text-gray-600 text-xs">
            Powered by <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D9FF] to-[#7C3AED] font-medium">ATS</span> • Secure & Reliable
          </p>
        </div>

      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out;
        }
        
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(20px, -20px) scale(1.05);
          }
        }
        
        @keyframes float-delayed {
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
          animation: float-delayed 10s ease-in-out infinite;
        }
        
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.5;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>

    </div>
  );
}