"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  query,
  where
} from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function CRDashboard() {

  const router = useRouter();

  const [view, setView] = useState("cr");

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  const [className, setClassName] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState("");

  const [todaySubjects, setTodaySubjects] = useState([]);
  const [published, setPublished] = useState(false);

  const [actionLoading, setActionLoading] = useState({});
  const [showUserMenu, setShowUserMenu] = useState(false);

  const [weeklyData, setWeeklyData] = useState([]);

  // Monitor analytics state
  const [totalStudents, setTotalStudents] = useState(0);
  const [todayAttendance, setTodayAttendance] = useState(0);
  const [weeklyAttendance, setWeeklyAttendance] = useState([]);
  const [recentStudents, setRecentStudents] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const setLoadingState = (key, value) => {
    setActionLoading((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/cr/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  useEffect(() => {

    const init = async () => {

      const user = auth.currentUser;

      if (!user) {
        router.push("/cr/login");
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists() || userDoc.data().role !== "cr") {
        router.push("/cr/login");
        return;
      }

      setUserData(userDoc.data());

      if (userDoc.data().classId) {
        fetchSubjects(user.uid);
        fetchTodaySchedule(user.uid);
        fetchJoinCode(user.uid);
        fetchWeeklyData(user.uid);
        fetchAnalytics(user.uid);
      }

      setLoading(false);

    };

    init();

  }, []);

  // Refresh analytics when switching to monitor tab
  useEffect(() => {
    if (view === "monitor" && userData?.classId) {
      fetchAnalytics(userData.classId);
    }
  }, [view, userData]);

  const generateJoinCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const fetchJoinCode = async (classId) => {

    const classDoc = await getDoc(doc(db, "classes", classId));

    if (classDoc.exists()) {
      setJoinCode(classDoc.data().joinCode);
    }

  };

  const fetchSubjects = async (classId) => {

    const snapshot = await getDocs(
      collection(db, "classes", classId, "subjects")
    );

    setSubjects(
      snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }))
    );

  };

  const fetchTodaySchedule = async (classId) => {

    const ref = doc(db, "classes", classId, "dailySchedule", today);

    const data = await getDoc(ref);

    if (data.exists()) {
      setTodaySubjects(data.data().subjects || []);
      setPublished(data.data().published || false);
    }

  };

  const fetchWeeklyData = async (classId) => {

    try {
      const scheduleRef = collection(db, "classes", classId, "dailySchedule");
      const snapshot = await getDocs(scheduleRef);

      const dates = [];
      const currentDate = new Date();

      for (let i = 4; i >= 0; i--) {
        const date = new Date(currentDate);
        date.setDate(date.getDate() - i);
        dates.push({
          dateStr: date.toISOString().split("T")[0],
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          date: date.getDate()
        });
      }

      const weekData = dates.map(dateInfo => {
        const scheduleDoc = snapshot.docs.find(doc => doc.id === dateInfo.dateStr);
        const classCount = scheduleDoc?.data()?.subjects?.length || 0;

        return {
          day: dateInfo.day,
          date: dateInfo.date,
          classes: classCount
        };
      });

      setWeeklyData(weekData);

    } catch (err) {
      console.error("Error fetching weekly data:", err);
      const fallbackData = [];
      const currentDate = new Date();

      for (let i = 4; i >= 0; i--) {
        const date = new Date(currentDate);
        date.setDate(date.getDate() - i);
        fallbackData.push({
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          date: date.getDate(),
          classes: 0
        });
      }

      setWeeklyData(fallbackData);
    }

  };

  const fetchAnalytics = async (classId) => {
    try {
      setAnalyticsLoading(true);

      // Fetch all base data in parallel
      const [usersSnapshot, todayAttendanceSnapshot, scheduleSnapshot] = await Promise.all([
        // Fetch total students
        getDocs(query(collection(db, "users"), where("classId", "==", classId), where("role", "==", "student"))),
        // Fetch today's attendance
        getDocs(collection(db, "classes", classId, "attendance", new Date().toISOString().split("T")[0], "students")),
        // Fetch all schedule data
        getDocs(collection(db, "classes", classId, "dailySchedule"))
      ]);

      const totalStudentsCount = usersSnapshot.docs.length;
      setTotalStudents(totalStudentsCount);

      // Fetch recent students (from already fetched users data)
      const recentStudentsList = usersSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          joinedAt: doc.data().createdAt?.toDate?.() || new Date()
        }))
        .sort((a, b) => b.joinedAt - a.joinedAt)
        .slice(0, 5);
      setRecentStudents(recentStudentsList);

      // Today's attendance (already fetched)
      const todayAttendanceCount = todayAttendanceSnapshot.docs.filter(doc => {
        const subjects = doc.data().subjects || [];
        return subjects.length > 0;
      }).length;
      setTodayAttendance(todayAttendanceCount);

      // Fetch weekly attendance data (last 7 days) - batch fetch in parallel
      const dates = [];
      const currentDate = new Date();

      for (let i = 6; i >= 0; i--) {
        const date = new Date(currentDate);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        dates.push(dateStr);
      }

      // Build schedule map for quick lookup
      const scheduleMap = {};
      scheduleSnapshot.docs.forEach(doc => {
        scheduleMap[doc.id] = doc.data()?.subjects || [];
      });

      // Batch fetch all attendance collections for the week in parallel
      const attendancePromises = dates.map(dateStr =>
        getDocs(collection(db, "classes", classId, "attendance", dateStr, "students"))
      );

      const weeklyAttendanceSnapshots = await Promise.all(attendancePromises);

      const weeklyAttData = dates.map((dateStr, index) => {
        const scheduledCount = scheduleMap[dateStr]?.length || 0;
        const attendanceSnapshot = weeklyAttendanceSnapshots[index];
        const attendedCount = attendanceSnapshot.docs.filter(doc => {
          const subjects = doc.data().subjects || [];
          return subjects.length > 0;
        }).length;

        const dateObj = new Date(dateStr);
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        const dayDate = dateObj.getDate();

        return {
          day: dayName,
          date: dayDate,
          scheduled: scheduledCount,
          attended: attendedCount,
          percentage: scheduledCount > 0 ? ((attendedCount / totalStudentsCount) * 100).toFixed(0) : 0
        };
      });

      setWeeklyAttendance(weeklyAttData);

    } catch (err) {
      console.error("Error fetching analytics:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleCreateClass = async () => {

    if (!className.trim()) return;

    try {

      setLoadingState("createClass", true);

      const user = auth.currentUser;

      const classId = user.uid;
      const code = generateJoinCode();

      await setDoc(doc(db, "classes", classId), {
        className: className.trim(),
        crId: user.uid,
        joinCode: code,
        createdAt: new Date()
      });

      await updateDoc(doc(db, "users", user.uid), {
        classId
      });

      setJoinCode(code);

      setUserData((prev) => ({
        ...prev,
        classId
      }));

    } catch (err) {
      console.error(err);
    }

    setLoadingState("createClass", false);

  };

  const handleAddSubject = async () => {

    if (!newSubject.trim()) return;

    try {

      setLoadingState("addSubject", true);

      const user = auth.currentUser;

      await addDoc(
        collection(db, "classes", user.uid, "subjects"),
        {
          subjectName: newSubject.trim(),
          createdAt: new Date()
        }
      );

      setNewSubject("");
      await fetchSubjects(user.uid);

    } catch (err) {
      console.error(err);
    }

    setLoadingState("addSubject", false);

  };

  const handleDeleteSubject = async (subjectId) => {

    try {

      setLoadingState(`delete-${subjectId}`, true);

      const user = auth.currentUser;

      await deleteDoc(
        doc(db, "classes", user.uid, "subjects", subjectId)
      );

      await fetchSubjects(user.uid);

    } catch (err) {
      console.error(err);
    }

    setLoadingState(`delete-${subjectId}`, false);

  };

  const handleAddToToday = async (subjectId) => {

    if (todaySubjects.includes(subjectId)) return;

    try {

      setLoadingState(`addToday-${subjectId}`, true);

      const user = auth.currentUser;

      const updated = [...todaySubjects, subjectId];

      const ref = doc(
        db,
        "classes",
        user.uid,
        "dailySchedule",
        today
      );

      await setDoc(
        ref,
        {
          subjects: updated,
          published: false
        },
        { merge: true }
      );

      setTodaySubjects(updated);
      setPublished(false);
      
      await fetchWeeklyData(user.uid);

    } catch (err) {
      console.error(err);
    }

    setLoadingState(`addToday-${subjectId}`, false);

  };

  const handleRemoveFromToday = async (subjectId) => {

    try {

      setLoadingState(`removeToday-${subjectId}`, true);

      const user = auth.currentUser;

      const updated = todaySubjects.filter((id) => id !== subjectId);

      const ref = doc(
        db,
        "classes",
        user.uid,
        "dailySchedule",
        today
      );

      await setDoc(ref, { subjects: updated, published: false });

      setTodaySubjects(updated);
      setPublished(false);
      
      await fetchWeeklyData(user.uid);

    } catch (err) {
      console.error(err);
    }

    setLoadingState(`removeToday-${subjectId}`, false);

  };

  const publishSchedule = async () => {

    if (todaySubjects.length === 0) {
      alert("Add subjects first");
      return;
    }

    try {

      setLoadingState("publish", true);

      const user = auth.currentUser;

      const ref = doc(
        db,
        "classes",
        user.uid,
        "dailySchedule",
        today
      );

      await setDoc(
        ref,
        {
          subjects: todaySubjects,
          published: true
        },
        { merge: true }
      );

      setPublished(true);

    } catch (err) {
      console.error(err);
    }

    setLoadingState("publish", false);

  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00D9FF]/10 rounded-full blur-[100px] animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#7C3AED]/10 rounded-full blur-[100px] animate-float-delayed"></div>
        </div>

        <div className="text-center relative z-10">
          {/* Modern Multi-Layer Loader */}
          <div className="relative w-24 h-24 mx-auto mb-8">
            {/* Outer spinning ring */}
            <div className="absolute inset-0 border-4 border-transparent border-t-[#00D9FF] border-r-[#7C3AED] rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
            {/* Middle spinning ring */}
            <div className="absolute inset-2 border-4 border-transparent border-b-[#10B981] border-l-[#F59E0B] rounded-full animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}></div>
            {/* Inner pulse circle */}
            <div className="absolute inset-4 bg-gradient-to-br from-[#00D9FF] to-[#7C3AED] rounded-full animate-pulse opacity-80"></div>
            {/* Center dot */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-full shadow-lg shadow-[#00D9FF]/50 animate-bounce-slow"></div>
            </div>
          </div>

          {/* Loading text with gradient */}
          <div className="space-y-2">
            <p className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D9FF] via-[#7C3AED] to-[#10B981] text-xl font-bold animate-gradient" style={{ backgroundSize: '200% 200%' }}>
              Loading Dashboard
            </p>
            <p className="text-gray-500 text-sm">Please wait while we fetch your data</p>
          </div>

          {/* Animated dots */}
          <div className="flex justify-center gap-2 mt-6">
            <div className="w-2 h-2 bg-[#00D9FF] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-[#7C3AED] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-[#10B981] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  const subjectColors = [
    { bg: 'bg-[#00D9FF]', border: 'border-[#00D9FF]', shadow: 'shadow-[#00D9FF]/20', glow: 'hover:shadow-[#00D9FF]/40' },
    { bg: 'bg-[#7C3AED]', border: 'border-[#7C3AED]', shadow: 'shadow-[#7C3AED]/20', glow: 'hover:shadow-[#7C3AED]/40' },
    { bg: 'bg-[#F59E0B]', border: 'border-[#F59E0B]', shadow: 'shadow-[#F59E0B]/20', glow: 'hover:shadow-[#F59E0B]/40' },
    { bg: 'bg-[#10B981]', border: 'border-[#10B981]', shadow: 'shadow-[#10B981]/20', glow: 'hover:shadow-[#10B981]/40' },
    { bg: 'bg-[#EC4899]', border: 'border-[#EC4899]', shadow: 'shadow-[#EC4899]/20', glow: 'hover:shadow-[#EC4899]/40' },
  ];
  const getSubjectColor = (index) => subjectColors[index % subjectColors.length];

  const maxClasses = Math.max(...weeklyData.map(d => d.classes), 1);

  return (

    <div className="min-h-screen bg-[#0A0E27] text-gray-200 p-3 sm:p-5 lg:p-8 relative overflow-hidden">

      {/* Enhanced Animated Background */}
      <div className="absolute top-[-100px] right-[-100px] w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] bg-[#00D9FF]/5 rounded-full blur-[100px] animate-float"></div>
      <div className="absolute bottom-[-150px] left-[-150px] w-[350px] h-[350px] sm:w-[500px] sm:h-[500px] bg-[#7C3AED]/5 rounded-full blur-[120px] animate-float-delayed"></div>
      <div className="absolute top-1/2 left-1/2 w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] bg-[#10B981]/5 rounded-full blur-[100px] animate-pulse-slow"></div>

      <div className="max-w-7xl mx-auto relative z-10">

        {/* Header with Greeting */}
        <div className="flex justify-between items-start gap-3 mb-8 sm:mb-12">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-gradient-to-br from-[#00D9FF] to-[#7C3AED] rounded-lg flex items-center justify-center shadow-lg shadow-[#00D9FF]/30 flex-shrink-0 hover:scale-110 hover:rotate-12 transition-transform duration-300">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white truncate">ATS Dashboard</h1>
                <p className="text-sm sm:text-base text-transparent bg-clip-text bg-gradient-to-r from-[#00D9FF] to-[#7C3AED] font-medium animate-gradient">
                  {getGreeting()}, {userData?.name || 'User'}!
                </p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 pl-0 sm:pl-12 hidden sm:block">Manage class attendance seamlessly</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <div className="text-right hidden md:block">
              <p className="text-xs text-gray-500">Class Representative</p>
              <p className="text-sm text-gray-300 font-medium">{userData?.name || 'CR User'}</p>
            </div>
            
            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#00D9FF] to-[#7C3AED] rounded-full flex items-center justify-center text-white font-semibold text-base sm:text-lg border-2 border-[#1A1F3A] shadow-lg shadow-[#00D9FF]/30 hover:scale-110 hover:shadow-[#00D9FF]/60 transition-all duration-300 cursor-pointer"
              >
                {userData?.name?.charAt(0) || 'CR'}
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-gradient-to-br from-[#0F1629] to-[#0A0E27] border border-[#1A1F3A] rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50 animate-fadeIn">
                  <div className="p-3 border-b border-[#1A1F3A]">
                    <p className="text-white font-medium truncate">{userData?.name}</p>
                    <p className="text-gray-500 text-xs truncate">{userData?.email}</p>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-500/10 transition-colors duration-200 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards with Hover Effects */}
        {userData?.classId && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
            
            <div className="bg-[#0F1629] border border-[#1A1F3A] rounded-xl sm:rounded-2xl p-4 sm:p-5 relative overflow-hidden hover:border-[#00D9FF]/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#00D9FF]/20 group cursor-pointer">
              <div className="absolute top-0 right-0 w-20 h-20 bg-[#00D9FF]/5 rounded-full blur-2xl group-hover:bg-[#00D9FF]/10 transition-all duration-300"></div>
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 relative z-10">
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#00D9FF]/10 rounded-lg flex items-center justify-center group-hover:bg-[#00D9FF]/20 group-hover:scale-110 transition-all duration-300">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#00D9FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">Total Subjects</p>
              </div>
              <p className="text-2xl sm:text-3xl font-semibold text-[#00D9FF] relative z-10 group-hover:scale-110 transition-transform duration-300">{subjects.length}</p>
            </div>

            <div className="bg-[#0F1629] border border-[#1A1F3A] rounded-xl sm:rounded-2xl p-4 sm:p-5 relative overflow-hidden hover:border-[#7C3AED]/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#7C3AED]/20 group cursor-pointer">
              <div className="absolute top-0 right-0 w-20 h-20 bg-[#7C3AED]/5 rounded-full blur-2xl group-hover:bg-[#7C3AED]/10 transition-all duration-300"></div>
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 relative z-10">
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#7C3AED]/10 rounded-lg flex items-center justify-center group-hover:bg-[#7C3AED]/20 group-hover:scale-110 transition-all duration-300">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#7C3AED]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">Today's Classes</p>
              </div>
              <p className="text-2xl sm:text-3xl font-semibold text-[#7C3AED] relative z-10 group-hover:scale-110 transition-transform duration-300">{todaySubjects.length}</p>
            </div>

            <div className="bg-[#0F1629] border border-[#1A1F3A] rounded-xl sm:rounded-2xl p-4 sm:p-5 relative overflow-hidden hover:border-[#10B981]/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#10B981]/20 group cursor-pointer col-span-2 lg:col-span-1">
              <div className="absolute top-0 right-0 w-20 h-20 bg-[#10B981]/5 rounded-full blur-2xl group-hover:bg-[#10B981]/10 transition-all duration-300"></div>
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 relative z-10">
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#10B981]/10 rounded-lg flex items-center justify-center group-hover:bg-[#10B981]/20 group-hover:scale-110 transition-all duration-300">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#10B981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">Schedule Status</p>
              </div>
              <p className="text-2xl sm:text-3xl font-semibold text-[#10B981] relative z-10 group-hover:scale-110 transition-transform duration-300">
                {published ? "Published" : "Draft"}
              </p>
            </div>

          </div>
        )}

        {/* Navigation Tabs with Hover Effects */}
        <div className="flex gap-2 sm:gap-3 mb-6 sm:mb-8 border-b border-[#1A1F3A] overflow-x-auto">

          <button
            onClick={() => setView("cr")}
            className={`px-4 sm:px-7 py-2.5 sm:py-3 rounded-t-lg font-medium text-xs sm:text-sm transition-all duration-300 whitespace-nowrap ${
              view === "cr"
                ? "bg-gradient-to-br from-[#00D9FF] to-[#0EA5E9] text-white shadow-lg shadow-[#00D9FF]/30"
                : "bg-transparent text-gray-500 hover:text-gray-300 hover:bg-[#1A1F3A]/50"
            }`}
          >
            CR Panel
          </button>

          <button
            onClick={() => setView("monitor")}
            className={`px-4 sm:px-7 py-2.5 sm:py-3 rounded-t-lg font-medium text-xs sm:text-sm transition-all duration-300 whitespace-nowrap ${
              view === "monitor"
                ? "bg-gradient-to-br from-[#00D9FF] to-[#0EA5E9] text-white shadow-lg shadow-[#00D9FF]/30"
                : "bg-transparent text-gray-500 hover:text-gray-300 hover:bg-[#1A1F3A]/50"
            }`}
          >
            Monitor
          </button>

          <button
            onClick={() => setView("student")}
            className={`px-4 sm:px-7 py-2.5 sm:py-3 rounded-t-lg font-medium text-xs sm:text-sm transition-all duration-300 whitespace-nowrap ${
              view === "student"
                ? "bg-gradient-to-br from-[#00D9FF] to-[#0EA5E9] text-white shadow-lg shadow-[#00D9FF]/30"
                : "bg-transparent text-gray-500 hover:text-gray-300 hover:bg-[#1A1F3A]/50"
            }`}
          >
            My Attendance
          </button>

        </div>

        {view === "student" && (

          <iframe
            src="/student/dashboard"
            className="w-full h-[600px] sm:h-[800px] border border-[#1A1F3A] rounded-xl hover:border-[#00D9FF]/30 transition-all duration-300"
          />

        )}

        {view === "monitor" && (
          <>
            {/* Monitor Dashboard */}
            <div className="space-y-6 sm:space-y-8">

              {/* Page Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-[#00D9FF] to-[#7C3AED] rounded-xl flex items-center justify-center shadow-lg shadow-[#00D9FF]/30">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-white">Analytics Monitor</h2>
                  <p className="text-xs sm:text-sm text-gray-500">Track class performance and engagement</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

                {/* Total Students Card */}
                <div className="bg-[#0F1629] border border-[#1A1F3A] rounded-xl sm:rounded-2xl p-4 sm:p-5 relative overflow-hidden hover:border-[#00D9FF]/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#00D9FF]/20 group">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-[#00D9FF]/5 rounded-full blur-2xl group-hover:bg-[#00D9FF]/10 transition-all duration-300"></div>
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 relative z-10">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#00D9FF]/10 rounded-lg flex items-center justify-center group-hover:bg-[#00D9FF]/20 group-hover:scale-110 transition-all duration-300">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#00D9FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">Total Students</p>
                  </div>
                  {analyticsLoading ? (
                    <div className="h-8 w-16 bg-[#1A1F3A] rounded animate-pulse"></div>
                  ) : (
                    <p className="text-2xl sm:text-3xl font-semibold text-[#00D9FF] relative z-10 group-hover:scale-110 transition-transform duration-300">{totalStudents}</p>
                  )}
                </div>

                {/* Today's Attendance Card */}
                <div className="bg-[#0F1629] border border-[#1A1F3A] rounded-xl sm:rounded-2xl p-4 sm:p-5 relative overflow-hidden hover:border-[#10B981]/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#10B981]/20 group">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-[#10B981]/5 rounded-full blur-2xl group-hover:bg-[#10B981]/10 transition-all duration-300"></div>
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 relative z-10">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#10B981]/10 rounded-lg flex items-center justify-center group-hover:bg-[#10B981]/20 group-hover:scale-110 transition-all duration-300">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#10B981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">Today's Attendance</p>
                  </div>
                  {analyticsLoading ? (
                    <div className="h-8 w-16 bg-[#1A1F3A] rounded animate-pulse"></div>
                  ) : (
                    <p className="text-2xl sm:text-3xl font-semibold text-[#10B981] relative z-10 group-hover:scale-110 transition-transform duration-300">
                      {todayAttendance}
                      <span className="text-xs sm:text-sm text-gray-500 font-normal ml-1">/ {totalStudents}</span>
                    </p>
                  )}
                </div>

                {/* Weekly Avg Card */}
                <div className="bg-[#0F1629] border border-[#1A1F3A] rounded-xl sm:rounded-2xl p-4 sm:p-5 relative overflow-hidden hover:border-[#F59E0B]/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#F59E0B]/20 group col-span-2 lg:col-span-1">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-[#F59E0B]/5 rounded-full blur-2xl group-hover:bg-[#F59E0B]/10 transition-all duration-300"></div>
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 relative z-10">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#F59E0B]/10 rounded-lg flex items-center justify-center group-hover:bg-[#F59E0B]/20 group-hover:scale-110 transition-all duration-300">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#F59E0B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                      </svg>
                    </div>
                    <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">Attendance Rate</p>
                  </div>
                  {analyticsLoading ? (
                    <div className="h-8 w-20 bg-[#1A1F3A] rounded animate-pulse"></div>
                  ) : (
                    <p className="text-2xl sm:text-3xl font-semibold text-[#F59E0B] relative z-10 group-hover:scale-110 transition-transform duration-300">
                      {totalStudents > 0 ? Math.round((todayAttendance / totalStudents) * 100) : 0}%
                    </p>
                  )}
                </div>

              </div>

              {/* Weekly Attendance Chart */}
              <div className="bg-[#0F1629] border border-[#1A1F3A] rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-[#00D9FF]/30 hover:shadow-lg hover:shadow-[#00D9FF]/10 transition-all duration-300">
                <div className="flex justify-between items-start mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-semibold text-white">Weekly Attendance Overview</h3>
                  <span className="text-xs sm:text-sm text-gray-500 hidden sm:inline">Last 7 days</span>
                </div>

                {analyticsLoading ? (
                  <div className="h-64 bg-[#1A1F3A] rounded-xl animate-pulse"></div>
                ) : (
                  <div className="h-64 sm:h-72">
                    <div className="flex items-end justify-between gap-2 sm:gap-4 h-full">
                      {weeklyAttendance.map((data, idx) => {
                        const maxVal = Math.max(...weeklyAttendance.map(d => Math.max(d.scheduled, d.attended)), 1);
                        const scheduledHeight = (data.scheduled / maxVal) * 100;
                        const attendedHeight = (data.attended / maxVal) * 100;

                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-2 sm:gap-3 group">
                            <div className="w-full flex flex-col gap-1 relative" style={{ height: '200px' }}>
                              {/* Scheduled (background) */}
                              <div className="absolute bottom-0 w-full bg-[#1A1F3A] rounded-t-lg transition-all duration-300 group-hover:bg-[#252B44]" style={{ height: `${scheduledHeight}%`, minHeight: scheduledHeight > 0 ? '20px' : '4px' }}>
                                {data.scheduled > 0 && (
                                  <div className="absolute inset-0 bg-gradient-to-t from-[#00D9FF]/20 to-transparent rounded-t-lg"></div>
                                )}
                              </div>
                              {/* Attended (foreground) */}
                              <div className="absolute bottom-0 w-full bg-gradient-to-t from-[#00D9FF] to-[#7C3AED] rounded-t-lg transition-all duration-300 group-hover:from-[#00D9FF] group-hover:to-[#7C3AED]/80 opacity-80" style={{ height: `${attendedHeight}%`, minHeight: attendedHeight > 0 ? '20px' : '4px' }}>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-white text-xs font-medium drop-shadow-md">{data.attended}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-center">
                              <span className="text-xs sm:text-sm text-gray-300 font-medium block group-hover:text-[#00D9FF] transition-colors">{data.day}</span>
                              <span className="text-[10px] sm:text-xs text-gray-500">{data.date}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div className="flex justify-center gap-4 sm:gap-6 mt-6 pt-4 border-t border-[#1A1F3A]">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#00D9FF] to-[#7C3AED]"></div>
                        <span className="text-xs sm:text-sm text-gray-400">Attended</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#1A1F3A]"></div>
                        <span className="text-xs sm:text-sm text-gray-400">Scheduled</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Students & Quick Actions Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

                {/* Recent Students */}
                <div className="lg:col-span-2 bg-[#0F1629] border border-[#1A1F3A] rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-[#00D9FF]/30 hover:shadow-lg hover:shadow-[#00D9FF]/10 transition-all duration-300">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base sm:text-lg font-semibold text-white">Recent Students</h3>
                    <span className="text-xs sm:text-sm text-gray-500">Latest 5</span>
                  </div>

                  {analyticsLoading ? (
                    <div className="space-y-3">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-[#1A1F3A] rounded-lg animate-pulse">
                          <div className="w-10 h-10 rounded-full bg-[#0A0E27]"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-[#0A0E27] rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-[#0A0E27] rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : recentStudents.length > 0 ? (
                    <div className="space-y-2 sm:space-y-3">
                      {recentStudents.map((student, idx) => (
                        <div key={student.id || idx} className="flex items-center gap-3 p-2 sm:p-3 bg-[#1A1F3A] rounded-lg hover:bg-[#252B44] transition-all duration-300">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#00D9FF] to-[#7C3AED] rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                            {student.name?.charAt(0) || 'S'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm sm:text-base text-gray-200 font-medium truncate">{student.name || 'Anonymous'}</p>
                            <p className="text-xs sm:text-sm text-gray-500 truncate">{student.email || 'No email'}</p>
                          </div>
                          <div className="text-xs text-gray-500 flex-shrink-0 hidden sm:block">
                            {student.joinedAt ? new Date(student.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 px-4">
                      <svg className="w-12 h-12 text-gray-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <p className="text-gray-500 text-sm">No students yet</p>
                      <p className="text-gray-600 text-xs mt-1">Share your join code to get started</p>
                    </div>
                  )}
                </div>

                {/* Quick Stats Card */}
                <div className="bg-[#0F1629] border border-[#1A1F3A] rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-[#7C3AED]/30 hover:shadow-lg hover:shadow-[#7C3AED]/10 transition-all duration-300">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-4">Quick Insights</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-[#1A1F3A] rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#00D9FF] shadow-[#00D9FF] shadow-lg"></div>
                        <span className="text-sm text-gray-300">Join Code</span>
                      </div>
                      <p className="text-sm font-mono text-[#00D9FF] tracking-wider">{joinCode || "N/A"}</p>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-[#1A1F3A] rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#10B981] shadow-[#10B981] shadow-lg"></div>
                        <span className="text-sm text-gray-300">Present Today</span>
                      </div>
                      <p className="text-sm font-semibold text-[#10B981]">{todayAttendance}</p>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-[#1A1F3A] rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#F59E0B] shadow-[#F59E0B] shadow-lg"></div>
                        <span className="text-sm text-gray-300">Absent Today</span>
                      </div>
                      <p className="text-sm font-semibold text-[#F59E0B]">{totalStudents - todayAttendance}</p>
                    </div>

                    {totalStudents > 0 && (
                      <div className="mt-4 p-4 bg-gradient-to-br from-[#0A0E27] to-[#1A1F3A] rounded-lg border border-[#1A1F3A]">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-gray-400">Participation</span>
                          <span className="text-xs font-medium text-[#00D9FF]">
                            {Math.round((todayAttendance / totalStudents) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-[#0A0E27] rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#00D9FF] to-[#7C3AED] rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min((todayAttendance / totalStudents) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Additional Analytics Card */}
              <div className="bg-[#0F1629] border border-[#1A1F3A] rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-[#F59E0B]/30 hover:shadow-lg hover:shadow-[#F59E0B]/10 transition-all duration-300">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-4">Today's Summary</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div className="text-center p-3 bg-[#1A1F3A] rounded-lg">
                    <p className="text-2xl sm:text-3xl font-bold text-[#00D9FF]">{totalStudents}</p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">Enrolled</p>
                  </div>
                  <div className="text-center p-3 bg-[#1A1F3A] rounded-lg">
                    <p className="text-2xl sm:text-3xl font-bold text-[#10B981]">{todayAttendance}</p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">Present</p>
                  </div>
                  <div className="text-center p-3 bg-[#1A1F3A] rounded-lg">
                    <p className="text-2xl sm:text-3xl font-bold text-[#F59E0B]">{totalStudents - todayAttendance}</p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">Absent</p>
                  </div>
                  <div className="text-center p-3 bg-[#1A1F3A] rounded-lg">
                    <p className="text-2xl sm:text-3xl font-bold text-[#7C3AED]">{subjects.length}</p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">Subjects</p>
                  </div>
                </div>
              </div>

            </div>
          </>
        )}

        {view === "cr" && (

          <>

            {!userData.classId ? (

              <div className="max-w-md mx-auto mt-10 sm:mt-20">
                <div className="bg-[#0F1629] border border-[#1A1F3A] rounded-2xl p-6 sm:p-8 hover:border-[#00D9FF]/30 hover:shadow-xl hover:shadow-[#00D9FF]/10 transition-all duration-300">
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-[#00D9FF] to-[#7C3AED] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#00D9FF]/30 hover:scale-110 hover:rotate-12 transition-all duration-300">
                      <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">Create Your Class</h2>
                    <p className="text-sm text-gray-500">Get started by creating your first class</p>
                  </div>

                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Enter class name (e.g., Computer Science A)"
                      className="w-full border border-[#1A1F3A] bg-[#0A0E27] text-gray-200 p-3 sm:p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D9FF] focus:border-transparent transition-all text-sm sm:text-base hover:border-[#00D9FF]/30"
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                    />

                    <button
                      disabled={actionLoading.createClass}
                      onClick={handleCreateClass}
                      className={`w-full text-white px-6 py-3 sm:py-4 rounded-lg font-medium shadow-lg transition-all text-sm sm:text-base ${
                        actionLoading.createClass
                          ? "bg-gradient-to-br from-[#00D9FF]/50 to-[#0EA5E9]/50 cursor-not-allowed"
                          : "bg-gradient-to-br from-[#00D9FF] to-[#0EA5E9] shadow-[#00D9FF]/30 hover:shadow-[#00D9FF]/50 hover:scale-105"
                      }`}
                    >
                      {actionLoading.createClass ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Creating...
                        </span>
                      ) : (
                        "Create Class"
                      )}
                    </button>
                  </div>
                </div>
              </div>

            ) : (

              <>

                {/* Join Code Card with Enhanced Animation */}
                <div className="bg-gradient-to-br from-[#10B981] to-[#059669] rounded-xl sm:rounded-2xl p-5 sm:p-8 mb-6 sm:mb-8 relative overflow-hidden shadow-xl shadow-[#10B981]/20 animate-pulse-subtle hover:shadow-[#10B981]/40 transition-all duration-300 hover:scale-[1.02]">
                  <div className="absolute top-[-50px] right-[-50px] w-[150px] h-[150px] sm:w-[200px] sm:h-[200px] bg-white/10 rounded-full animate-blob"></div>
                  <div className="absolute bottom-[-30px] left-[-30px] w-[100px] h-[100px] sm:w-[150px] sm:h-[150px] bg-white/5 rounded-full animate-blob animation-delay-2000"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-bounce-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      <p className="text-sm font-medium text-white">Student Join Code</p>
                    </div>
                    <p className="text-xs text-green-100 mb-3 sm:mb-4 opacity-90">Share this code with your students to join the class</p>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                      <p className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-[0.3em] font-mono animate-glow">{joinCode}</p>
                      <button className="bg-white/20 backdrop-blur-sm text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl border border-white/30 font-medium hover:bg-white/30 transition-all flex items-center gap-2 text-sm hover:scale-110 transform">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="hidden sm:inline">Copy Code</span>
                        <span className="sm:hidden">Copy</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">

                  {/* Subjects Section */}
                  <div className="lg:col-span-2">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-5">
                      <h2 className="text-lg sm:text-xl font-semibold text-white">Semester Subjects</h2>
                      <span className="bg-[#00D9FF]/10 text-[#00D9FF] px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium hover:bg-[#00D9FF]/20 transition-all duration-300">
                        {subjects.length} Subjects
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-6">
                      <input
                        type="text"
                        placeholder="Add new subject..."
                        className="flex-1 border border-[#1A1F3A] bg-[#0F1629] text-gray-200 p-3 sm:p-4 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00D9FF] transition-all text-sm sm:text-base hover:border-[#00D9FF]/30 focus:scale-[1.02]"
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddSubject()}
                      />

                      <button
                        disabled={actionLoading.addSubject}
                        onClick={handleAddSubject}
                        className={`text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-medium shadow-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap ${
                          actionLoading.addSubject
                            ? "bg-gradient-to-br from-[#00D9FF]/50 to-[#0EA5E9]/50 cursor-not-allowed"
                            : "bg-gradient-to-br from-[#00D9FF] to-[#0EA5E9] shadow-[#00D9FF]/30 hover:shadow-[#00D9FF]/50 hover:scale-105"
                        }`}
                      >
                        {actionLoading.addSubject ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span className="hidden sm:inline">Adding...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span className="hidden sm:inline">Add</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="space-y-3 max-h-[500px] sm:max-h-[600px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">

                      {subjects.map((sub, index) => {
                        const colors = getSubjectColor(index);
                        const isAdding = actionLoading[`addToday-${sub.id}`];
                        const isDeleting = actionLoading[`delete-${sub.id}`];

                        return (

                        <div
                          key={sub.id}
                          className={`bg-[#0F1629] border ${colors.border} border-l-4 rounded-lg sm:rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 hover:bg-[#131829] transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${colors.glow}`}
                        >

                          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                            <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${colors.bg} shadow-lg ${colors.shadow} flex-shrink-0 animate-pulse-slow`}></div>
                            <div className="min-w-0 flex-1">
                              <span className="text-gray-200 font-medium text-sm sm:text-base block truncate">{sub.subjectName}</span>
                            </div>
                          </div>

                          <div className="flex gap-2 w-full sm:w-auto">

                            <button
                              disabled={isAdding || todaySubjects.includes(sub.id)}
                              onClick={() => handleAddToToday(sub.id)}
                              className={`flex-1 sm:flex-none px-3 sm:px-5 py-2 rounded-lg border text-xs sm:text-sm font-medium transition-all duration-300 ${
                                isAdding
                                  ? "bg-[#7C3AED]/20 text-[#7C3AED]/50 border-[#7C3AED]/20 cursor-not-allowed"
                                  : todaySubjects.includes(sub.id)
                                  ? "bg-[#7C3AED]/10 text-[#7C3AED]/50 border-[#7C3AED]/20 cursor-not-allowed"
                                  : "bg-[#7C3AED]/10 text-[#7C3AED] border-[#7C3AED]/20 hover:bg-[#7C3AED]/20 hover:scale-105"
                              }`}
                            >
                              {isAdding ? (
                                <span className="flex items-center justify-center gap-2">
                                  <div className="w-3 h-3 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin"></div>
                                  <span className="hidden sm:inline">Adding...</span>
                                </span>
                              ) : todaySubjects.includes(sub.id) ? (
                                "Added"
                              ) : (
                                <span className="hidden sm:inline">Add to Today</span>
                              )}
                              {!isAdding && !todaySubjects.includes(sub.id) && <span className="sm:hidden">Add</span>}
                            </button>

                            <button
                              disabled={isDeleting}
                              onClick={() => handleDeleteSubject(sub.id)}
                              className={`px-3 sm:px-4 py-2 rounded-lg border transition-all duration-300 ${
                                isDeleting
                                  ? "bg-red-500/10 text-red-400/50 border-red-400/20 cursor-not-allowed"
                                  : "bg-transparent text-red-400 border-red-400/20 hover:bg-red-500/10 hover:scale-105"
                              }`}
                            >
                              {isDeleting ? (
                                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>

                          </div>

                        </div>

                      )})}

                      {subjects.length === 0 && (
                        <div className="text-center py-12 px-4 bg-[#0F1629] border border-[#1A1F3A] rounded-xl hover:border-[#00D9FF]/30 transition-all duration-300">
                          <svg className="w-12 h-12 text-gray-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          <p className="text-gray-500 text-sm">No subjects added yet</p>
                          <p className="text-gray-600 text-xs mt-1">Add your first subject above</p>
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Today's Schedule Section */}
                  <div className="lg:col-span-1">
                    <div className="flex justify-between items-center mb-4 sm:mb-5">
                      <h2 className="text-lg sm:text-xl font-semibold text-white">Today's Schedule</h2>
                      <span className="bg-[#7C3AED]/10 text-[#7C3AED] px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 hover:bg-[#7C3AED]/20 transition-all duration-300">
                        <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="hidden sm:inline">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        <span className="sm:hidden">{new Date().getDate()}</span>
                      </span>
                    </div>

                    {/* Weekly Classes Chart with Hover */}
                    <div className="bg-[#0F1629] border border-[#1A1F3A] rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-4 sm:mb-6 hover:border-[#00D9FF]/30 hover:shadow-lg hover:shadow-[#00D9FF]/10 transition-all duration-300">
                      <h3 className="text-sm font-medium text-gray-400 mb-4">Last 5 Days Classes</h3>
                      <div className="flex items-end justify-between gap-2 h-32 sm:h-40">
                        {weeklyData.map((data, idx) => (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                            <div className="w-full bg-[#1A1F3A] rounded-t-lg relative overflow-hidden transition-all duration-300 group-hover:bg-[#252B44]" style={{ height: `${maxClasses > 0 ? (data.classes / maxClasses) * 100 : 0}%`, minHeight: data.classes > 0 ? '30px' : '8px' }}>
                              {data.classes > 0 && (
                                <>
                                  <div className="absolute inset-0 bg-gradient-to-t from-[#00D9FF] to-[#7C3AED] opacity-80 group-hover:opacity-100 transition-all duration-300"></div>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-white text-xs font-medium">{data.classes}</span>
                                  </div>
                                </>
                              )}
                            </div>
                            <div className="text-center">
                              <span className="text-xs text-gray-500 block group-hover:text-gray-400 transition-colors">{data.day}</span>
                              <span className="text-[10px] text-gray-600">{data.date}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">

                      {todaySubjects.map((id) => {

                        const sub = subjects.find((s) => s.id === id);
                        const subIndex = subjects.findIndex((s) => s.id === id);
                        const colors = getSubjectColor(subIndex);
                        const isRemoving = actionLoading[`removeToday-${id}`];

                        return (

                          <div
                            key={id}
                            className={`bg-[#0F1629] border ${colors.border} border-l-4 rounded-lg sm:rounded-xl p-3 sm:p-4 relative overflow-hidden hover:bg-[#131829] transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${colors.glow}`}
                          >
                            <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 bg-[#7C3AED]/5 rounded-full blur-xl"></div>
                            
                            <div className="flex justify-between items-center relative z-10 gap-2">
                              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                <div className={`w-2 h-2 rounded-full ${colors.bg} shadow-lg ${colors.shadow} flex-shrink-0 animate-pulse-slow`}></div>
                                <span className="text-gray-200 font-medium text-sm truncate">{sub?.subjectName}</span>
                              </div>

                              <button
                                disabled={isRemoving}
                                onClick={() => handleRemoveFromToday(id)}
                                className={`px-2 sm:px-3 py-1.5 rounded-lg border text-xs transition-all duration-300 flex-shrink-0 ${
                                  isRemoving
                                    ? "bg-red-500/10 text-red-400/50 border-red-400/20 cursor-not-allowed"
                                    : "bg-transparent text-red-400 border-red-400/20 hover:bg-red-500/10 hover:scale-105"
                                }`}
                              >
                                {isRemoving ? (
                                  <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  "Remove"
                                )}
                              </button>
                            </div>

                          </div>

                        );

                      })}

                      {todaySubjects.length === 0 && (
                        <div className="text-center py-8 sm:py-12 px-4 bg-[#0F1629] border border-[#1A1F3A] rounded-xl hover:border-[#00D9FF]/30 transition-all duration-300">
                          <svg className="w-10 h-10 sm:w-12 sm:h-12 text-gray-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <p className="text-gray-500 text-xs sm:text-sm">No classes scheduled</p>
                          <p className="text-gray-600 text-xs mt-1">Add subjects from the list</p>
                        </div>
                      )}

                    </div>

                    {/* Publish Button with Professional Loader */}
                    <button
                      disabled={actionLoading.publish || published}
                      onClick={publishSchedule}
                      className={`w-full text-white px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl font-medium shadow-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base relative overflow-hidden ${
                        actionLoading.publish
                          ? "bg-gradient-to-br from-[#10B981]/50 to-[#059669]/50 cursor-not-allowed"
                          : published
                          ? "bg-gradient-to-br from-[#10B981]/50 to-[#059669]/50 cursor-not-allowed"
                          : "bg-gradient-to-br from-[#10B981] to-[#059669] shadow-[#10B981]/30 hover:shadow-[#10B981]/50 hover:scale-105"
                      }`}
                    >
                      {actionLoading.publish ? (
                        <>
                          {/* Professional Circular Loader */}
                          <div className="relative w-5 h-5">
                            <div className="absolute inset-0 border-2 border-white/20 rounded-full"></div>
                            <div className="absolute inset-0 border-2 border-transparent border-t-white rounded-full animate-spin"></div>
                          </div>
                          <span>Publishing...</span>
                        </>
                      ) : published ? (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          Published ✓
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Publish Schedule
                        </>
                      )}
                    </button>

                    <p className="text-xs text-gray-600 mt-3 text-center">Students will be notified instantly</p>

                  </div>

                </div>

              </>

            )}
          </>

        )}

      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0F1629;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1A1F3A;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #252B44;
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
        
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        @keyframes pulse-subtle {
          0%, 100% {
            box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
          }
          50% {
            box-shadow: 0 0 30px rgba(16, 185, 129, 0.4);
          }
        }
        
        .animate-pulse-subtle {
          animation: pulse-subtle 3s ease-in-out infinite;
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
        
        @keyframes glow {
          0%, 100% {
            text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
          }
          50% {
            text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
          }
        }
        
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
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
