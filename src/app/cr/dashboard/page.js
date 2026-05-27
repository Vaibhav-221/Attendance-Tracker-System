"use client";
/* eslint-disable */

import { useEffect, useState, useRef, useMemo } from "react";
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
import { useTheme } from "@/lib/theme-context";
import { Sun, Moon } from "lucide-react";
import SkeletonLoader from "@/components/SkeletonLoader";

export default function CRDashboard() {

  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();

  // Theme configuration
  const T = {
    page: isDark ? '#0A0E27' : '#F8FAFC',
    card: isDark ? '#0F1629' : '#FFFFFF',
    cardAlt: isDark ? '#0F1629' : '#F8FAFC',
    border: isDark ? '#1A1F3A' : '#E2E8F0',
    borderHover: isDark ? '#2A2F4A' : '#CBD5E1',
    text: isDark ? 'text-white' : 'text-slate-900',
    textMuted: isDark ? 'text-gray-400' : 'text-slate-500',
    textSubtle: isDark ? 'text-gray-500' : 'text-slate-400',
    textCodeMuted: isDark ? 'text-gray-600' : 'text-slate-500',
    inputBg: isDark ? '#1A1F3A' : '#E2E8F0',
    subtleHighlight: isDark ? 'bg-white/5' : 'bg-slate-50',
    subtleHighlightHover: isDark ? 'bg-white/10' : 'bg-slate-100',
    gridLine: isDark ? '#1A1F3A' : '#E2E8F0',
    weekBg: isDark ? '#0A0E27' : '#F8FAFC',
    weekBorder: isDark ? '#1A1F3A' : '#E2E8F0',
    todayBorder: isDark ? '#00D9FF/40' : '#3B82F6/50',
    todayBg: isDark ? 'rgba(0,217,255,0.05)' : 'rgba(59,130,246,0.05)',
    todayText: isDark ? '#00D9FF' : '#3B82F6',
    // Accent colors
    accentBlue: isDark ? '#00D9FF' : '#3B82F6',
    accentPurple: isDark ? '#7C3AED' : '#8B5CF6',
    accentGreen: isDark ? '#10B981' : '#059669',
    accentOrange: isDark ? '#F59E0B' : '#D97706',
    accentPink: isDark ? '#EC4899' : '#DB2777',
    modalOverlay: isDark ? 'bg-black/60' : 'bg-black/30',
    sidebarBg: isDark ? '#0F1629' : '#FFFFFF',
    sidebarBorder: isDark ? '#1A1F3A' : '#E2E8F0',
    sidebarNav: isDark ? '#1A1F3A' : '#F1F5F9',
    hamburgerBg: isDark ? '#1A1F3A' : '#FFFFFF',
    hamburgerBorder: isDark ? '#2A2F4A' : '#E2E8F0',
    hamburgerText: isDark ? 'text-gray-300' : 'text-slate-700',
    hamburgerHover: isDark ? '#2A2F4A' : '#F1F5F9',
    progressBar: isDark ? '#1A1F3A' : '#E2E8F0',
    targetLine: isDark ? 'border-white/50' : 'border-slate-400',
    chartGradBg: isDark ? 'bg-[#1A1F3A]' : 'bg-slate-200',
    emptyBar: isDark ? 'bg-gray-700/20' : 'bg-slate-200',
    emptyBarLight: isDark ? 'bg-gray-700/30' : 'bg-slate-200',
    navText: isDark ? 'text-gray-400' : 'text-slate-400',
    navTextSmall: isDark ? 'text-gray-500' : 'text-slate-500',
    codeBg: isDark ? 'bg-[#00D9FF]/5' : 'bg-slate-100',
    codeBorder: isDark ? 'bg-[#00D9FF]/5' : 'bg-slate-100',
    cardShadow: isDark ? 'bg-white/3' : 'bg-slate-100/50',
    cardShadowHover: isDark ? 'bg-white/5' : 'bg-slate-100',
    modalBackdrop: isDark ? 'backdrop-blur-sm' : '',
    tipText: isDark ? 'text-gray-600' : 'text-slate-400',
    dayEmptyText: isDark ? 'text-gray-600' : 'text-slate-400',
    noDataText: isDark ? 'text-gray-600' : 'text-slate-400',
    dayLabel: isDark ? 'text-gray-400' : 'text-slate-500',
    dayText: isDark ? 'text-gray-600' : 'text-slate-400',
  };

  const cardStyle = {
    backgroundColor: T.card,
    borderColor: T.border,
  };

  const altCardStyle = {
    backgroundColor: T.cardAlt,
    borderColor: T.border,
  };

  const inputStyle = {
    backgroundColor: T.inputBg,
    borderColor: T.border,
  };

  const accentTints = {
    blue: isDark ? 'rgba(0,217,255,0.12)' : 'rgba(59,130,246,0.14)',
    purple: isDark ? 'rgba(124,58,237,0.12)' : 'rgba(139,92,246,0.14)',
    green: isDark ? 'rgba(16,185,129,0.12)' : 'rgba(5,150,105,0.14)',
    orange: isDark ? 'rgba(245,158,11,0.12)' : 'rgba(217,119,6,0.14)',
    pink: isDark ? 'rgba(236,72,153,0.12)' : 'rgba(219,39,119,0.14)',
  };

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
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!showUserMenu) return;

    function handleDocClick(e) {
      const menuEl = menuRef.current;
      const btnEl = buttonRef.current;
      if (menuEl && !menuEl.contains(e.target) && btnEl && !btnEl.contains(e.target)) {
        setShowUserMenu(false);
      }
    }

    function handleEsc(e) {
      if (e.key === 'Escape') setShowUserMenu(false);
    }

    document.addEventListener('mousedown', handleDocClick);
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('mousedown', handleDocClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [showUserMenu]);

  const [weeklyData, setWeeklyData] = useState([]);

  // Monitor analytics state
  const [totalStudents, setTotalStudents] = useState(0);
  const [todayAttendance, setTodayAttendance] = useState(0);
  const [weeklyAttendance, setWeeklyAttendance] = useState([]);
  const [recentStudents, setRecentStudents] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const maxClasses = useMemo(() => Math.max(...weeklyData.map(d => d.classes), 1), [weeklyData]);
  const weeklyMaxScheduled = useMemo(() => Math.max(...weeklyAttendance.map(d => Math.max(d.scheduled, d.attended)), 1), [weeklyAttendance]);

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

  /* eslint-disable react-hooks/exhaustive-deps */
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
  /* eslint-enable react-hooks/exhaustive-deps */

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

      const scheduleMap = Object.fromEntries(snapshot.docs.map(doc => [doc.id, doc]));

      const weekData = dates.map(dateInfo => {
        const scheduleDoc = scheduleMap[dateInfo.dateStr];
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
        { name: newSubject }
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
    return <SkeletonLoader isDark={isDark} />;
  }

  const subjectColors = [
    {
      accent: T.accentBlue,
      background: isDark ? 'rgba(59,130,246,0.16)' : 'rgba(59,130,246,0.12)',
      borderColor: isDark ? 'rgba(59,130,246,0.45)' : 'rgba(59,130,246,0.35)',
      dotShadow: isDark ? '0 0 20px rgba(59,130,246,0.2)' : '0 0 16px rgba(59,130,246,0.14)',
      cardShadow: isDark ? '0 20px 50px rgba(59,130,246,0.12)' : '0 14px 30px rgba(59,130,246,0.08)'
    },
    {
      accent: T.accentPurple,
      background: isDark ? 'rgba(124,58,237,0.16)' : 'rgba(139,92,246,0.12)',
      borderColor: isDark ? 'rgba(124,58,237,0.45)' : 'rgba(139,92,246,0.35)',
      dotShadow: isDark ? '0 0 20px rgba(124,58,237,0.2)' : '0 0 16px rgba(139,92,246,0.14)',
      cardShadow: isDark ? '0 20px 50px rgba(124,58,237,0.12)' : '0 14px 30px rgba(139,92,246,0.08)'
    },
    {
      accent: T.accentOrange,
      background: isDark ? 'rgba(245,158,11,0.16)' : 'rgba(217,119,6,0.12)',
      borderColor: isDark ? 'rgba(245,158,11,0.45)' : 'rgba(217,119,6,0.35)',
      dotShadow: isDark ? '0 0 20px rgba(245,158,11,0.2)' : '0 0 16px rgba(217,119,6,0.14)',
      cardShadow: isDark ? '0 20px 50px rgba(245,158,11,0.12)' : '0 14px 30px rgba(217,119,6,0.08)'
    },
    {
      accent: T.accentGreen,
      background: isDark ? 'rgba(16,185,129,0.16)' : 'rgba(5,150,105,0.12)',
      borderColor: isDark ? 'rgba(16,185,129,0.45)' : 'rgba(5,150,105,0.35)',
      dotShadow: isDark ? '0 0 20px rgba(16,185,129,0.2)' : '0 0 16px rgba(5,150,105,0.14)',
      cardShadow: isDark ? '0 20px 50px rgba(16,185,129,0.12)' : '0 14px 30px rgba(5,150,105,0.08)'
    },
    {
      accent: T.accentPink,
      background: isDark ? 'rgba(236,72,153,0.16)' : 'rgba(219,39,119,0.12)',
      borderColor: isDark ? 'rgba(236,72,153,0.45)' : 'rgba(219,39,119,0.35)',
      dotShadow: isDark ? '0 0 20px rgba(236,72,153,0.2)' : '0 0 16px rgba(219,39,119,0.14)',
      cardShadow: isDark ? '0 20px 50px rgba(236,72,153,0.12)' : '0 14px 30px rgba(219,39,119,0.08)'
    },
  ];
  const getSubjectColor = (index) => {
    const count = subjectColors.length;
    const safeIndex = typeof index === 'number' && !Number.isNaN(index)
      ? ((index % count) + count) % count
      : 0;
    return subjectColors[safeIndex];
  };


  return (

    <div className={`min-h-screen ${T.text} p-3 sm:p-5 lg:p-8 relative overflow-hidden`} style={{ backgroundColor: T.page }}>

      {/* Enhanced Animated Background */}
      <div className="absolute -top-25 -right-25 w-75 h-75 sm:w-100 sm:h-100 bg-[#00D9FF]/5 rounded-full blur-[100px] animate-float"></div>
      <div className="absolute -bottom-37.5 -left-37.5 w-87.5 h-87.5 sm:w-125 sm:h-125 bg-[#7C3AED]/5 rounded-full blur-[120px] animate-float-delayed"></div>
      <div className="absolute top-1/2 left-1/2 w-50 h-50 sm:w-75 sm:h-75 bg-[#10B981]/5 rounded-full blur-[100px] animate-pulse-slow"></div>

      <div className="max-w-7xl mx-auto relative z-10">

        {/* Header with Greeting */}
        <div className="flex justify-between items-start gap-3 mb-8 sm:mb-12">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-linear-to-br from-[#00D9FF] to-[#7C3AED] rounded-lg flex items-center justify-center shadow-lg shadow-[#00D9FF]/30 shrink-0 hover:scale-105 active:scale-99 transition-transform duration-200">
                <img src="/Croppedlogo.jpeg" alt="Attendance Sarthi Logo" className={`w-full h-full object-contain rounded box-border ${!isDark ? 'border border-gray-800' : ''}`} />
              </div>
              <div className="min-w-0">
                <h1 className={`text-xl sm:text-2xl lg:text-3xl font-semibold ${T.text} truncate`}>Attendance Sarthi</h1>
                <p className="text-sm sm:text-base text-transparent bg-clip-text bg-linear-to-r from-[#00D9FF] to-[#7C3AED] font-medium animate-gradient">
                  {getGreeting()}, {userData?.name || 'User'}!
                </p>
              </div>
            </div>
            <p className={`text-xs sm:text-sm ${T.textMuted} pl-0 sm:pl-12 hidden sm:block`}>Manage class attendance seamlessly</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="text-right hidden md:block">
              <p className={`text-xs ${T.textMuted}`}>Class Representative</p>
              <p className="text-sm text-gray-300 font-medium">{userData?.name || 'CR User'}</p>
            </div>
            
            {/* User Menu */}
            <div className="relative">
              <button
                ref={buttonRef}
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-br from-[#00D9FF] to-[#7C3AED] rounded-full flex items-center justify-center ${T.text} font-semibold text-base sm:text-lg border-2 shadow-lg shadow-[#00D9FF]/30 hover:scale-110 hover:shadow-[#00D9FF]/60 transition-all duration-300 cursor-pointer`}
                style={{ borderColor: T.border }}
              >
                {userData?.name?.charAt(0) || 'CR'}
              </button>

              {/* Overlay (blur + close on click) */}
              {showUserMenu && (
                <div>
                  <div className="fixed inset-0 backdrop-blur-sm bg-black/20 z-40" onClick={() => setShowUserMenu(false)} aria-hidden="true"></div>

                  {/* Dropdown Menu (absolute, does not affect layout) */}
                  <div ref={menuRef} className={`${isDark ? 'bg-linear-to-br from-[#0F1629] to-[#0A0E27]' : 'bg-white'} absolute right-0 mt-2 w-64 border rounded-xl shadow-2xl ${isDark ? 'shadow-black/50' : 'shadow-gray-400'} overflow-hidden z-50 animate-fadeIn`} style={{ borderColor: T.border }}>
                  <div className="p-3 border-b" style={{ borderColor: T.border }}>
                    <p className={`${T.text} font-medium truncate`}>{userData?.name}</p>
                    <p className={`${T.textMuted} text-xs truncate`}>{userData?.email}</p>
                  </div>

                  {/* Theme Toggle */}
                  <button
                    onClick={toggleTheme}
                    aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                    className="w-full px-4 py-3 text-left flex items-center justify-between transition-colors duration-200"
                  >
                    <div className="flex items-center gap-2">
                      {isDark ? <Moon className="w-4 h-4 text-[#6B7280]" /> : <Sun className="w-4 h-4 text-yellow-500" />}
                      <span className={T.textMuted}>{isDark ? 'Dark' : 'Light'} Mode</span>
                    </div>
                    <div className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${isDark ? 'bg-[#2A2F4A]' : 'bg-slate-300'}`}>
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${isDark ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                  </button>

                  <div className="border-t mx-3 my-1" style={{ borderColor: T.border }}></div>

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
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards with Hover Effects */}
        {userData?.classId && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
            
            <div className="border rounded-xl sm:rounded-2xl p-4 sm:p-5 relative overflow-hidden transition-transform duration-150 hover:scale-101 hover:shadow-xl group cursor-pointer" style={cardStyle}>
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl transition-all duration-300 group-hover:opacity-90" style={{ backgroundColor: accentTints.blue }}></div>
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 relative z-10">
                <div className={isDark ? 'w-8 h-8 sm:w-9 sm:h-9 bg-[#00D9FF]/10 rounded-lg flex items-center justify-center hover:bg-[#00D9FF]/20  transition-all duration-300' : 'w-8 h-8 sm:w-9 sm:h-9 bg-[#3B82F6]/10 rounded-lg flex items-center justify-center hover:bg-[#3B82F6]/20  transition-all duration-300'}>
                  <svg className={isDark ? 'w-4 h-4 sm:w-5 sm:h-5 text-[#00D9FF]' : 'w-4 h-4 sm:w-5 sm:h-5 text-[#3B82F6]'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <p className={`text-xs ${T.textMuted} group-hover:text-gray-400 transition-colors`}>Total Subjects</p>
              </div>
              <p className={isDark ? 'text-2xl sm:text-3xl font-semibold text-[#00D9FF] relative z-10  transition-transform duration-300' : 'text-2xl sm:text-3xl font-semibold text-[#3B82F6] relative z-10  transition-transform duration-300'}>{subjects.length}</p>
            </div>

            <div className="border rounded-xl sm:rounded-2xl p-4 sm:p-5 relative overflow-hidden transition-transform duration-150 hover:scale-101 hover:shadow-xl group cursor-pointer" style={cardStyle}>
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl transition-all duration-300 group-hover:opacity-90" style={{ backgroundColor: accentTints.purple }}></div>
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 relative z-10">
                <div className={isDark ? 'w-8 h-8 sm:w-9 sm:h-9 bg-[#7C3AED]/10 rounded-lg flex items-center justify-center hover:bg-[#7C3AED]/20  transition-all duration-300' : 'w-8 h-8 sm:w-9 sm:h-9 bg-[#8B5CF6]/10 rounded-lg flex items-center justify-center hover:bg-[#8B5CF6]/20  transition-all duration-300'}>
                  <svg className={isDark ? 'w-4 h-4 sm:w-5 sm:h-5 text-[#7C3AED]' : 'w-4 h-4 sm:w-5 sm:h-5 text-[#8B5CF6]'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className={`text-xs ${T.textMuted} group-hover:text-gray-400 transition-colors`}>Today&apos;s Classes</p>
              </div>
              <p className={isDark ? 'text-2xl sm:text-3xl font-semibold text-[#7C3AED] relative z-10  transition-transform duration-300' : 'text-2xl sm:text-3xl font-semibold text-[#8B5CF6] relative z-10  transition-transform duration-300'}>{todaySubjects.length}</p>
            </div>

            <div className="border rounded-xl sm:rounded-2xl p-4 sm:p-5 relative overflow-hidden transition-transform duration-150 hover:scale-101 hover:shadow-xl group cursor-pointer col-span-2 lg:col-span-1" style={cardStyle}>
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl transition-all duration-300 group-hover:opacity-90" style={{ backgroundColor: accentTints.green }}></div>
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 relative z-10">
                <div className={isDark ? 'w-8 h-8 sm:w-9 sm:h-9 bg-[#10B981]/10 rounded-lg flex items-center justify-center hover:bg-[#10B981]/20  transition-all duration-300' : 'w-8 h-8 sm:w-9 sm:h-9 bg-[#059669]/10 rounded-lg flex items-center justify-center hover:bg-[#059669]/20  transition-all duration-300'}>
                  <svg className={isDark ? 'w-4 h-4 sm:w-5 sm:h-5 text-[#10B981]' : 'w-4 h-4 sm:w-5 sm:h-5 text-[#059669]'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className={`text-xs ${T.textMuted} group-hover:text-gray-400 transition-colors`}>Schedule Status</p>
              </div>
              <p className={isDark ? 'text-2xl sm:text-3xl font-semibold text-[#10B981] relative z-10  transition-transform duration-300' : 'text-2xl sm:text-3xl font-semibold text-[#059669] relative z-10  transition-transform duration-300'}>
                {published ? "Published" : "Draft"}
              </p>
            </div>

          </div>
        )}

        {/* Navigation Tabs with Hover Effects */}
        <div className="flex gap-2 sm:gap-3 mb-6 sm:mb-8 border-b overflow-x-auto" style={{ borderColor: T.border }}>

          <button
            onClick={() => setView("cr")}
            className={`px-4 sm:px-7 py-2.5 sm:py-3 rounded-t-lg font-medium text-xs sm:text-sm transition-all duration-300 whitespace-nowrap ${
              view === "cr"
                ? `bg-linear-to-br from-[#00D9FF] to-[#0EA5E9] ${T.text} shadow-lg shadow-[#00D9FF]/30`
                : `bg-transparent ${T.textMuted} hover:text-gray-300 hover:bg-[#1A1F3A]/50`
            }`}
          >
            CR Panel
          </button>

          <button
            onClick={() => setView("monitor")}
            className={`px-4 sm:px-7 py-2.5 sm:py-3 rounded-t-lg font-medium text-xs sm:text-sm transition-all duration-300 whitespace-nowrap ${
              view === "monitor"
                ? `bg-linear-to-br from-[#00D9FF] to-[#0EA5E9] ${T.text} shadow-lg shadow-[#00D9FF]/30`
                : `bg-transparent ${T.textMuted} hover:text-gray-300 hover:bg-[#1A1F3A]/50`
            }`}
          >
            Monitor
          </button>

          <button
            onClick={() => setView("student")}
            className={`px-4 sm:px-7 py-2.5 sm:py-3 rounded-t-lg font-medium text-xs sm:text-sm transition-all duration-300 whitespace-nowrap ${
              view === "student"
                ? `bg-linear-to-br from-[#00D9FF] to-[#0EA5E9] ${T.text} shadow-lg shadow-[#00D9FF]/30`
                : `bg-transparent ${T.textMuted} hover:text-gray-300 hover:bg-[#1A1F3A]/50`
            }`}
          >
            My Attendance
          </button>

        </div>

        {view === "student" && (

          <iframe
            src="/student/dashboard"
            className="w-full h-150 sm:h-200 border rounded-xl hover:border-[#00D9FF]/30 transition-all duration-300"
            style={{ borderColor: T.border }}
          />

        )}

        {view === "monitor" && (
          <>
            {/* Monitor Dashboard */}
            <div className="space-y-6 sm:space-y-8">

              {/* Page Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-linear-to-br from-[#00D9FF] to-[#7C3AED] rounded-xl flex items-center justify-center shadow-lg shadow-[#00D9FF]/30">
                  <svg className={`w-6 h-6 ${T.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h2 className={`text-xl sm:text-2xl font-semibold ${T.text}`}>Analytics Monitor</h2>
                  <p className={`text-xs sm:text-sm ${T.textMuted}`}>Track class performance and engagement</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

                {/* Total Students Card */}
                <div className="border rounded-xl sm:rounded-2xl p-4 sm:p-5 relative overflow-hidden transition-transform duration-150 hover:scale-101 hover:shadow-xl group" style={cardStyle}>
                  <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl transition-all duration-300 group-hover:opacity-90" style={{ backgroundColor: accentTints.blue }}></div>
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 relative z-10">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#00D9FF]/10 rounded-lg flex items-center justify-center group-hover:bg-[#00D9FF]/20  transition-all duration-300">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#00D9FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <p className={`text-xs ${T.textMuted} group-hover:text-gray-400 transition-colors`}>Total Students</p>
                  </div>
                  {analyticsLoading ? (
                    <div className="h-8 w-16 bg-[#1A1F3A] rounded animate-pulse"></div>
                  ) : (
                    <p className="text-2xl sm:text-3xl font-semibold text-[#00D9FF] relative z-10  transition-transform duration-300">{totalStudents}</p>
                  )}
                </div>

                {/* Today's Attendance Card */}
                <div className="border rounded-xl sm:rounded-2xl p-4 sm:p-5 relative overflow-hidden transition-transform duration-150 hover:scale-101 hover:shadow-xl group" style={cardStyle}>
                  <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl transition-all duration-300 group-hover:opacity-90" style={{ backgroundColor: accentTints.green }}></div>
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 relative z-10">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#10B981]/10 rounded-lg flex items-center justify-center group-hover:bg-[#10B981]/20  transition-all duration-300">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#10B981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className={`text-xs ${T.textMuted} group-hover:text-gray-400 transition-colors`}>Today&apos;s Attendance</p>
                  </div>
                  {analyticsLoading ? (
                    <div className="h-8 w-16 bg-[#1A1F3A] rounded animate-pulse"></div>
                  ) : (
                    <p className="text-2xl sm:text-3xl font-semibold text-[#10B981] relative z-10  transition-transform duration-300">
                      {todayAttendance}
                      <span className={`text-xs sm:text-sm ${T.textMuted} font-normal ml-1`}>/ {totalStudents}</span>
                    </p>
                  )}
                </div>

                {/* Weekly Avg Card */}
                <div className="border rounded-xl sm:rounded-2xl p-4 sm:p-5 relative overflow-hidden transition-transform duration-150 hover:scale-101 hover:shadow-xl group col-span-2 lg:col-span-1" style={cardStyle}>
                  <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl transition-all duration-300 group-hover:opacity-90" style={{ backgroundColor: accentTints.orange }}></div>
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 relative z-10">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#F59E0B]/10 rounded-lg flex items-center justify-center group-hover:bg-[#F59E0B]/20  transition-all duration-300">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#F59E0B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                      </svg>
                    </div>
                    <p className={`text-xs ${T.textMuted} group-hover:text-gray-400 transition-colors`}>Attendance Rate</p>
                  </div>
                  {analyticsLoading ? (
                    <div className="h-8 w-20 bg-[#1A1F3A] rounded animate-pulse"></div>
                  ) : (
                    <p className="text-2xl sm:text-3xl font-semibold text-[#F59E0B] relative z-10  transition-transform duration-300">
                      {totalStudents > 0 ? Math.round((todayAttendance / totalStudents) * 100) : 0}%
                    </p>
                  )}
                </div>

              </div>

              {/* Weekly Attendance Chart */}
              <div className="border rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:shadow-lg" style={cardStyle}>
                <div className="flex justify-between items-start mb-4 sm:mb-6">
                  <h3 className={`text-base sm:text-lg font-semibold ${T.text}`}>Weekly Attendance Overview</h3>
                  <span className={`text-xs sm:text-sm ${T.textMuted} hidden sm:inline`}>Last 7 days</span>
                </div>

                {analyticsLoading ? (
                  <div className="h-64 bg-[#1A1F3A] rounded-xl animate-pulse"></div>
                ) : (
                  <div className="h-64 sm:h-72">
                    <div className="flex items-end justify-between gap-2 sm:gap-4 h-full">
                      {weeklyAttendance.map((data, idx) => {
                        const maxVal = weeklyMaxScheduled;
                        const scheduledHeight = (data.scheduled / maxVal) * 100;
                        const attendedHeight = (data.attended / maxVal) * 100;

                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-2 sm:gap-3 group">
                            <div className="w-full flex flex-col gap-1 relative" style={{ height: '200px' }}>
                              {/* Scheduled (background) */}
                              <div className="absolute bottom-0 w-full rounded-t-lg transition-all duration-300 group-hover:bg-[#252B44]" style={{ height: `${scheduledHeight}%`, minHeight: scheduledHeight > 0 ? '20px' : '4px', backgroundColor: '#1A1F3A' }}>
                                {data.scheduled > 0 && (
                                  <div className="absolute inset-0 rounded-t-lg" style={{ background: isDark ? 'linear-gradient(to top, rgba(0,217,255,0.20), transparent)' : 'linear-gradient(to top, rgba(59,130,246,0.20), transparent)' }}></div>
                                )}
                              </div>
                              {/* Attended (foreground) */}
                              <div className="absolute bottom-0 w-full rounded-t-lg transition-all duration-300 opacity-80" style={{ height: `${attendedHeight}%`, minHeight: attendedHeight > 0 ? '20px' : '4px', background: isDark ? 'linear-gradient(to top, #00D9FF, #7C3AED)' : 'linear-gradient(to top, #3B82F6, #8B5CF6)' }}>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className={`${T.text} text-xs font-medium drop-shadow-md`}>{data.attended}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-center">
                              <span className="text-xs sm:text-sm font-medium block transition-colors" style={{ color: isDark ? '#00D9FF' : '#3B82F6' }}>{data.day}</span>
                              <span className={`text-[10px] sm:text-xs ${T.textMuted}`}>{data.date}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div className="flex justify-center gap-4 sm:gap-6 mt-6 pt-4 border-t" style={{ borderColor: T.border }}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: isDark ? 'linear-gradient(90deg, #00D9FF, #7C3AED)' : 'linear-gradient(90deg, #3B82F6, #8B5CF6)' }}></div>
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
                <div className="lg:col-span-2 border rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:shadow-lg" style={cardStyle}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className={`text-base sm:text-lg font-semibold ${T.text}`}>Recent Students</h3>
                    <span className={`text-xs sm:text-sm ${T.textMuted}`}>Latest 5</span>
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
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${T.text} font-semibold text-sm shrink-0`} style={{ background: isDark ? 'linear-gradient(135deg, #00D9FF, #7C3AED)' : 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}>
                            {student.name?.charAt(0) || 'S'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm sm:text-base ${T.text} font-medium truncate`}>{student.name || 'Anonymous'}</p>
                            <p className={`text-xs sm:text-sm ${T.textMuted} truncate`}>{student.email || 'No email'}</p>
                          </div>
                          <div className={`text-xs ${T.textMuted} shrink-0 hidden sm:block`}>
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
                      <p className={`${T.textMuted} text-sm`}>No students yet</p>
                      <p className="text-gray-600 text-xs mt-1">Share your join code to get started</p>
                    </div>
                  )}
                </div>

                {/* Quick Stats Card */}
                <div className="border rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:shadow-lg" style={cardStyle}>
                  <h3 className={`text-base sm:text-lg font-semibold ${T.text} mb-4`}>Quick Insights</h3>
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
                      <div className="mt-4 p-4 bg-linear-to-br from-[#0A0E27] to-[#1A1F3A] rounded-lg border" style={{ borderColor: T.border }}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-gray-400">Participation</span>
                          <span className="text-xs font-medium text-[#00D9FF]">
                            {Math.round((todayAttendance / totalStudents) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-[#0A0E27] rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-linear-to-r from-[#00D9FF] to-[#7C3AED] rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min((todayAttendance / totalStudents) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Additional Analytics Card */}
              <div className="border rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:shadow-lg" style={cardStyle}>
                <h3 className={`text-base sm:text-lg font-semibold ${T.text} mb-4`}>Today&apos;s Summary</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div className="text-center p-3 bg-[#1A1F3A] rounded-lg">
                    <p className="text-2xl sm:text-3xl font-bold text-[#00D9FF]">{totalStudents}</p>
                    <p className={`text-xs sm:text-sm ${T.textMuted} mt-1`}>Enrolled</p>
                  </div>
                  <div className="text-center p-3 bg-[#1A1F3A] rounded-lg">
                    <p className="text-2xl sm:text-3xl font-bold text-[#10B981]">{todayAttendance}</p>
                    <p className={`text-xs sm:text-sm ${T.textMuted} mt-1`}>Present</p>
                  </div>
                  <div className="text-center p-3 bg-[#1A1F3A] rounded-lg">
                    <p className="text-2xl sm:text-3xl font-bold text-[#F59E0B]">{totalStudents - todayAttendance}</p>
                    <p className={`text-xs sm:text-sm ${T.textMuted} mt-1`}>Absent</p>
                  </div>
                  <div className="text-center p-3 bg-[#1A1F3A] rounded-lg">
                    <p className="text-2xl sm:text-3xl font-bold text-[#7C3AED]">{subjects.length}</p>
                    <p className={`text-xs sm:text-sm ${T.textMuted} mt-1`}>Subjects</p>
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
                <div className="border rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:shadow-xl" style={cardStyle}>
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-linear-to-br from-[#00D9FF] to-[#7C3AED] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#00D9FF]/30 hover:scale-110 hover:rotate-12 transition-all duration-300">
                      <svg className={`w-7 h-7 sm:w-8 sm:h-8 ${T.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <h2 className={`text-xl sm:text-2xl font-semibold ${T.text} mb-2`}>Create Your Class</h2>
                    <p className={`text-sm ${T.textMuted}`}>Get started by creating your first class</p>
                  </div>

                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Enter class name (e.g., Computer Science A)"
                      className={`w-full border bg-[#0A0E27] ${T.text} p-3 sm:p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D9FF] focus:border-transparent transition-all text-sm sm:text-base hover:border-[#00D9FF]/30`}
                      style={inputStyle}
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                    />

                    <button
                      disabled={actionLoading.createClass}
                      onClick={handleCreateClass}
                      className={`w-full ${T.text} px-6 py-3 sm:py-4 rounded-lg font-medium shadow-lg transition-all text-sm sm:text-base ${
                        actionLoading.createClass
                          ? "bg-linear-to-br from-[#00D9FF]/50 to-[#0EA5E9]/50 cursor-not-allowed"
                          : "bg-linear-to-br from-[#00D9FF] to-[#0EA5E9] shadow-[#00D9FF]/30 hover:shadow-[#00D9FF]/50 hover:scale-105"
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
                <div className="bg-linear-to-br from-[#10B981] to-[#059669] rounded-xl sm:rounded-2xl p-5 sm:p-8 mb-6 sm:mb-8 relative overflow-hidden shadow-xl shadow-[#10B981]/20 animate-pulse-subtle hover:shadow-[#10B981]/40 transition-all duration-300 hover:scale-[1.02]">
                  <div className="absolute -top-12.5 -right-12.5 w-37.5 h-37.5 sm:w-50 sm:h-50 bg-white/10 rounded-full animate-blob"></div>
                  <div className="absolute -bottom-7.5 -left-7.5 w-25 h-25 sm:w-37.5 sm:h-37.5 bg-white/5 rounded-full animate-blob animation-delay-2000"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <svg className={`w-5 h-5 sm:w-6 sm:h-6 ${T.text} animate-bounce-slow`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      <p className={`text-sm font-medium ${T.text}`}>Student Join Code</p>
                    </div>
                    <p className="text-xs text-green-100 mb-3 sm:mb-4 opacity-90">Share this code with your students to join the class</p>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                      <p className={`text-4xl sm:text-5xl lg:text-6xl font-bold ${T.text} tracking-[0.3em] font-mono animate-glow`}>{joinCode}</p>
                      <button className={`bg-white/20 backdrop-blur-sm ${T.text} px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl border border-white/30 font-medium hover:bg-white/30 transition-all flex items-center gap-2 text-sm hover:scale-110 transform`}>
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
                      <h2 className={`text-lg sm:text-xl font-semibold ${T.text}`}>Semester Subjects</h2>
                      <span className="bg-[#00D9FF]/10 text-[#00D9FF] px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium hover:bg-[#00D9FF]/20 transition-all duration-300">
                        {subjects.length} Subjects
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-6">
                      <input
                        type="text"
                        placeholder="Add new subject..."
                        className={`flex-1 border rounded-lg sm:rounded-xl ${T.text} p-3 sm:p-4 focus:outline-none focus:ring-2 focus:ring-[#00D9FF] transition-all text-sm sm:text-base hover:border-[#00D9FF]/30 focus:scale-[1.02]`}
                        style={inputStyle}
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddSubject()}
                      />

                      <button
                        disabled={actionLoading.addSubject}
                        onClick={handleAddSubject}
                        className={`${T.text} px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-medium shadow-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap ${
                          actionLoading.addSubject
                            ? "bg-linear-to-br from-[#00D9FF]/50 to-[#0EA5E9]/50 cursor-not-allowed"
                            : "bg-linear-to-br from-[#00D9FF] to-[#0EA5E9] shadow-[#00D9FF]/30 hover:shadow-[#00D9FF]/50 hover:scale-105"
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

                    <div className="space-y-3 max-h-125 sm:max-h-150 overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">

                      {subjects.map((sub, index) => {
                        const colors = getSubjectColor(index);
                        const isAdding = actionLoading[`addToday-${sub.id}`];
                        const isDeleting = actionLoading[`delete-${sub.id}`];

                        return (

                        <div
                          key={sub.id}
                          className="border border-l-4 rounded-lg sm:rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                          style={{
                            ...cardStyle,
                            borderColor: colors.borderColor,
                            borderLeftColor: colors.accent,
                            boxShadow: colors.cardShadow,
                            backgroundColor: T.card
                          }}
                        >

                          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0 animate-pulse-slow" style={{ backgroundColor: colors.accent, boxShadow: colors.dotShadow }}></div>
                            <div className="min-w-0 flex-1">
                              <span className={`${T.text} font-medium text-sm sm:text-base block truncate`}>{sub.subjectName}</span>
                            </div>
                          </div>

                          <div className="flex gap-2 w-full sm:w-auto">

                            <button
                              disabled={isAdding || todaySubjects.includes(sub.id)}
                              onClick={() => handleAddToToday(sub.id)}
                              className={`flex-1 sm:flex-none px-3 sm:px-5 py-2 rounded-lg border text-xs sm:text-sm font-medium transition-all duration-300 ${isAdding || todaySubjects.includes(sub.id) ? 'cursor-not-allowed opacity-80' : 'hover:scale-105'}`}
                              style={{
                                backgroundColor: isAdding || todaySubjects.includes(sub.id) ? (isDark ? 'rgba(124,58,237,0.12)' : 'rgba(139,92,246,0.1)') : (isDark ? 'rgba(124,58,237,0.1)' : 'rgba(139,92,246,0.1)'),
                                color: isAdding || todaySubjects.includes(sub.id) ? (isDark ? 'rgba(167,139,250,0.9)' : 'rgba(168,85,247,0.95)') : (isDark ? '#EDE9FE' : '#6D28D9'),
                                borderColor: isDark ? 'rgba(124,58,237,0.2)' : 'rgba(139,92,246,0.2)'
                              }}
                            >
                              {isAdding ? (
                                <span className="flex items-center justify-center gap-2">
                                  <div className="w-3 h-3 border-2 rounded-full animate-spin" style={{ borderColor: isDark ? '#7C3AED' : '#8B5CF6', borderTopColor: 'transparent' }}></div>
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
                        <div className="text-center py-12 px-4 border rounded-xl transition-all duration-300" style={cardStyle}>
                          <svg className="w-12 h-12 text-gray-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          <p className={`${T.textMuted} text-sm`}>No subjects added yet</p>
                          <p className="text-gray-600 text-xs mt-1">Add your first subject above</p>
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Today's Schedule Section */}
                  <div className="lg:col-span-1">
                    <div className="flex justify-between items-center mb-4 sm:mb-5">
                      <h2 className={`text-lg sm:text-xl font-semibold ${T.text}`}>Today&apos;s Schedule</h2>
                      <span className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all duration-300" style={{ backgroundColor: isDark ? 'rgba(124,58,237,0.12)' : 'rgba(139,92,246,0.1)', color: isDark ? '#D8B4FE' : '#7C3AED' }}>
                        <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="hidden sm:inline">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        <span className="sm:hidden">{new Date().getDate()}</span>
                      </span>
                    </div>

                    {/* Weekly Classes Chart with Hover */}
                    <div className="border rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-4 sm:mb-6 transition-all duration-300 hover:shadow-lg" style={cardStyle}>
                      <h3 className="text-sm font-medium text-gray-400 mb-4">Last 5 Days Classes</h3>
                      <div className="flex items-end justify-between gap-2 h-32 sm:h-40">
                        {weeklyData.map((data, idx) => (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                            <div className="w-full rounded-t-lg relative overflow-hidden transition-all duration-300 group-hover:bg-[#252B44]" style={{ height: `${maxClasses > 0 ? (data.classes / maxClasses) * 100 : 0}%`, minHeight: data.classes > 0 ? '30px' : '8px', backgroundColor: '#1A1F3A' }}>
                              {data.classes > 0 && (
                                <>
                                  <div className="absolute inset-0 opacity-80 group-hover:opacity-100 transition-all duration-300" style={{ background: isDark ? 'linear-gradient(to top, #00D9FF, #7C3AED)' : 'linear-gradient(to top, #3B82F6, #8B5CF6)' }}></div>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className={`${T.text} text-xs font-medium`}>{data.classes}</span>
                                  </div>
                                </>
                              )}
                            </div>
                            <div className="text-center">
                              <span className={`text-xs ${T.textMuted} block group-hover:text-gray-400 transition-colors`}>{data.day}</span>
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
                            className="border border-l-4 rounded-lg sm:rounded-xl p-3 sm:p-4 relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                            style={{
                              ...cardStyle,
                              borderColor: colors.borderColor,
                              borderLeftColor: colors.accent,
                              boxShadow: colors.cardShadow,
                              backgroundColor: T.card
                            }}
                          >
                            <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 bg-[#7C3AED]/5 rounded-full blur-xl"></div>
                            
                            <div className="flex justify-between items-center relative z-10 gap-2">
                              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                <div className="w-2 h-2 rounded-full shrink-0 animate-pulse-slow" style={{ backgroundColor: colors.accent, boxShadow: colors.dotShadow }}></div>
                                <span className={`${T.text} font-medium text-sm truncate`}>{sub?.subjectName}</span>
                              </div>

                              <button
                                disabled={isRemoving}
                                onClick={() => handleRemoveFromToday(id)}
                                className={`px-2 sm:px-3 py-1.5 rounded-lg border text-xs transition-all duration-300 shrink-0 ${
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
                        <div className="text-center py-8 sm:py-12 px-4 border rounded-xl transition-all duration-300" style={cardStyle}>
                          <svg className="w-10 h-10 sm:w-12 sm:h-12 text-gray-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <p className={`${T.textMuted} text-xs sm:text-sm`}>No classes scheduled</p>
                          <p className="text-gray-600 text-xs mt-1">Add subjects from the list</p>
                        </div>
                      )}

                    </div>

                    {/* Publish Button with Professional Loader */}
                    <button
                      disabled={actionLoading.publish || published}
                      onClick={publishSchedule}
                      className={`w-full ${T.text} px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl font-medium shadow-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base relative overflow-hidden ${
                        actionLoading.publish
                          ? "bg-linear-to-br from-[#10B981]/50 to-[#059669]/50 cursor-not-allowed"
                          : published
                          ? "bg-linear-to-br from-[#10B981]/50 to-[#059669]/50 cursor-not-allowed"
                          : "bg-linear-to-br from-[#10B981] to-[#059669] shadow-[#10B981]/30 hover:shadow-[#10B981]/50 hover:scale-105"
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
