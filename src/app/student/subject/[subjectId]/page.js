"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  getDocs,
  collection
} from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { Book, TrendingUp, CheckCircle, XCircle, Calendar, Award, ArrowLeft, BarChart3 } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

export default function SubjectPage() {

  const { subjectId } = useParams();
  const router = useRouter();
  const { isDark } = useTheme();

  // Theme configuration
  const T = {
    page: isDark ? '#0A0E27' : '#F8FAFC',
    textMain: isDark ? 'text-white' : 'text-slate-900',
    textMuted: isDark ? 'text-gray-400' : 'text-slate-500',
    textSubtle: isDark ? 'text-gray-500' : 'text-slate-400',
    border: isDark ? 'border-[#1A1F3A]' : 'border-slate-200',
    accentColor: isDark ? '#00D9FF' : '#3B82F6',
    successColor: isDark ? '#10B981' : '#059669',
    warningColor: isDark ? '#F59E0B' : '#D97706',
    dangerColor: isDark ? '#EF4444' : '#DC2626',
    cardBg: isDark ? 'bg-gradient-to-br from-[#0F1629] to-[#0A0E27]' : 'bg-gradient-to-br from-white to-slate-50',
    modalOverlay: isDark ? 'bg-black/60' : 'bg-black/30',
  };

  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const [subjectName, setSubjectName] = useState("");

  const [total, setTotal] = useState(0);
  const [present, setPresent] = useState(0);
  const [absent, setAbsent] = useState(0);

  const [percent, setPercent] = useState(0);

  const [history, setHistory] = useState([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get attendance status based on percentage
  const getAttendanceStatus = (percent) => {
    if (percent >= 75) return { 
      color: 'text-[#10B981]', 
      bgGradient: 'from-[#10B981]/20 to-[#059669]/20',
      borderColor: 'border-[#10B981]/50',
      status: 'Excellent',
      icon: '🎯'
    };
    if (percent >= 50) return { 
      color: 'text-[#F59E0B]', 
      bgGradient: 'from-[#F59E0B]/20 to-[#D97706]/20',
      borderColor: 'border-[#F59E0B]/50',
      status: 'Good',
      icon: '⚠️'
    };
    return { 
      color: 'text-[#EF4444]', 
      bgGradient: 'from-[#EF4444]/20 to-[#DC2626]/20',
      borderColor: 'border-[#EF4444]/50',
      status: 'Needs Improvement',
      icon: '📉'
    };
  };

  useEffect(() => {

    const load = async () => {

      const user = auth.currentUser;

      // Check if user is authenticated
      if (!user) {
        router.push("/student/login");
        return;
      }

      try {
        const userDoc = await getDoc(
          doc(db,"users",user.uid)
        );

        if (!userDoc.exists()) {
          router.push("/student/login");
          return;
        }

        const classId = userDoc.data().classId;

        if (!classId) {
          router.push("/student/join-class");
          return;
        }

        const subjectDoc = await getDoc(
          doc(db,"classes",classId,"subjects",subjectId)
        );

        if (!subjectDoc.exists()) {
          router.push("/student/dashboard");
          return;
        }

        setSubjectName(subjectDoc.data().subjectName);

        const scheduleSnapshot = await getDocs(
          collection(db,"classes",classId,"dailySchedule")
        );

        let totalClasses = 0;
        let presentClasses = 0;

        let historyData = [];

        for (const scheduleDoc of scheduleSnapshot.docs) {

          const date = scheduleDoc.id;

          const subjects = scheduleDoc.data().subjects || [];

          if (subjects.includes(subjectId)) {

            totalClasses++;

            const attendanceDoc = await getDoc(
              doc(
                db,
                "classes",
                classId,
                "attendance",
                date,
                "students",
                user.uid
              )
            );

            let isPresent = false;

            if (
              attendanceDoc.exists() &&
              attendanceDoc.data().subjects.includes(subjectId)
            ) {
              presentClasses++;
              isPresent = true;
            }

            historyData.push({
              date,
              present: isPresent
            });

          }

        }

        const absentClasses = totalClasses - presentClasses;

        setTotal(totalClasses);
        setPresent(presentClasses);
        setAbsent(absentClasses);

        // Sort history by date (newest first)
        historyData.sort((a, b) => b.date.localeCompare(a.date));
        setHistory(historyData);

        const percentage =
          totalClasses === 0
            ? 0
            : ((presentClasses / totalClasses) * 100).toFixed(2);

        setPercent(percentage);

        setLoading(false);

      } catch (error) {
        console.error("Error loading subject data:", error);
        router.push("/student/dashboard");
      }

    };

    // Wait for auth state to be ready
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        load();
      } else {
        router.push("/student/login");
      }
    });

    return () => unsubscribe();

  }, [subjectId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: T.page }}>
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00D9FF]/10 rounded-full blur-[100px] animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#7C3AED]/10 rounded-full blur-[100px] animate-float-delayed"></div>
        </div>

        <div className="text-center relative z-10">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-[#00D9FF]/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-[#00D9FF] rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-4 border-transparent border-t-[#7C3AED] rounded-full animate-spin-slow"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 bg-gradient-to-br from-[#00D9FF] to-[#7C3AED] rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className={`text-lg font-medium animate-pulse ${T.textMuted}`}>Loading subject details...</p>
        </div>
      </div>
    );
  }

  const attendanceStatus = getAttendanceStatus(parseFloat(percent));

  return (

    <div className="min-h-screen relative overflow-hidden p-4 sm:p-6 lg:p-8" style={{ backgroundColor: T.page, color: isDark ? 'rgb(226,232,240)' : 'rgb(51, 65, 85)' }}>

      {/* Animated Background */}
      <div className="absolute top-[-50px] right-[-50px] sm:top-[-100px] sm:right-[-100px] w-[250px] h-[250px] sm:w-[400px] sm:h-[400px] bg-[#00D9FF]/5 rounded-full blur-[80px] sm:blur-[100px] animate-float"></div>
      <div className="absolute bottom-[-75px] left-[-75px] sm:bottom-[-150px] sm:left-[-150px] w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-[#7C3AED]/5 rounded-full blur-[80px] sm:blur-[120px] animate-float-delayed"></div>
      <div className="absolute top-1/2 left-1/2 w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] bg-[#10B981]/5 rounded-full blur-[80px] sm:blur-[100px] animate-pulse-slow"></div>

      <div className="max-w-7xl mx-auto relative z-10">

        {/* Modern Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className={`w-9 h-9 rounded-lg flex items-center justify-center ${isDark ? 'bg-white/5 border border-white/10 hover:bg-white/10' : 'bg-slate-100 border border-slate-200 hover:bg-slate-200'} transition-all group`}
            >
              <ArrowLeft className={`w-4 h-4 ${T.textMuted} group-hover:-translate-x-[2px] transition-transform`} />
            </button>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${isDark ? 'bg-white/5 border border-white/10' : 'bg-slate-100 border border-slate-200'}`}>
              <Book className={`w-4 h-4 text-[${T.accentColor}]`} />
              <span className={`text-xs font-medium ${T.textMuted}`}>Subject</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${isDark ? 'from-[#00D9FF] to-[#7C3AED]' : 'from-blue-500 to-indigo-600'} rounded-xl flex items-center justify-center shadow-lg ${isDark ? 'shadow-[#00D9FF]/30' : 'shadow-blue-500/30'}`}>
              <Book className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className={`text-lg sm:text-2xl font-bold ${T.textMain} truncate`}>
                {subjectName}
              </h1>
              <p className={`text-xs ${T.textSubtle}`}>Attendance Overview</p>
            </div>
          </div>
        </div>

        {/* Main Stats Card - Compact Version */}
        <div className={`bg-gradient-to-br ${attendanceStatus.bgGradient} border ${attendanceStatus.borderColor} rounded-xl p-4 mb-4 relative overflow-hidden`}>
          
          {/* Animated background orbs */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl animate-float"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl animate-float-delayed"></div>

          <div className="relative z-10">
            
            {/* Compact Header with Percentage */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center ${
                  parseFloat(percent) >= 75 ? 'bg-[#10B981]/20' :
                  parseFloat(percent) >= 50 ? 'bg-[#F59E0B]/20' : 'bg-[#EF4444]/20'
                }`}>
                  <Award className={`w-4 h-4 sm:w-5 sm:h-5 ${attendanceStatus.color}`} />
                </div>
                <div>
                  <p className={`text-gray-400 text-xs sm:text-sm`}>Overall Attendance</p>
                  <div className={`inline-block px-2 sm:px-3 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium ${
                    parseFloat(percent) >= 75 ? 'bg-[#10B981]/20 text-[#10B981]' :
                    parseFloat(percent) >= 50 ? 'bg-[#F59E0B]/20 text-[#F59E0B]' : 'bg-[#EF4444]/20 text-[#EF4444]'
                  }`}>
                    {attendanceStatus.status}
                  </div>
                </div>
              </div>
              <div className="text-right pr-1 sm:pr-2">
                <p className={`text-3xl sm:text-4xl font-bold ${attendanceStatus.color}`}>{percent}%</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className={`w-full ${isDark ? 'bg-[#1A1F3A]' : 'bg-slate-200'} h-2 rounded-full overflow-hidden mb-3`}>
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  parseFloat(percent) >= 75 ? `bg-[${T.successColor}]` :
                  parseFloat(percent) >= 50 ? `bg-[${T.warningColor}]` : `bg-[${T.dangerColor}]`
                }`}
                style={{ width: `${percent}%` }}
              ></div>
            </div>

            {/* Stats Grid - Always 3 columns */}
            <div className="grid grid-cols-3 gap-2">

              <div className={`${isDark ? 'bg-white/5' : 'bg-slate-100'} backdrop-blur-sm rounded-lg p-2 sm:p-3 text-center border ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                <BarChart3 className={`w-4 h-4 mx-auto mb-1 ${isDark ? 'text-gray-300' : 'text-slate-600'}`} />
                <p className={`text-lg sm:text-xl font-bold ${T.textMain}`}>{total}</p>
                <p className={`text-[10px] sm:text-xs ${T.textMuted}`}>Total</p>
              </div>

              <div className={`${isDark ? 'bg-[#10B981]/10' : 'bg-green-500/10'} backdrop-blur-sm rounded-lg p-2 sm:p-3 text-center border ${isDark ? 'border-[#10B981]/20' : 'border-green-500/20'}`}>
                <CheckCircle className={`w-4 h-4 mx-auto mb-1 ${isDark ? 'text-[#10B981]' : 'text-green-600'}`} />
                <p className={`text-lg sm:text-xl font-bold ${isDark ? 'text-[#10B981]' : 'text-green-600'}`}>{present}</p>
                <p className={`text-[10px] sm:text-xs ${T.textMuted}`}>Present</p>
              </div>

              <div className={`${isDark ? 'bg-[#EF4444]/10' : 'bg-red-500/10'} backdrop-blur-sm rounded-lg p-2 sm:p-3 text-center border ${isDark ? 'border-[#EF4444]/20' : 'border-red-500/20'}`}>
                <XCircle className={`w-4 h-4 mx-auto mb-1 ${isDark ? 'text-[#EF4444]' : 'text-red-600'}`} />
                <p className={`text-lg sm:text-xl font-bold ${isDark ? 'text-[#EF4444]' : 'text-red-600'}`}>{absent}</p>
                <p className={`text-[10px] sm:text-xs ${T.textMuted}`}>Absent</p>
              </div>

            </div>
          </div>
        </div>

        {/* Attendance History */}
        <div className={`${T.cardBg} border ${T.border} rounded-xl p-4`}>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-white/5 border border-white/10' : 'bg-slate-100 border border-slate-200'}`}>
                <Calendar className={`w-4 h-4 text-[${T.accentColor}]`} />
              </div>
              <h2 className={`text-base sm:text-lg font-semibold ${T.textMain}`}>Attendance History</h2>
            </div>
            <span className={`text-[10px] sm:text-xs ${T.textMuted} px-2 py-1 rounded-md ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>{history.length} sessions</span>
          </div>

          {history.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Calendar className={`w-12 h-12 sm:w-16 sm:h-16 ${isDark ? 'text-gray-700' : 'text-slate-400'} mx-auto mb-3 sm:mb-4`} />
              <p className={`text-base sm:text-lg ${T.textMuted}`}>No attendance records yet</p>
              <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-600' : 'text-slate-500'} mt-1 sm:mt-2`}>History will appear as classes are scheduled</p>
            </div>
          ) : (
            <div className="space-y-1.5 sm:space-y-2 max-h-[400px] sm:max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
              {history.map((item, index) => {
                // Format date
                const dateObj = new Date(item.date);
                const formattedDate = mounted ? dateObj.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                }) : item.date;

                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between gap-2 sm:gap-3 ${isDark ? 'bg-gradient-to-r from-[#0A0E27] to-[#0F1629]' : 'bg-slate-50'} border rounded-lg p-2 sm:p-3 transition-all duration-300 hover:scale-[1.01] ${
                      item.present
                        ? `border-[${T.successColor}]/30 hover:border-[${T.successColor}]/50`
                        : `border-[${T.dangerColor}]/30 hover:border-[${T.dangerColor}]/50`
                    }`}
                  >
                    
                    {/* Date and Icon */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0 ${
                        item.present ? (isDark ? 'bg-[#10B981]/20' : 'bg-green-500/20') : (isDark ? 'bg-[#EF4444]/20' : 'bg-red-500/20')
                      }`}>
                        {item.present ? (
                          <CheckCircle className={`w-3 h-3 sm:w-4 sm:h-4 ${isDark ? 'text-[#10B981]' : 'text-green-600'}`} />
                        ) : (
                          <XCircle className={`w-3 h-3 sm:w-4 sm:h-4 ${isDark ? 'text-[#EF4444]' : 'text-red-600'}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-xs sm:text-sm ${T.textMain} truncate`}>{formattedDate}</p>
                        <p className={`text-[10px] sm:text-xs ${T.textMuted}`}>Session {history.length - index}</p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium flex-shrink-0 ${
                      item.present
                        ? `${isDark ? 'bg-[#10B981]/20' : 'bg-green-500/20'} text-[${T.successColor}]`
                        : `${isDark ? 'bg-[#EF4444]/20' : 'bg-red-500/20'} text-[${T.dangerColor}]`
                    }`}>
                      {item.present ? '✓ Present' : '✗ Absent'}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

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

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(-360deg);
          }
        }
        
        .animate-spin-slow {
          animation: spin-slow 2s linear infinite;
        }

        /* Custom Scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1A1F3A;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #00D9FF;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #0EA5E9;
        }
      `}</style>

    </div>

  );

}