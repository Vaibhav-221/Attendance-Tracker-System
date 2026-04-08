"use client";

import Link from "next/link";
import { User, Users, Award, Shield, Zap } from "lucide-react";
import { useEffect, useState } from "react";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0E27] text-white p-6 relative overflow-hidden">

      {/* Animated Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(#00D9FF 1px, transparent 1px), linear-gradient(90deg, #00D9FF 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          animation: 'gridMove 20s linear infinite'
        }}></div>
      </div>

      {/* Multiple Animated Gradient Orbs */}
      <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] bg-gradient-to-br from-[#00D9FF]/20 to-[#0EA5E9]/20 rounded-full blur-[120px] animate-float"></div>
      <div className="absolute top-[-100px] right-[-150px] w-[400px] h-[400px] bg-gradient-to-br from-[#7C3AED]/20 to-[#9D7FED]/20 rounded-full blur-[100px] animate-float-delayed"></div>
      <div className="absolute bottom-[-150px] left-[10%] w-[450px] h-[450px] bg-gradient-to-br from-[#10B981]/15 to-[#059669]/15 rounded-full blur-[110px] animate-float-slow"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-[380px] h-[380px] bg-gradient-to-br from-[#F59E0B]/15 to-[#D97706]/15 rounded-full blur-[100px] animate-float"></div>
      <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-gradient-to-br from-[#EC4899]/10 to-[#DB2777]/10 rounded-full blur-[90px] animate-pulse-slow"></div>

      {/* Floating Particles - Client side only */}
      {mounted && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-gradient-to-br from-[#00D9FF] to-[#7C3AED] rounded-full opacity-40"
              style={{
                left: `${(i * 7 + 13) % 100}%`,
                top: `${(i * 11 + 17) % 100}%`,
                animation: `floatParticle ${5 + (i % 5)}s ease-in-out infinite`,
                animationDelay: `${(i % 5) * 0.5}s`
              }}
            ></div>
          ))}
        </div>
      )}

      <div className="relative z-10 max-w-7xl w-full">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src="/Croppedlogo.jpeg" alt="Attendance Sarthi Logo" className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-3xl p-4" />
        </div>

        {/* Hero Title with Advanced Animations */}
        <div className="text-center mb-3">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 tracking-wide animate-fadeInUp">
            <span className="inline-block animate-shimmer bg-gradient-to-r from-white via-[#00D9FF] to-white bg-[length:200%_100%] text-transparent bg-clip-text">
              Attendance Sarthi
            </span>
          </h1>
        </div>

        {/* Animated Feature Pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-5 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          <div className="px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 flex items-center gap-2 hover:scale-105 transition-all duration-300 hover:bg-white/10 group">
            <Zap className="w-4 h-4 text-[#F59E0B] group-hover:animate-pulse" />
            <span className="text-sm text-gray-300">Real-time Tracking</span>
          </div>
          <div className="px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 flex items-center gap-2 hover:scale-105 transition-all duration-300 hover:bg-white/10 group">
            <Shield className="w-4 h-4 text-[#10B981] group-hover:animate-pulse" />
            <span className="text-sm text-gray-300">Secure & Reliable</span>
          </div>
          <div className="px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 flex items-center gap-2 hover:scale-105 transition-all duration-300 hover:bg-white/10 group">
            <Award className="w-4 h-4 text-[#EC4899] group-hover:animate-pulse" />
            <span className="text-sm text-gray-300">Easy to Use</span>
          </div>
        </div>

        <p className="text-gray-400 mb-5 text-center max-w-md mx-auto text-sm sm:text-base animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
          Select your role to continue
        </p>

        {/* Premium Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 w-full max-w-4xl mx-auto px-4 mb-8">

          {/* CR Card with Enhanced Effects */}
          <Link href="/cr/login">
            <div className="group cursor-pointer relative animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
              
              {/* Outer glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#7C3AED] to-[#9D7FED] rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-all duration-500"></div>
              
              {/* Main card */}
              <div className="relative bg-gradient-to-br from-[#0F1629] to-[#0A0E27] border border-[#1A1F3A] p-8 rounded-2xl shadow-2xl transition-all duration-500 hover:scale-[1.03] hover:border-[#7C3AED]/50 hover:shadow-[#7C3AED]/30 overflow-hidden">

                {/* Animated Background Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#7C3AED]/5 rounded-full blur-2xl group-hover:bg-[#7C3AED]/15 transition-all duration-500 animate-float"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#9D7FED]/5 rounded-full blur-xl group-hover:bg-[#9D7FED]/15 transition-all duration-500 animate-float-delayed"></div>
                
                {/* Scanning line effect */}
                <div className="absolute inset-0 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#7C3AED]/10 to-transparent h-full animate-scan"></div>
                </div>

                {/* Mobile pulsing effect - always visible on mobile */}
                <div className="md:hidden absolute inset-0 bg-gradient-to-br from-[#7C3AED]/5 to-transparent animate-pulse-mobile pointer-events-none"></div>

                <div className="relative z-10">
                  {/* Icon with ZOOM ONLY (no rotation) */}
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-[#7C3AED] rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition-all duration-500 animate-pulse-slow"></div>
                      <div className="relative bg-gradient-to-br from-[#7C3AED]/20 to-[#9D7FED]/20 p-6 rounded-2xl border border-[#7C3AED]/30 group-hover:scale-125 transition-all duration-500 backdrop-blur-sm">
                        <Users className="w-10 h-10 text-[#7C3AED] group-hover:text-[#9D7FED] transition-colors duration-500 drop-shadow-lg" />
                      </div>
                    </div>
                  </div>

                  {/* Title with gradient animation */}
                  <h2 className="text-2xl sm:text-3xl text-center font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#7C3AED] group-hover:via-[#9D7FED] group-hover:to-[#7C3AED] transition-all duration-500">
                    Class Representative
                  </h2>

                  <p className="text-center text-gray-500 text-sm mb-4 group-hover:text-gray-400 transition-colors duration-300">
                    Manage classes, subjects, and schedules
                  </p>

                  {/* Animated CTA */}
                  <div className="flex justify-center mt-6 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
                    <div className="bg-gradient-to-r from-[#7C3AED] to-[#9D7FED] px-6 py-2.5 rounded-full flex items-center gap-2 shadow-lg shadow-[#7C3AED]/30">
                      <span className="text-white text-sm font-medium">Get Started</span>
                      <svg className="w-4 h-4 text-white animate-bounce-horizontal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </Link>

          {/* Student Card with Enhanced Effects */}
          <Link href="/student/login">
            <div className="group cursor-pointer relative animate-fadeInUp" style={{ animationDelay: '0.5s' }}>
              
              {/* Outer glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#00D9FF] to-[#0EA5E9] rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-all duration-500"></div>
              
              {/* Main card */}
              <div className="relative bg-gradient-to-br from-[#0F1629] to-[#0A0E27] border border-[#1A1F3A] p-8 rounded-2xl shadow-2xl transition-all duration-500 hover:scale-[1.03] hover:border-[#00D9FF]/50 hover:shadow-[#00D9FF]/30 overflow-hidden">

                {/* Animated Background Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#00D9FF]/5 rounded-full blur-2xl group-hover:bg-[#00D9FF]/15 transition-all duration-500 animate-float"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#0EA5E9]/5 rounded-full blur-xl group-hover:bg-[#0EA5E9]/15 transition-all duration-500 animate-float-delayed"></div>
                
                {/* Scanning line effect */}
                <div className="absolute inset-0 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00D9FF]/10 to-transparent h-full animate-scan"></div>
                </div>

                {/* Mobile pulsing effect - always visible on mobile */}
                <div className="md:hidden absolute inset-0 bg-gradient-to-br from-[#00D9FF]/5 to-transparent animate-pulse-mobile pointer-events-none"></div>

                <div className="relative z-10">
                  {/* Icon with ZOOM ONLY (no rotation) */}
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-[#00D9FF] rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition-all duration-500 animate-pulse-slow"></div>
                      <div className="relative bg-gradient-to-br from-[#00D9FF]/20 to-[#0EA5E9]/20 p-6 rounded-2xl border border-[#00D9FF]/30 group-hover:scale-125 transition-all duration-500 backdrop-blur-sm">
                        <User className="w-10 h-10 text-[#00D9FF] group-hover:text-[#33E1FF] transition-colors duration-500 drop-shadow-lg" />
                      </div>
                    </div>
                  </div>

                  {/* Title with gradient animation */}
                  <h2 className="text-2xl sm:text-3xl text-center font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#00D9FF] group-hover:via-[#33E1FF] group-hover:to-[#00D9FF] transition-all duration-500">
                    Student
                  </h2>

                  <p className="text-center text-gray-500 text-sm mb-4 group-hover:text-gray-400 transition-colors duration-300">
                    Track attendance and view schedules
                  </p>

                  {/* Animated CTA */}
                  <div className="flex justify-center mt-6 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
                    <div className="bg-gradient-to-r from-[#00D9FF] to-[#0EA5E9] px-6 py-2.5 rounded-full flex items-center gap-2 shadow-lg shadow-[#00D9FF]/30">
                      <span className="text-white text-sm font-medium">Get Started</span>
                      <svg className="w-4 h-4 text-white animate-bounce-horizontal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </Link>

        </div>

        {/* Footer with Animation */}
        <div className="text-center animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
          <p className="text-gray-600 text-xs sm:text-sm">
            Powered by{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D9FF] via-[#7C3AED] to-[#EC4899] font-bold animate-gradient-flow">
              ATS
            </span>
          </p>
        </div>

      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out forwards;
          opacity: 0;
        }

        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }

        @keyframes gradientFlow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .animate-gradient-flow {
          background-size: 200% 200%;
          animation: gradientFlow 3s ease infinite;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, -20px) scale(1.05); }
        }

        @keyframes floatDelayed {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-20px, 20px) scale(1.05); }
        }

        @keyframes floatSlow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(15px, 15px) scale(1.03); }
        }

        .animate-float { animation: float 8s ease-in-out infinite; }
        .animate-float-delayed { animation: floatDelayed 10s ease-in-out infinite; }
        .animate-float-slow { animation: floatSlow 12s ease-in-out infinite; }

        @keyframes pulseSlow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }

        .animate-pulse-slow {
          animation: pulseSlow 4s ease-in-out infinite;
        }

        @keyframes pulseMobile {
          0%, 100% { opacity: 0.05; }
          50% { opacity: 0.15; }
        }

        .animate-pulse-mobile {
          animation: pulseMobile 3s ease-in-out infinite;
        }

        @keyframes bounceSlow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }

        .animate-bounce-slow {
          animation: bounceSlow 3s ease-in-out infinite;
        }

        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-spin-slow {
          animation: spinSlow 8s linear infinite;
        }

        @keyframes spinReverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }

        .animate-spin-reverse {
          animation: spinReverse 6s linear infinite;
        }

        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }

        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }

        @keyframes bounceHorizontal {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(5px); }
        }

        .animate-bounce-horizontal {
          animation: bounceHorizontal 1s ease-in-out infinite;
        }

        @keyframes pulseGlow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }

        .animate-pulse-glow {
          animation: pulseGlow 2s ease-in-out infinite;
        }

        @keyframes expandRight {
          from { width: 0; }
          to { width: 3rem; }
        }

        .animate-expand-right {
          animation: expandRight 1s ease-out forwards;
          animation-delay: 0.5s;
          width: 0;
        }

        @keyframes expandLeft {
          from { width: 0; }
          to { width: 3rem; }
        }

        .animate-expand-left {
          animation: expandLeft 1s ease-out forwards;
          animation-delay: 0.5s;
          width: 0;
        }

        @keyframes floatParticle {
          0%, 100% { 
            transform: translate(0, 0) scale(1);
            opacity: 0.4;
          }
          25% { 
            transform: translate(20px, -30px) scale(1.2);
            opacity: 0.6;
          }
          50% { 
            transform: translate(-15px, -60px) scale(0.8);
            opacity: 0.3;
          }
          75% { 
            transform: translate(25px, -40px) scale(1.1);
            opacity: 0.5;
          }
        }

        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }

        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>

    </div>
  );
}