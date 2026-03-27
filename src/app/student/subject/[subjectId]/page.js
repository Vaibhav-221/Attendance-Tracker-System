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

export default function SubjectPage() {

  const { subjectId } = useParams();
  const router = useRouter();

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
      <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center relative overflow-hidden">
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
          <p className="text-gray-400 text-lg font-medium animate-pulse">Loading subject details...</p>
        </div>
      </div>
    );
  }

  const attendanceStatus = getAttendanceStatus(parseFloat(percent));

  return (

    <div className="min-h-screen bg-[#0A0E27] text-gray-200 p-4 sm:p-6 lg:p-8 relative overflow-hidden">

      {/* Animated Background */}
      <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] bg-[#00D9FF]/5 rounded-full blur-[100px] animate-float"></div>
      <div className="absolute bottom-[-150px] left-[-150px] w-[500px] h-[500px] bg-[#7C3AED]/5 rounded-full blur-[120px] animate-float-delayed"></div>
      <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-[#10B981]/5 rounded-full blur-[100px] animate-pulse-slow"></div>

      <div className="max-w-4xl mx-auto relative z-10">

        {/* Header with Back Button */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-[#00D9FF] transition-colors mb-6 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#00D9FF] to-[#7C3AED] rounded-2xl flex items-center justify-center shadow-lg shadow-[#00D9FF]/30">
              <Book className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white">
                {subjectName}
              </h1>
              <p className="text-gray-400 text-sm mt-1">Subject Details & Attendance History</p>
            </div>
          </div>
        </div>

        {/* Main Stats Card */}
        <div className={`bg-gradient-to-br ${attendanceStatus.bgGradient} border ${attendanceStatus.borderColor} rounded-2xl p-6 sm:p-8 mb-8 relative overflow-hidden`}>
          
          {/* Animated background orbs */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl animate-float"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl animate-float-delayed"></div>

          <div className="relative z-10">
            {/* Percentage Display */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Award className={`w-10 h-10 ${attendanceStatus.color}`} />
                <p className={`text-7xl sm:text-8xl font-bold ${attendanceStatus.color}`}>
                  {percent}%
                </p>
                <span className="text-5xl">{attendanceStatus.icon}</span>
              </div>
              <p className="text-gray-400 text-lg mb-2">Overall Attendance</p>
              <div className={`inline-block px-4 py-2 rounded-full ${
                parseFloat(percent) >= 75 ? 'bg-[#10B981]/20 text-[#10B981]' :
                parseFloat(percent) >= 50 ? 'bg-[#F59E0B]/20 text-[#F59E0B]' : 'bg-[#EF4444]/20 text-[#EF4444]'
              } font-medium`}>
                {attendanceStatus.status}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#1A1F3A] h-3 rounded-full overflow-hidden mb-8">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  parseFloat(percent) >= 75 ? 'bg-[#10B981]' :
                  parseFloat(percent) >= 50 ? 'bg-[#F59E0B]' : 'bg-[#EF4444]'
                }`}
                style={{ width: `${percent}%` }}
              ></div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10">
                <BarChart3 className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                <p className="text-3xl font-bold text-white">{total}</p>
                <p className="text-gray-400 text-sm">Total Classes</p>
              </div>

              <div className="bg-[#10B981]/10 backdrop-blur-sm rounded-xl p-4 text-center border border-[#10B981]/20">
                <CheckCircle className="w-6 h-6 text-[#10B981] mx-auto mb-2" />
                <p className="text-3xl font-bold text-[#10B981]">{present}</p>
                <p className="text-gray-400 text-sm">Present</p>
              </div>

              <div className="bg-[#EF4444]/10 backdrop-blur-sm rounded-xl p-4 text-center border border-[#EF4444]/20">
                <XCircle className="w-6 h-6 text-[#EF4444] mx-auto mb-2" />
                <p className="text-3xl font-bold text-[#EF4444]">{absent}</p>
                <p className="text-gray-400 text-sm">Absent</p>
              </div>

            </div>
          </div>
        </div>

        {/* Attendance History */}
        <div className="bg-gradient-to-br from-[#0F1629] to-[#0A0E27] border border-[#1A1F3A] rounded-2xl p-6 sm:p-8">
          
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-6 h-6 text-[#00D9FF]" />
            <h2 className="text-2xl font-semibold text-white">Attendance History</h2>
            <span className="text-sm text-gray-500 ml-auto">{history.length} sessions</span>
          </div>

          {history.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No attendance records yet</p>
              <p className="text-gray-600 text-sm mt-2">History will appear as classes are scheduled</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {history.map((item, index) => {
                // Format date
                const dateObj = new Date(item.date);
                const formattedDate = mounted ? dateObj.toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                }) : item.date;

                return (
                  <div
                    key={index}
                    className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gradient-to-r from-[#0A0E27] to-[#0F1629] border rounded-xl p-4 sm:p-5 transition-all duration-300 hover:scale-[1.02] ${
                      item.present 
                        ? 'border-[#10B981]/30 hover:border-[#10B981]/50' 
                        : 'border-[#EF4444]/30 hover:border-[#EF4444]/50'
                    }`}
                  >
                    
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        item.present ? 'bg-[#10B981]/20' : 'bg-[#EF4444]/20'
                      }`}>
                        {item.present ? (
                          <CheckCircle className="w-5 h-5 text-[#10B981]" />
                        ) : (
                          <XCircle className="w-5 h-5 text-[#EF4444]" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{formattedDate}</p>
                        <p className="text-xs text-gray-500">Session {history.length - index}</p>
                      </div>
                    </div>

                    <div className={`px-4 py-2 rounded-full font-medium ${
                      item.present 
                        ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30' 
                        : 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30'
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