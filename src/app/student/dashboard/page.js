"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  setDoc,
  onSnapshot
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Calendar, TrendingUp, Book, CheckCircle, Clock, Award, BarChart3, User } from "lucide-react";

export default function StudentDashboard() {

  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  const [allSubjects, setAllSubjects] = useState([]);
  const [todaySubjects, setTodaySubjects] = useState([]);

  const [markedSubjects, setMarkedSubjects] = useState([]);
  const [attendancePercent, setAttendancePercent] = useState(0);

  const [subjectStats, setSubjectStats] = useState([]);

  const [marking, setMarking] = useState({});
  const [undoing, setUndoing] = useState({});
  const [updating, setUpdating] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
  
      if (!user) {
        router.push("/student/login");
        return;
      }
  
      const userDoc = await getDoc(doc(db, "users", user.uid));
  
      if (!userDoc.exists()) {
        router.push("/student/login");
        return;
      }
  
      const role = userDoc.data().role;
  
      if (role !== "student" && role !== "cr") {
        router.push("/student/login");
        return;
      }
  
      if (!userDoc.data().classId) {
        router.push("/student/join-class");
        return;
      }
  
      const classId = userDoc.data().classId;
  
      setUserData(userDoc.data());
  
      await fetchAllSubjects(classId);
      await fetchAttendanceHistory(classId, user.uid);
  
      listenToSchedule(classId);
      listenToTodayAttendance(classId, user.uid);
  
      setLoading(false);
  
    });
  
    return () => unsubscribe();
  
  }, []);

  const fetchAllSubjects = async (classId) => {

    const snapshot = await getDocs(
      collection(db, "classes", classId, "subjects")
    );

    const subjects = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    setAllSubjects(subjects);

  };

  const listenToSchedule = (classId) => {

    const ref = doc(
      db,
      "classes",
      classId,
      "dailySchedule",
      today
    );

    onSnapshot(ref, (docSnap) => {

      if (docSnap.exists()) {

        const data = docSnap.data();

        if (data.published) {
          setTodaySubjects(data.subjects || []);
        }

      }

    });

  };

  const listenToTodayAttendance = (classId, studentId) => {

    const ref = doc(
      db,
      "classes",
      classId,
      "attendance",
      today,
      "students",
      studentId
    );

    onSnapshot(ref, (docSnap) => {

      if (docSnap.exists()) {
        setMarkedSubjects(docSnap.data().subjects || []);
      }

    });

  };

  const handleMarkAttendance = (subjectId, e) => {

    e.stopPropagation();

    if (markedSubjects.includes(subjectId)) return;

    setMarking(prev => ({ ...prev, [subjectId]: true }));

    setMarkedSubjects(prev => [...prev, subjectId]);

    setMarking(prev => ({ ...prev, [subjectId]: false }));

  };

  const handleUndoAttendance = (subjectId, e) => {

    e.stopPropagation();

    setUndoing(prev => ({ ...prev, [subjectId]: true }));

    const updated = markedSubjects.filter(id => id !== subjectId);

    setMarkedSubjects(updated);

    setUndoing(prev => ({ ...prev, [subjectId]: false }));

  };

  const updateAttendance = async () => {

    setUpdating(true);

    const user = auth.currentUser;

    const ref = doc(
      db,
      "classes",
      userData.classId,
      "attendance",
      today,
      "students",
      user.uid
    );

    await setDoc(
      ref,
      { subjects: markedSubjects },
      { merge: true }
    );

    await fetchAttendanceHistory(userData.classId, user.uid);

    setUpdating(false);

  };

  const fetchAttendanceHistory = async (classId, studentId) => {

    const scheduleSnapshot = await getDocs(
      collection(db, "classes", classId, "dailySchedule")
    );

    let totalScheduled = 0;
    let totalPresent = 0;

    let stats = {};

    const subjectsSnapshot = await getDocs(
      collection(db, "classes", classId, "subjects")
    );

    subjectsSnapshot.docs.forEach(doc => {

      stats[doc.id] = {
        name: doc.data().subjectName,
        total: 0,
        present: 0
      };

    });

    for (const scheduleDoc of scheduleSnapshot.docs) {

      const date = scheduleDoc.id;
      const scheduled = scheduleDoc.data().subjects || [];

      totalScheduled += scheduled.length;

      scheduled.forEach(id => {
        if (stats[id]) stats[id].total++;
      });

      const attendanceRef = doc(
        db,
        "classes",
        classId,
        "attendance",
        date,
        "students",
        studentId
      );

      const attendanceDoc = await getDoc(attendanceRef);

      if (attendanceDoc.exists()) {

        const present = attendanceDoc.data().subjects || [];

        totalPresent += present.length;

        present.forEach(id => {
          if (stats[id]) stats[id].present++;
        });

      }

    }

    const percent =
      totalScheduled === 0
        ? 0
        : ((totalPresent / totalScheduled) * 100).toFixed(2);

    setAttendancePercent(percent);

    const formatted = Object.keys(stats).map(id => {

      const total = stats[id].total;
      const present = stats[id].present;

      const percent =
        total === 0
          ? 0
          : ((present / total) * 100).toFixed(1);

      return {
        id,
        name: stats[id].name,
        total,
        present,
        percent
      };

    });

    setSubjectStats(formatted);

  };

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
          <p className="text-gray-400 text-lg font-medium animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const subjectColors = [
    { bg: 'bg-[#00D9FF]', text: 'text-[#00D9FF]', border: 'border-[#00D9FF]', glow: 'shadow-[#00D9FF]/20' },
    { bg: 'bg-[#7C3AED]', text: 'text-[#7C3AED]', border: 'border-[#7C3AED]', glow: 'shadow-[#7C3AED]/20' },
    { bg: 'bg-[#F59E0B]', text: 'text-[#F59E0B]', border: 'border-[#F59E0B]', glow: 'shadow-[#F59E0B]/20' },
    { bg: 'bg-[#10B981]', text: 'text-[#10B981]', border: 'border-[#10B981]', glow: 'shadow-[#10B981]/20' },
    { bg: 'bg-[#EC4899]', text: 'text-[#EC4899]', border: 'border-[#EC4899]', glow: 'shadow-[#EC4899]/20' },
  ];

  const getSubjectColor = (index) => subjectColors[index % subjectColors.length];

  return (

    <div className="min-h-screen bg-[#0A0E27] text-gray-200 p-3 sm:p-5 lg:p-8 relative overflow-hidden">

      {/* Animated Background */}
      <div className="absolute top-[-100px] right-[-100px] w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] bg-[#00D9FF]/5 rounded-full blur-[100px] animate-float"></div>
      <div className="absolute bottom-[-150px] left-[-150px] w-[350px] h-[350px] sm:w-[500px] sm:h-[500px] bg-[#7C3AED]/5 rounded-full blur-[120px] animate-float-delayed"></div>
      <div className="absolute top-1/2 left-1/2 w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] bg-[#10B981]/5 rounded-full blur-[100px] animate-pulse-slow"></div>

      <div className="max-w-7xl mx-auto relative z-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 sm:mb-12">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#00D9FF] to-[#7C3AED] rounded-xl flex items-center justify-center shadow-lg shadow-[#00D9FF]/30 hover:scale-110 hover:rotate-12 transition-all duration-300">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-white">Student Dashboard</h1>
                <p className="text-sm sm:text-base text-transparent bg-clip-text bg-gradient-to-r from-[#00D9FF] to-[#7C3AED] font-medium">
                  {getGreeting()}, {userData?.name}!
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#00D9FF] to-[#7C3AED] rounded-full flex items-center justify-center text-white font-semibold text-lg border-2 border-[#1A1F3A] shadow-lg shadow-[#00D9FF]/30 hover:scale-110 transition-all duration-300">
              {userData?.name?.charAt(0)}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          
          {/* Overall Attendance Card */}
          <div className="bg-gradient-to-br from-[#0F1629] to-[#0A0E27] border border-[#1A1F3A] rounded-2xl p-6 relative overflow-hidden hover:border-[#00D9FF]/50 transition-all duration-300 hover:scale-105 group col-span-1 sm:col-span-2 lg:col-span-2">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00D9FF]/5 rounded-full blur-2xl group-hover:bg-[#00D9FF]/10 transition-all duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-[#00D9FF]/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Award className="w-6 h-6 text-[#00D9FF]" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Overall Attendance</p>
                  <p className="text-4xl font-bold text-[#00D9FF] group-hover:scale-110 transition-transform inline-block">{attendancePercent}%</p>
                </div>
              </div>
              <div className="w-full bg-[#1A1F3A] h-3 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#00D9FF] to-[#0EA5E9] rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${attendancePercent}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Total Subjects */}
          <div className="bg-gradient-to-br from-[#0F1629] to-[#0A0E27] border border-[#1A1F3A] rounded-2xl p-6 relative overflow-hidden hover:border-[#7C3AED]/50 transition-all duration-300 hover:scale-105 group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#7C3AED]/5 rounded-full blur-2xl group-hover:bg-[#7C3AED]/10 transition-all duration-300"></div>
            <div className="relative z-10">
              <div className="w-10 h-10 bg-[#7C3AED]/10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Book className="w-5 h-5 text-[#7C3AED]" />
              </div>
              <p className="text-sm text-gray-500 mb-1">Total Subjects</p>
              <p className="text-3xl font-bold text-[#7C3AED]">{allSubjects.length}</p>
            </div>
          </div>

          {/* Today's Classes */}
          <div className="bg-gradient-to-br from-[#0F1629] to-[#0A0E27] border border-[#1A1F3A] rounded-2xl p-6 relative overflow-hidden hover:border-[#10B981]/50 transition-all duration-300 hover:scale-105 group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#10B981]/5 rounded-full blur-2xl group-hover:bg-[#10B981]/10 transition-all duration-300"></div>
            <div className="relative z-10">
              <div className="w-10 h-10 bg-[#10B981]/10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5 text-[#10B981]" />
              </div>
              <p className="text-sm text-gray-500 mb-1">Today's Classes</p>
              <p className="text-3xl font-bold text-[#10B981]">{todaySubjects.length}</p>
            </div>
          </div>

        </div>

        {/* Calendar Button */}
        <button
          onClick={() => router.push("/student/calender")}
          className="mb-8 bg-gradient-to-r from-[#7C3AED] to-[#9D7FED] text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-[#7C3AED]/30 hover:shadow-[#7C3AED]/50 hover:scale-105 transition-all duration-300 flex items-center gap-2"
        >
          <Calendar className="w-5 h-5" />
          View Attendance Calendar
        </button>

        {/* Subjects Overview */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-6 h-6 text-[#00D9FF]" />
            <h2 className="text-xl sm:text-2xl font-semibold text-white">Subjects Overview</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {subjectStats.map((subject, index) => {
              const colors = getSubjectColor(index);
              
              return (
                <div
                  key={subject.id}
                  onClick={() => router.push(`/student/subject/${subject.id}`)}
                  className="bg-gradient-to-br from-[#0F1629] to-[#0A0E27] border border-[#1A1F3A] rounded-xl p-5 cursor-pointer hover:border-[#00D9FF]/30 hover:scale-[1.02] transition-all duration-300 group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${colors.bg} shadow-lg ${colors.glow} animate-pulse-slow`}></div>
                      <span className="text-white font-medium text-lg">{subject.name}</span>
                    </div>
                    <span className={`${colors.text} font-bold text-2xl`}>{subject.percent}%</span>
                  </div>

                  <p className="text-gray-500 text-sm mb-3">
                    <span className={colors.text}>{subject.present}</span> / {subject.total} Sessions Attended
                  </p>

                  <div className="w-full bg-[#1A1F3A] h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors.bg} rounded-full transition-all duration-1000 ease-out`}
                      style={{ width: `${subject.percent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Today's Classes */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle className="w-6 h-6 text-[#10B981]" />
            <h2 className="text-xl sm:text-2xl font-semibold text-white">Today's Classes</h2>
            <span className="text-sm text-gray-500">({new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})</span>
          </div>

          {todaySubjects.length === 0 ? (
            <div className="bg-gradient-to-br from-[#0F1629] to-[#0A0E27] border border-[#1A1F3A] rounded-xl p-12 text-center">
              <Clock className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No classes scheduled today</p>
              <p className="text-gray-600 text-sm mt-2">Enjoy your day off!</p>
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {todaySubjects.map((subjectId, index) => {
                const subject = allSubjects.find(s => s.id === subjectId);
                const marked = markedSubjects.includes(subjectId);
                const colors = getSubjectColor(index);
                const isMarking = marking[subjectId];
                const isUndoing = undoing[subjectId];

                return (
                  <div
                    key={subjectId}
                    onClick={() => router.push(`/student/subject/${subjectId}`)}
                    className={`bg-gradient-to-br from-[#0F1629] to-[#0A0E27] border ${colors.border} border-l-4 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-[#131829] transition-all duration-300 cursor-pointer group`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-3 h-3 rounded-full ${colors.bg} ${colors.glow} shadow-lg animate-pulse-slow`}></div>
                      <span className="text-white font-medium text-base sm:text-lg">{subject?.subjectName}</span>
                    </div>

                    {marked ? (
                      <button
                        onClick={(e) => handleUndoAttendance(subjectId, e)}
                        disabled={isUndoing}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                          isUndoing
                            ? "bg-red-500/20 text-red-400/50 cursor-not-allowed"
                            : "bg-red-500/10 text-red-400 border border-red-400/20 hover:bg-red-500/20 hover:scale-105"
                        }`}
                      >
                        {isUndoing ? (
                          <>
                            <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                            Undoing...
                          </>
                        ) : (
                          'Undo'
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={(e) => handleMarkAttendance(subjectId, e)}
                        disabled={isMarking}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                          isMarking
                            ? "bg-[#00D9FF]/20 text-[#00D9FF]/50 cursor-not-allowed"
                            : "bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/20 hover:bg-[#00D9FF]/20 hover:scale-105"
                        }`}
                      >
                        {isMarking ? (
                          <>
                            <div className="w-4 h-4 border-2 border-[#00D9FF] border-t-transparent rounded-full animate-spin"></div>
                            Marking...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Mark Present
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {todaySubjects.length > 0 && (
            <button
              onClick={updateAttendance}
              disabled={updating}
              className={`w-full sm:w-auto px-8 py-4 rounded-xl font-medium shadow-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                updating
                  ? "bg-gradient-to-r from-[#10B981]/50 to-[#059669]/50 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#10B981] to-[#059669] text-white shadow-[#10B981]/30 hover:shadow-[#10B981]/50 hover:scale-105"
              }`}
            >
              {updating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Updating Attendance...
                </>
              ) : (
                <>
                  <TrendingUp className="w-5 h-5" />
                  Update Attendance
                </>
              )}
            </button>
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
      `}</style>

    </div>

  );

}