"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  setDoc,
  onSnapshot
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Calendar, TrendingUp, Book, CheckCircle, Clock, Award, BarChart3, User, LogOut, Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

export default function StudentDashboard() {

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
    navText: isDark ? 'text-gray-500' : 'text-slate-400',
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

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  const [allSubjects, setAllSubjects] = useState([]);
  const [todaySubjects, setTodaySubjects] = useState([]);

  const [markedSubjects, setMarkedSubjects] = useState([]);
  const [attendancePercent, setAttendancePercent] = useState(0);

  const [subjectStats, setSubjectStats] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);

  const [marking, setMarking] = useState({});
  const [undoing, setUndoing] = useState({});
  const [updating, setUpdating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSafeBunkModal, setShowSafeBunkModal] = useState(false);
  const [showJoinCodeModal, setShowJoinCodeModal] = useState(false);
  const [showSubjectAttendanceModal, setShowSubjectAttendanceModal] = useState(false);
  const [showSubjectsOverviewModal, setShowSubjectsOverviewModal] = useState(false);
  const [showTodayClassesModal, setShowTodayClassesModal] = useState(false);
  const [showMonthlyChartModal, setShowMonthlyChartModal] = useState(false);
  const [newJoinCode, setNewJoinCode] = useState("");
  const [changingClass, setChangingClass] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [safeBunkData, setSafeBunkData] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [monthlyData, setMonthlyData] = useState([]);

  const menuButtonRef = useRef(null);
  const firstMenuItemRef = useRef(null);
  const firstRender = useRef(true);

  const today = new Date().toISOString().split("T")[0];

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Get attendance color and status
  const getAttendanceStatus = (percent) => {
    if (percent >= 75) return { 
      color: 'text-[#10B981]', 
      bgGradient: 'from-[#10B981]/20 to-[#059669]/20',
      borderColor: 'border-[#10B981]/50',
      glowColor: 'shadow-[#10B981]/30',
      status: 'Excellent',
      icon: '🎯'
    };
    if (percent >= 50) return { 
      color: 'text-[#F59E0B]', 
      bgGradient: 'from-[#F59E0B]/20 to-[#D97706]/20',
      borderColor: 'border-[#F59E0B]/50',
      glowColor: 'shadow-[#F59E0B]/30',
      status: 'Good',
      icon: '⚠️'
    };
    return { 
      color: 'text-[#EF4444]', 
      bgGradient: 'from-[#EF4444]/20 to-[#DC2626]/20',
      borderColor: 'border-[#EF4444]/50',
      glowColor: 'shadow-[#EF4444]/30',
      status: 'Needs Improvement',
      icon: '📉'
    };
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/student/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const fetchJoinCode = async (classId) => {
    const classDoc = await getDoc(doc(db, "classes", classId));
    if (classDoc.exists()) {
      setJoinCode(classDoc.data().joinCode || "N/A");
    }
  };

  const calculateSafeBunk = () => {
    const targetPercent = 75;
    const bunkData = subjectStats.map(subject => {
      const { total, present, name, id } = subject;
      const currentPercent = total === 0 ? 0 : (present / total) * 100;

      if (currentPercent >= targetPercent) {
        // Calculate how many classes can be bunked
        // (present / (total + x)) * 100 = 75
        // present / (total + x) = 0.75
        // present = 0.75 * (total + x)
        // present = 0.75*total + 0.75*x
        // present - 0.75*total = 0.75*x
        // x = (present - 0.75*total) / 0.75
        const canBunk = Math.floor((present - 0.75 * total) / 0.75);
        return {
          id,
          name,
          total,
          present,
          currentPercent: currentPercent.toFixed(1),
          canBunk: canBunk > 0 ? canBunk : 0,
          needToAttend: 0,
          status: 'safe'
        };
      } else {
        // Calculate how many classes need to attend
        // (present + x) / (total + x) = 0.75
        // present + x = 0.75 * (total + x)
        // present + x = 0.75*total + 0.75*x
        // x - 0.75*x = 0.75*total - present
        // 0.25*x = 0.75*total - present
        // x = (0.75*total - present) / 0.25
        const needToAttend = Math.ceil((0.75 * total - present) / 0.25);
        return {
          id,
          name,
          total,
          present,
          currentPercent: currentPercent.toFixed(1),
          canBunk: 0,
          needToAttend: needToAttend > 0 ? needToAttend : 0,
          status: 'danger'
        };
      }
    });

    setSafeBunkData(bunkData);
    setShowSafeBunkModal(true);
  };

  const handleChangeClass = async () => {
    if (!newJoinCode.trim()) return;
    
    setChangingClass(true);
    try {
      // Find class with this join code
      const classesSnapshot = await getDocs(collection(db, "classes"));
      let foundClassId = null;

      classesSnapshot.docs.forEach(doc => {
        if (doc.data().joinCode === newJoinCode.trim()) {
          foundClassId = doc.id;
        }
      });

      if (!foundClassId) {
        alert("Invalid join code");
        setChangingClass(false);
        return;
      }

      // Update user's classId
      const user = auth.currentUser;
      await setDoc(doc(db, "users", user.uid), {
        classId: foundClassId
      }, { merge: true });

      // Refresh page
      window.location.reload();
    } catch (error) {
      console.error("Error changing class:", error);
      alert("Failed to change class");
      setChangingClass(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent body scroll when sidebar or modals are open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [sidebarOpen]);

  // Close sidebar on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Focus management for accessibility
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    if (sidebarOpen) {
      const timer = setTimeout(() => {
        firstMenuItemRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      menuButtonRef.current?.focus();
    }
  }, [sidebarOpen]);

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

      // Fetch all initial data in parallel for maximum speed
      await Promise.all([
        fetchAllSubjects(classId),
        fetchAttendanceHistory(classId, user.uid),
        fetchWeeklyAttendance(classId, user.uid),
        fetchMonthlyAttendance(classId, user.uid),
        fetchJoinCode(classId)
      ]);

      // Set up real-time listeners after initial data load
      listenToSchedule(classId);
      listenToTodayAttendance(classId, user.uid);

      setLoading(false);
  
    });
  
    return () => unsubscribe();
  
  }, []);

  async function fetchAllSubjects(classId) {

    const snapshot = await getDocs(
      collection(db, "classes", classId, "subjects")
    );

    const subjects = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    setAllSubjects(subjects);

  }

  async function fetchWeeklyAttendance(classId, studentId) {
    try {
      const scheduleSnapshot = await getDocs(
        collection(db, "classes", classId, "dailySchedule")
      );

      const sortedDates = scheduleSnapshot.docs
        .map(doc => doc.id)
        .sort()
        .slice(-7); // Last 7 days

      // Batch fetch all schedule and attendance documents in parallel
      const schedulePromises = sortedDates.map(date =>
        getDoc(doc(db, "classes", classId, "dailySchedule", date))
      );
      const attendancePromises = sortedDates.map(date =>
        getDoc(doc(db, "classes", classId, "attendance", date, "students", studentId))
      );

      const [scheduleDocs, attendanceDocs] = await Promise.all([
        Promise.all(schedulePromises),
        Promise.all(attendancePromises)
      ]);

      const weeklyStats = [];

      for (let i = 0; i < sortedDates.length; i++) {
        const date = sortedDates[i];
        const scheduleDoc = scheduleDocs[i];
        const attendanceDoc = attendanceDocs[i];

        const scheduled = scheduleDoc.data()?.subjects || [];
        const attended = attendanceDoc.data()?.subjects || [];

        const dateObj = new Date(date);
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        const dayDate = dateObj.getDate();

        weeklyStats.push({
          day: dayName,
          date: dayDate,
          classes: attended.length,
          scheduled: scheduled.length
        });
      }

      setWeeklyData(weeklyStats);
    } catch (error) {
      console.error("Error fetching weekly attendance:", error);
    }
  }

  async function fetchMonthlyAttendance(classId, studentId) {
    try {
      const scheduleSnapshot = await getDocs(
        collection(db, "classes", classId, "dailySchedule")
      );

      const sortedDates = scheduleSnapshot.docs
        .map(doc => doc.id)
        .sort()
        .slice(-30); // Last 30 days

      // Batch fetch all schedule and attendance documents in parallel
      const schedulePromises = sortedDates.map(date =>
        getDoc(doc(db, "classes", classId, "dailySchedule", date))
      );
      const attendancePromises = sortedDates.map(date =>
        getDoc(doc(db, "classes", classId, "attendance", date, "students", studentId))
      );

      const [scheduleDocs, attendanceDocs] = await Promise.all([
        Promise.all(schedulePromises),
        Promise.all(attendancePromises)
      ]);

      const monthlyStats = [];

      for (let i = 0; i < sortedDates.length; i++) {
        const date = sortedDates[i];
        const scheduleDoc = scheduleDocs[i];
        const attendanceDoc = attendanceDocs[i];

        const scheduled = scheduleDoc.data()?.subjects || [];
        const attended = attendanceDoc.data()?.subjects || [];

        const dateObj = new Date(date);
        const dayName = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        monthlyStats.push({
          day: dayName,
          scheduled: scheduled.length,
          attended: attended.length,
          percentage: scheduled.length > 0 ? ((attended.length / scheduled.length) * 100).toFixed(0) : 0
        });
      }

      setMonthlyData(monthlyStats);
    } catch (error) {
      console.error("Error fetching monthly attendance:", error);
    }
  }

  function listenToSchedule(classId) {

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

  }

  function listenToTodayAttendance(classId, studentId) {

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

  }

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
    await fetchWeeklyAttendance(userData.classId, user.uid);

    setUpdating(false);

  };

  async function fetchAttendanceHistory(classId, studentId) {
    try {
      // Fetch all data in parallel for maximum speed
      const [scheduleSnapshot, subjectsSnapshot] = await Promise.all([
        getDocs(collection(db, "classes", classId, "dailySchedule")),
        getDocs(collection(db, "classes", classId, "subjects"))
      ]);

      // Build stats object from subjects
      let stats = {};
      subjectsSnapshot.docs.forEach(doc => {
        stats[doc.id] = {
          name: doc.data().subjectName,
          total: 0,
          present: 0
        };
      });

      // Get all schedule dates
      const scheduleDocs = scheduleSnapshot.docs;
      const dates = scheduleDocs.map(doc => doc.id);

      // Batch fetch all attendance documents for this student in parallel
      const attendancePromises = dates.map(date =>
        getDoc(doc(db, "classes", classId, "attendance", date, "students", studentId))
      );

      const attendanceDocs = await Promise.all(attendancePromises);

      // Process all data in a single pass
      let totalScheduled = 0;
      let totalPresent = 0;

      scheduleDocs.forEach((scheduleDoc, index) => {
        const scheduled = scheduleDoc.data()?.subjects || [];
        totalScheduled += scheduled.length;

        scheduled.forEach(id => {
          if (stats[id]) stats[id].total++;
        });

        const attendanceDoc = attendanceDocs[index];
        if (attendanceDoc.exists()) {
          const present = attendanceDoc.data()?.subjects || [];
          totalPresent += present.length;

          present.forEach(id => {
            if (stats[id]) stats[id].present++;
          });
        }
      });

      const percent = totalScheduled === 0 ? 0 : ((totalPresent / totalScheduled) * 100).toFixed(2);
      setAttendancePercent(percent);

      const formatted = Object.keys(stats).map(id => {
        const total = stats[id].total;
        const present = stats[id].present;
        const percent = total === 0 ? 0 : ((present / total) * 100).toFixed(1);

        return {
          id,
          name: stats[id].name,
          total,
          present,
          percent
        };
      });

      setSubjectStats(formatted);

      // Auto-calculate safe bunk data
      const targetPercent = 75;
      const bunkData = formatted.map(subject => {
        const { total, present, name, id, percent } = subject;
        const currentPercent = parseFloat(percent);

        if (currentPercent >= targetPercent) {
          const canBunk = Math.floor((present - 0.75 * total) / 0.75);
          return {
            id,
            name,
            total,
            present,
            currentPercent: currentPercent.toFixed(1),
            canBunk: canBunk > 0 ? canBunk : 0,
            needToAttend: 0,
            status: 'safe'
          };
        } else {
          const needToAttend = Math.ceil((0.75 * total - present) / 0.25);
          return {
            id,
            name,
            total,
            present,
            currentPercent: currentPercent.toFixed(1),
            canBunk: 0,
            needToAttend: needToAttend > 0 ? needToAttend : 0,
            status: 'danger'
          };
        }
      });

      setSafeBunkData(bunkData);
    } catch (error) {
      console.error("Error fetching attendance history:", error);
    }
  }

  const subjectColors = [
    { bg: 'bg-[#00D9FF]', text: isDark ? 'text-[#00D9FF]' : 'text-[#0891b2]', border: 'border-[#00D9FF]', glow: 'shadow-[#00D9FF]/20' },
    { bg: 'bg-[#7C3AED]', text: isDark ? 'text-[#7C3AED]' : 'text-[#6d28d9]', border: 'border-[#7C3AED]', glow: 'shadow-[#7C3AED]/20' },
    { bg: 'bg-[#F59E0B]', text: isDark ? 'text-[#F59E0B]' : 'text-[#d97706]', border: 'border-[#F59E0B]', glow: 'shadow-[#F59E0B]/20' },
    { bg: 'bg-[#10B981]', text: isDark ? 'text-[#10B981]' : 'text-[#059669]', border: 'border-[#10B981]', glow: 'shadow-[#10B981]/20' },
    { bg: 'bg-[#EC4899]', text: isDark ? 'text-[#EC4899]' : 'text-[#db2777]', border: 'border-[#EC4899]', glow: 'shadow-[#EC4899]/20' },
  ];

  const getSubjectColor = (index) => subjectColors[index % subjectColors.length];
  const attendanceStatus = getAttendanceStatus(parseFloat(attendancePercent));
  const maxClasses = Math.max(...weeklyData.map(d => d.classes), 1);

  // Calculate weekly attendance trend from monthly data
  const weeklyTrend = useMemo(() => {
    if (!mounted || monthlyData.length === 0) return [];
    const weeks = [];
    // Process from newest to oldest
    for (let i = monthlyData.length - 1; i >= 0; i -= 7) {
      const startIdx = Math.max(i - 6, 0);
      const weekSlice = monthlyData.slice(startIdx, i + 1);
      const totalPct = weekSlice.reduce((sum, day) => sum + parseFloat(day.percentage), 0);
      const avgPct = totalPct / weekSlice.length;
      // Use the most recent date in this week as label
      const label = weekSlice[weekSlice.length - 1].day;
      weeks.push({
        label,
        percentage: avgPct
      });
    }
    // Reverse to show oldest first (chronological left to right)
    return weeks.reverse();
  }, [monthlyData, mounted]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: T.page }}>
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00D9FF]/10 rounded-full blur-[100px] animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#7C3AED]/10 rounded-full blur-[100px] animate-float-delayed"></div>
        </div>

        <div className="text-center relative z-10">
          {/* Modern Multi-Ring Loader */}
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 border-4 border-transparent border-t-[#00D9FF] border-r-[#7C3AED] rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
            <div className="absolute inset-2 border-4 border-transparent border-b-[#10B981] border-l-[#F59E0B] rounded-full animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}></div>
            <div className="absolute inset-4 bg-gradient-to-br from-[#00D9FF] to-[#7C3AED] rounded-full animate-pulse opacity-80"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`w-4 h-4 rounded-full shadow-lg shadow-[#00D9FF]/50 animate-bounce-slow ${isDark ? 'bg-white' : 'bg-slate-900'}`}></div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D9FF] via-[#7C3AED] to-[#10B981] text-xl font-bold animate-gradient" style={{ backgroundSize: '200% 200%' }}>
              Loading Your Dashboard
            </p>
            <p className={`text-sm ${T.textSubtle}`}>Fetching your attendance data...</p>
          </div>

          <div className="flex justify-center gap-2 mt-6">
            <div className="w-2 h-2 bg-[#00D9FF] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-[#7C3AED] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-[#10B981] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (

    <div className={`min-h-screen p-3 sm:p-5 lg:p-8 relative overflow-hidden`} style={{ backgroundColor: T.page, color: isDark ? 'rgb(226,232,240)' : 'rgb(51, 65, 85)' }}>

      {/* Animated Background */}
      <div className="absolute top-[-100px] right-[-100px] w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] bg-[#00D9FF]/5 rounded-full blur-[100px] animate-float"></div>
      <div className="absolute bottom-[-150px] left-[-150px] w-[350px] h-[350px] sm:w-[500px] sm:h-[500px] bg-[#7C3AED]/5 rounded-full blur-[120px] animate-float-delayed"></div>
      <div className="absolute top-1/2 left-1/2 w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] bg-[#10B981]/5 rounded-full blur-[100px] animate-pulse-slow"></div>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      ></div>

      {/* Sidebar */}
      <nav
        className={`fixed inset-y-0 left-0 w-80 max-w-full bg-gradient-to-br from-[#0F1629] to-[#0A0E27] border-r border-[#1A1F3A] z-50 flex flex-col transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${!sidebarOpen ? 'pointer-events-none' : ''}`}
        aria-label="Main navigation"
        aria-hidden={!sidebarOpen}
      >
        {/* Sidebar Header with Close Button */}
        <div className="p-3 border-b border-[#1A1F3A] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-[#00D9FF] to-[#7C3AED] rounded-xl flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-medium text-xs truncate">{userData?.name}</p>
              <p className="text-gray-500 text-[10px] truncate">{userData?.email}</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-2.5">Navigation</p>

          {/* Calendar */}
          <button
            ref={firstMenuItemRef}
            onClick={() => {
              router.push("/student/calender");
              setSidebarOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white/5 hover:bg-[#7C3AED]/20 border border-transparent hover:border-[#7C3AED]/30 transition-all duration-200"
          >
            <Calendar className="w-4 h-4 text-[#7C3AED]" />
            <span className="text-white text-sm">Calendar</span>
          </button>

          {/* Safe Bunk */}
          <button
            onClick={() => {
              calculateSafeBunk();
              setSidebarOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white/5 hover:bg-[#F59E0B]/20 border border-transparent hover:border-[#F59E0B]/30 transition-all duration-200"
          >
            <TrendingUp className="w-4 h-4 text-[#F59E0B]" />
            <span className="text-white text-sm">Safe Bunk</span>
          </button>

          {/* Subjects Overview */}
          <button
            onClick={() => {
              setShowSubjectsOverviewModal(true);
              setSidebarOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white/5 hover:bg-[#00D9FF]/20 border border-transparent hover:border-[#00D9FF]/30 transition-all duration-200"
          >
            <BarChart3 className="w-4 h-4 text-[#00D9FF]" />
            <span className="text-white text-sm">Subjects Overview</span>
          </button>

          {/* Today's Schedule */}
          <button
            onClick={() => {
              setShowTodayClassesModal(true);
              setSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg ${isDark ? 'bg-white/5 hover:bg-[#10B981]/20 border border-transparent hover:border-[#10B981]/30' : 'bg-slate-100 hover:bg-[#10B981]/20 border border-slate-200 hover:border-[#10B981]/30'} transition-all duration-200`}
          >
            <CheckCircle className="w-4 h-4 text-[#10B981]" />
            <span className={`${isDark ? 'text-white' : 'text-slate-900'} text-sm`}>Today's Schedule</span>
          </button>
        </div>

        {/* Divider */}
        <div className={`border-t ${isDark ? 'border-[#1A1F3A]' : 'border-slate-200'} mx-3`}></div>

        {/* Theme Toggle */}
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isDark ? <Moon className="w-4 h-4 text-gray-400" /> : <Sun className="w-4 h-4 text-yellow-500" />}
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{isDark ? 'Dark' : 'Light'} Mode</span>
          </div>
          <button
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${isDark ? 'bg-[#2A2F4A]' : 'bg-slate-300'}`}
          >
            <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${isDark ? 'translate-x-6' : 'translate-x-0'}`}></div>
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-[#1A1F3A] mx-3"></div>

        {/* User Actions */}
        <div className="p-3 space-y-2">
          {/* Join Code */}
          <div className="bg-[#00D9FF]/10 border border-[#00D9FF]/20 rounded-lg p-2.5">
            <p className="text-gray-500 text-[10px] mb-1">Class Join Code</p>
            <div className="flex items-center gap-1.5">
              <code className="flex-1 bg-[#00D9FF]/5 text-[#00D9FF] px-2 py-1 rounded text-[10px] font-mono">
                {joinCode}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(joinCode);
                  alert("Join code copied!");
                  setSidebarOpen(false);
                }}
                className="p-1 hover:bg-white/5 rounded transition-colors"
                title="Copy"
              >
                📋
              </button>
            </div>
          </div>

          {/* Change Class */}
          <button
            onClick={() => {
              setShowJoinCodeModal(true);
              setSidebarOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-gradient-to-r from-[#00D9FF]/10 to-[#7C3AED]/10 text-[#00D9FF] hover:from-[#00D9FF]/20 hover:to-[#7C3AED]/20 border border-[#00D9FF]/10 hover:border-[#00D9FF]/30 transition-all duration-200"
          >
            <Book className="w-4 h-4" />
            <span className="text-sm font-medium">Change Class</span>
          </button>

          {/* Logout */}
          <button
            onClick={() => {
              handleLogout();
              setSidebarOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-gradient-to-r from-red-500/10 to-red-600/10 text-red-400 hover:from-red-500/20 hover:to-red-600/20 border border-red-500/10 hover:border-red-400/30 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto relative z-10">

        {/* Header */}
        <div className="flex flex-row justify-between items-center gap-3 mb-8 sm:mb-12">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-br from-[#00D9FF] to-[#7C3AED] rounded-xl flex items-center justify-center shadow-lg shadow-[#00D9FF]/30 hover:scale-110 hover:rotate-12 transition-all duration-300 flex-shrink-0">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className={`text-xl sm:text-2xl md:text-3xl font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>Student Dashboard</h1>
              {mounted && (
                <p className={`text-xs sm:text-sm font-medium truncate ${isDark ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#00D9FF] to-[#7C3AED]' : 'text-slate-600'}`}>
                  {getGreeting()}, {userData?.name}!
                </p>
              )}
            </div>
          </div>

          {/* Hamburger Menu Button */}
          <div className="relative flex-shrink-0">
            <button
              ref={menuButtonRef}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? "Close menu" : "Open menu"}
              className={`w-10 h-10 sm:w-12 sm:h-12 ${isDark ? 'bg-gradient-to-br from-[#00D9FF] to-[#7C3AED] border-none' : 'bg-gradient-to-br from-blue-500 to-indigo-600 border border-blue-400/30'} rounded-full flex items-center justify-center ${isDark ? 'text-white' : 'text-white'} shadow-lg ${isDark ? 'shadow-[#00D9FF]/30' : 'shadow-blue-500/30'} hover:scale-110 transition-all duration-200`}
            >
              {sidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-12 gap-2 sm:gap-4 mb-4">

          {/* Overall Attendance Card - ENHANCED */}
          <div
            onClick={() => setShowSubjectAttendanceModal(true)}
            className={`col-span-2 sm:col-span-2 lg:col-span-6 ${isDark ? 'bg-gradient-to-br from-blue-900/60 to-indigo-900/60 border border-blue-500/30' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50'} rounded-xl p-4 relative overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group cursor-pointer`}
          >

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 ${isDark ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-white border border-blue-200'} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform backdrop-blur-sm`}>
                    <Award className={`w-4 h-4 ${isDark ? 'text-[#00D9FF]' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <p className={`text-xs ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Overall</p>
                    <p className={`text-[10px] ${isDark ? 'text-blue-400/70' : 'text-blue-600'}`}>{attendanceStatus.status}</p>
                  </div>
                </div>
                <span className="text-xl">{attendanceStatus.icon}</span>
              </div>

              <p className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-3`}>
                {attendancePercent}%
              </p>

              <div className={`w-full ${isDark ? 'bg-slate-800/50' : 'bg-slate-200'} h-2 rounded-full overflow-hidden mb-2`}>
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${
                    parseFloat(attendancePercent) >= 75
                      ? isDark ? 'bg-[#10B981]' : 'bg-green-500'
                      : parseFloat(attendancePercent) >= 50
                        ? isDark ? 'bg-[#F59E0B]' : 'bg-amber-500'
                        : isDark ? 'bg-[#EF4444]' : 'bg-red-500'
                  }`}
                  style={{ width: `${attendancePercent}%` }}
                ></div>
              </div>
              <p className={`text-[10px] ${isDark ? 'text-blue-400/60' : 'text-blue-500'} text-center`}>Target: 75% | Click for details</p>
            </div>
          </div>

          {/* Weekly Trend Card - Cartesian Line Chart */}
          <div className={`col-span-2 sm:col-span-2 lg:col-span-6 ${isDark ? 'bg-gradient-to-br from-blue-900/60 to-indigo-900/60 border border-blue-500/30' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50'} rounded-xl p-4 relative overflow-hidden`}>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className={`w-4 h-4 ${isDark ? 'text-[#00D9FF]' : 'text-blue-600'}`} />
              <h3 className={`text-xs font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>Weekly Attendance Trend</h3>
            </div>
            {mounted && weeklyTrend.length > 0 ? (
              <div className="relative">
                {/* Y-axis labels */}
                <div className={`absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[8px] pr-1`} style={{ height: '96px' }}>
                  <span className={isDark ? 'text-blue-300' : 'text-blue-700'}>100%</span>
                  <span className={isDark ? 'text-blue-300' : 'text-blue-700'}>75%</span>
                  <span className={isDark ? 'text-blue-300' : 'text-blue-700'}>50%</span>
                  <span className={isDark ? 'text-blue-300' : 'text-blue-700'}>25%</span>
                  <span className={isDark ? 'text-blue-300' : 'text-blue-700'}>0%</span>
                </div>

                {/* Chart area */}
                <div className="ml-10 relative" style={{ height: '96px' }}>
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex flex-col justify-between">
                    <div className={`w-full h-px ${isDark ? 'bg-blue-500/20' : 'bg-blue-200'}`}></div>
                    <div className={`w-full h-px ${isDark ? 'bg-blue-500/20' : 'bg-blue-200'}`}></div>
                    <div className={`w-full h-px ${isDark ? 'bg-blue-500/20' : 'bg-blue-200'}`}></div>
                    <div className={`w-full h-px ${isDark ? 'bg-blue-500/20' : 'bg-blue-200'}`}></div>
                    <div className={`w-full h-px ${isDark ? 'bg-blue-500/20' : 'bg-blue-200'}`}></div>
                  </div>

                  {/* 75% target line */}
                  <div className={`absolute left-0 right-0 border-t border-dashed ${isDark ? 'border-[#10B981]/40' : 'border-green-500/40'}`} style={{ top: '25%' }}></div>

                  {/* SVG Line Chart */}
                  <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                    {/* Defs for gradient */}
                    <defs>
                      <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#00D9FF" />
                        <stop offset="100%" stopColor="#7C3AED" />
                      </linearGradient>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#00D9FF" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {(() => {
                      const chartWidth = 100;
                      const chartHeight = 100;
                      const points = weeklyTrend.map((week, i) => {
                        const x = (i / (weeklyTrend.length - 1 || 1)) * chartWidth;
                        const y = chartHeight - week.percentage;
                        return { x, y, label: week.label, percentage: week.percentage };
                      });

                      if (points.length === 1) {
                        return (
                          <>
                            <line
                              x1={`${points[0].x}%`} y1={0} x2={`${points[0].x}%`} y2="100%"
                              stroke="#1A1F3A" strokeWidth="0.3" strokeDasharray="2"
                            />
                            <circle
                              cx={`${points[0].x}%`} cy={`${points[0].y}%`} r="4"
                              fill="#00D9FF" stroke="#7C3AED" strokeWidth="1.5"
                            />
                          </>
                        );
                      }

                      const linePath = points
                        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x}% ${p.y}%`)
                        .join(" ");

                      const areaPath = linePath + `L ${points[points.length - 1].x}% 100% L ${points[0].x}% 100% Z`;

                      return (
                        <>
                          {/* Area fill */}
                          <path d={areaPath} fill="url(#areaGrad)" />
                          {/* Line */}
                          <path d={linePath} fill="none" stroke="url(#lineGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          {/* Data points */}
                          {points.map((p, i) => (
                            <g key={i}>
                              <circle
                                cx={`${p.x}%`} cy={`${p.y}%`} r="3"
                                fill="#0F1629" stroke="#00D9FF" strokeWidth="2"
                              />
                              <title>{p.label}: {p.percentage.toFixed(1)}%</title>
                            </g>
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                </div>

                {/* X-axis labels */}
                <div className="ml-10 flex justify-between text-[7px] text-gray-500 mt-1">
                  {weeklyTrend.map((week, i) => (
                    <span key={i} className="text-center truncate">{week.label}</span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-24 flex items-center justify-center text-gray-600 text-xs">
                No weekly data yet
              </div>
            )}
          </div>

          {/* Safe Bunk Card */}
          <div
            onClick={calculateSafeBunk}
            className={`lg:col-span-6 ${isDark ? 'bg-gradient-to-br from-amber-900/60 to-orange-900/60 border border-amber-500/30 hover:border-amber-500/50' : 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-300/50 hover:border-amber-400'} rounded-xl p-4 relative overflow-hidden transition-all duration-300 hover:scale-[1.02] group cursor-pointer`}
          >
            <div className={`absolute top-0 right-0 w-16 h-16 ${isDark ? 'bg-amber-500/10' : 'bg-amber-500/15'} rounded-full blur-xl group-hover:bg-amber-500/20 transition-all duration-300`}></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 ${isDark ? 'bg-amber-500/20 border border-amber-500/30' : 'bg-white border border-amber-200'} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <TrendingUp className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                </div>
                <div>
                  <p className={`text-xs ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>Safe Bunk</p>
                </div>
              </div>
              <p className={`text-2xl font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                {safeBunkData.filter(s => s.status === 'safe').reduce((sum, s) => sum + s.canBunk, 0)}
              </p>
              <p className={`text-[10px] ${isDark ? 'text-amber-300/70' : 'text-amber-700'} mt-1`}>classes you can skip</p>
            </div>
          </div>

          {/* Today's Classes Card */}
          <div
            onClick={() => {
              const el = document.getElementById('mark-attendance-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`lg:col-span-6 ${isDark ? 'bg-gradient-to-br from-emerald-900/60 to-teal-900/60 border border-emerald-500/30 hover:border-emerald-500/50' : 'bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-300/50 hover:border-emerald-400'} rounded-xl p-4 relative overflow-hidden transition-all duration-300 hover:scale-[1.02] group cursor-pointer`}
          >
            <div className={`absolute top-0 right-0 w-16 h-16 ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-500/15'} rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all duration-300`}></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 ${isDark ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-white border border-emerald-200'} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Clock className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                </div>
                <div>
                  <p className={`text-xs ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Today's Classes</p>
                </div>
              </div>
              <p className={`text-2xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{todaySubjects.length}</p>
              <p className={`text-[10px] ${isDark ? 'text-emerald-300/70' : 'text-emerald-700'} mt-1`}>scheduled today</p>
            </div>
          </div>
        </div>


        {/* Today's Classes - Mark Attendance */}
        <div className="mb-8" id="mark-attendance-section">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-5 h-5 ${isDark ? 'text-[#10B981]' : 'text-green-600'}`} />
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Today's Classes</h2>
              {mounted && (
                <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
                  ({new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
                </span>
              )}
            </div>
          </div>

          {todaySubjects.length === 0 ? (
            <div className={`${isDark ? 'bg-gradient-to-br from-[#0F1629] to-[#0A0E27] border border-[#1A1F3A]' : 'bg-white border border-slate-200'} rounded-xl p-8 text-center`}>
              <Clock className={`w-12 h-12 ${isDark ? 'text-gray-700' : 'text-slate-400'} mx-auto mb-3`} />
              <p className={`${isDark ? 'text-gray-500' : 'text-slate-500'}`}>No classes scheduled today</p>
              <p className={`${isDark ? 'text-gray-600' : 'text-slate-600'} text-sm mt-1`}>Enjoy your day off!</p>
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {todaySubjects.map((subjectId, index) => {
                  const subject = allSubjects.find(s => s.id === subjectId);
                  const marked = markedSubjects.includes(subjectId);
                  const colors = getSubjectColor(index);
                  const isMarking = marking[subjectId];
                  const isUndoing = undoing[subjectId];

                  return (
                    <div
                      key={subjectId}
                      className={`${isDark ? 'bg-gradient-to-br from-[#0A0E27] to-[#0F1629]' : 'bg-slate-50'} border-l-4 ${colors.border} rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3 hover:scale-[1.01] transition-all duration-300`}
                    >
                      <div
                        className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 cursor-pointer"
                        onClick={() => router.push(`/student/subject/${subjectId}`)}
                      >
                        <div className={`w-2 h-2 rounded-full ${colors.bg} ${colors.glow} shadow-lg animate-pulse-slow flex-shrink-0`}></div>
                        <span className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{subject?.subjectName}</span>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        {marked ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUndoAttendance(subjectId, e);
                            }}
                            disabled={isUndoing}
                            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg font-medium transition-all duration-300 flex items-center gap-1.5 text-xs ${
                              isUndoing
                                ? `${isDark ? 'bg-red-500/20 text-red-400/50' : 'bg-red-500/20 text-red-400/50'} cursor-not-allowed`
                                : `${isDark ? 'bg-red-500/10 text-red-400 border border-red-400/20 hover:bg-red-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/30 hover:bg-red-500/20'}`
                            }`}
                          >
                            {isUndoing ? (
                              <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              'Undo'
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAttendance(subjectId, e);
                            }}
                            disabled={isMarking}
                            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg font-medium transition-all duration-300 flex items-center gap-1.5 text-xs ${
                              isMarking
                                ? `${isDark ? 'bg-[#00D9FF]/20 text-[#00D9FF]/50' : 'bg-blue-500/20 text-blue-500/50'} cursor-not-allowed`
                                : `${isDark ? 'bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/20 hover:bg-[#00D9FF]/20' : 'bg-blue-500/10 text-blue-600 border border-blue-500/30 hover:bg-blue-500/20'}`
                            }`}
                          >
                            {isMarking ? (
                              <div className="w-3 h-3 border-2 border-[#00D9FF] border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                Mark
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {todaySubjects.length > 0 && (
                <button
                  onClick={updateAttendance}
                  disabled={updating}
                  className={`w-full px-6 py-3 rounded-xl font-medium shadow-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                    updating
                      ? "bg-gradient-to-r from-[#10B981]/50 to-[#059669]/50 cursor-not-allowed"
                      : "bg-gradient-to-r from-[#10B981] to-[#059669] text-white shadow-[#10B981]/30 hover:shadow-[#10B981]/50"
                  }`}
                >
                  {updating ? (
                    <>
                      <div className="relative w-4 h-4">
                        <div className="absolute inset-0 border-2 border-white/20 rounded-full"></div>
                        <div className="absolute inset-0 border-2 border-transparent border-t-white rounded-full animate-spin"></div>
                      </div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4" />
                      Update Attendance
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </div>

      </div>

      {/* Safe Bunk Modal */}
      {showSafeBunkModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => setShowSafeBunkModal(false)}>
          <div className="bg-gradient-to-br from-[#0F1629] to-[#0A0E27] border border-[#1A1F3A] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="p-4 border-b border-[#1A1F3A] bg-gradient-to-r from-[#F59E0B]/10 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-[#F59E0B]/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-[#F59E0B]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Safe Bunk Calculator</h2>
                    <p className="text-xs text-gray-400">Maintain 75% attendance target</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSafeBunkModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-[#10B981]/10 border border-[#10B981]/20 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Total Safe Bunks</p>
                  <p className="text-xl font-bold text-[#10B981]">
                    {safeBunkData.filter(s => s.status === 'safe').reduce((sum, s) => sum + s.canBunk, 0)}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">Classes you can skip</p>
                </div>
                <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Need to Attend</p>
                  <p className="text-xl font-bold text-[#EF4444]">
                    {safeBunkData.filter(s => s.status === 'danger').reduce((sum, s) => sum + s.needToAttend, 0)}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">To reach 75%</p>
                </div>
              </div>
            </div>

            {/* Subject List */}
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-240px)]">
              <div className="space-y-2">
                {safeBunkData.map((subject, index) => {
                  const colors = getSubjectColor(index);
                  const isSafe = subject.status === 'safe';

                  return (
                    <div
                      key={subject.id}
                      className={`bg-gradient-to-br from-[#0A0E27] to-[#0F1629] border ${colors.border} border-l-4 rounded-lg p-3 hover:scale-[1.01] transition-all duration-300`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-2 h-2 rounded-full ${colors.bg} animate-pulse-slow`}></div>
                            <h3 className="text-white font-medium text-sm">{subject.name}</h3>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span>Attendance: <span className={colors.text}>{subject.currentPercent}%</span></span>
                            <span>•</span>
                            <span>{subject.present}/{subject.total} attended</span>
                          </div>
                        </div>

                        {isSafe ? (
                          <div className="bg-[#10B981]/10 border border-[#10B981]/20 rounded-lg px-3 py-1.5 text-center">
                            <p className="text-lg font-bold text-[#10B981]">{subject.canBunk}</p>
                            <p className="text-[10px] text-gray-400">can bunk</p>
                          </div>
                        ) : (
                          <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg px-3 py-1.5 text-center">
                            <p className="text-lg font-bold text-[#EF4444]">+{subject.needToAttend}</p>
                            <p className="text-[10px] text-gray-400">need to attend</p>
                          </div>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="relative w-full bg-[#1A1F3A] h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colors.bg} rounded-full transition-all duration-1000`}
                          style={{ width: `${subject.currentPercent}%` }}
                        ></div>
                        {/* 75% marker */}
                        <div className="absolute top-0 left-[75%] w-0.5 h-full bg-white/50"></div>
                      </div>

                      {!isSafe && (
                        <p className="text-[10px] text-[#EF4444] mt-1.5">
                          ⚠️ Attend next {subject.needToAttend} classes consecutively to reach 75%
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#1A1F3A] bg-gradient-to-r from-[#00D9FF]/5 to-transparent">
              <p className="text-xs text-gray-400 text-center">
                💡 <span className="text-[#00D9FF]">Tip:</span> This calculation assumes you attend all remaining classes for subjects below 75%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Subject-wise Attendance Modal */}
      {showSubjectAttendanceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => setShowSubjectAttendanceModal(false)}>
          <div className="bg-gradient-to-br from-[#0F1629] to-[#0A0E27] border border-[#1A1F3A] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="p-4 border-b border-[#1A1F3A] bg-gradient-to-r from-[#00D9FF]/10 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    parseFloat(attendancePercent) >= 75 ? 'bg-[#10B981]/20' :
                    parseFloat(attendancePercent) >= 50 ? 'bg-[#F59E0B]/20' : 'bg-[#EF4444]/20'
                  }`}>
                    <Award className={`w-4 h-4 ${attendanceStatus.color}`} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Subject-wise Attendance</h2>
                    <p className="text-xs text-gray-400">Detailed breakdown by subject</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSubjectAttendanceModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* Overall Summary */}
              <div className="mt-4 bg-white/5 backdrop-blur-sm rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Overall Attendance</p>
                    <p className={`text-2xl font-bold ${attendanceStatus.color}`}>{attendancePercent}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 mb-1">Status</p>
                    <div className={`px-3 py-1.5 rounded-full text-xs ${
                      parseFloat(attendancePercent) >= 75 ? 'bg-[#10B981]/20 text-[#10B981]' :
                      parseFloat(attendancePercent) >= 50 ? 'bg-[#F59E0B]/20 text-[#F59E0B]' : 'bg-[#EF4444]/20 text-[#EF4444]'
                    } font-medium`}>
                      {attendanceStatus.status}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Subject List */}
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-190px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {subjectStats.map((subject, index) => {
                  const colors = getSubjectColor(index);
                  const subjectPercent = parseFloat(subject.percent);

                  return (
                    <div
                      key={subject.id}
                      className={`bg-gradient-to-br from-[#0A0E27] to-[#0F1629] border ${colors.border} rounded-lg p-3 hover:scale-[1.01] transition-all duration-300`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <div className={`w-2 h-2 rounded-full ${colors.bg} animate-pulse-slow flex-shrink-0`}></div>
                          <h3 className="text-white font-medium text-sm truncate">{subject.name}</h3>
                        </div>
                        <div className="text-right ml-2">
                          <p className={`text-xl font-bold ${colors.text}`}>{subject.percent}%</p>
                        </div>
                      </div>

                      <div className="space-y-1.5 mb-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Attended</span>
                          <span className={colors.text}>{subject.present}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Total</span>
                          <span className="text-gray-300">{subject.total}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Missed</span>
                          <span className="text-red-400">{subject.total - subject.present}</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="relative w-full bg-[#1A1F3A] h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colors.bg} rounded-full transition-all duration-1000`}
                          style={{ width: `${subject.percent}%` }}
                        ></div>
                        {/* 75% marker */}
                        <div className="absolute top-0 left-[75%] w-0.5 h-full bg-white/50"></div>
                      </div>

                      {/* Status Badge */}
                      <div className="mt-2">
                        {subjectPercent >= 75 ? (
                          <span className="text-[10px] bg-[#10B981]/20 text-[#10B981] px-2 py-0.5 rounded-full">
                            ✓ Above target
                          </span>
                        ) : (
                          <span className="text-[10px] bg-[#EF4444]/20 text-[#EF4444] px-2 py-0.5 rounded-full">
                            ⚠ Below 75%
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Today's Classes Modal */}
      {showTodayClassesModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => setShowTodayClassesModal(false)}>
          <div className="bg-gradient-to-br from-[#0F1629] to-[#0A0E27] border border-[#1A1F3A] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="p-4 border-b border-[#1A1F3A] bg-gradient-to-r from-[#10B981]/10 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-[#10B981]/20 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-[#10B981]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Today's Classes</h2>
                    {mounted && (
                      <p className="text-xs text-gray-400">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowTodayClassesModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* Summary */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Total Classes</p>
                  <p className="text-xl font-bold text-[#10B981]">{todaySubjects.length}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Marked Present</p>
                  <p className="text-xl font-bold text-[#00D9FF]">{markedSubjects.length}</p>
                </div>
              </div>
            </div>

            {/* Classes List with Mark/Undo */}
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-220px)]">
              {todaySubjects.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-10 h-10 text-gray-700 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No classes scheduled today</p>
                  <p className="text-gray-600 text-xs mt-1">Enjoy your day off!</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2 mb-4">
                    {todaySubjects.map((subjectId, index) => {
                      const subject = allSubjects.find(s => s.id === subjectId);
                      const marked = markedSubjects.includes(subjectId);
                      const colors = getSubjectColor(index);
                      const isMarking = marking[subjectId];
                      const isUndoing = undoing[subjectId];

                      return (
                        <div
                          key={subjectId}
                          className={`bg-gradient-to-br from-[#0A0E27] to-[#0F1629] border ${colors.border} border-l-4 rounded-lg p-3 flex flex-row justify-between items-center gap-2 hover:bg-[#131829] transition-all duration-300 cursor-pointer group`}
                        >
                          <div
                            className="flex items-center gap-2 flex-1 min-w-0"
                            onClick={() => router.push(`/student/subject/${subjectId}`)}
                          >
                            <div className={`w-2 h-2 flex-shrink-0 rounded-full ${colors.bg} ${colors.glow} shadow-lg animate-pulse-slow`}></div>
                            <span className="text-white font-medium text-sm truncate">{subject?.subjectName}</span>
                          </div>

                          {marked ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUndoAttendance(subjectId, e);
                              }}
                              disabled={isUndoing}
                              className={`px-3 py-1.5 rounded-lg font-medium transition-all duration-300 flex items-center gap-1.5 text-xs flex-shrink-0 ${
                                isUndoing
                                  ? "bg-red-500/20 text-red-400/50 cursor-not-allowed"
                                  : "bg-red-500/10 text-red-400 border border-red-400/20 hover:bg-red-500/20 hover:scale-105"
                              }`}
                            >
                              {isUndoing ? (
                                <>
                                  <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                                  <span className="hidden sm:inline">Undoing...</span>
                                </>
                              ) : (
                                'Undo'
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAttendance(subjectId, e);
                              }}
                              disabled={isMarking}
                              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 text-sm flex-shrink-0 whitespace-nowrap ${
                                isMarking
                                  ? "bg-[#00D9FF]/20 text-[#00D9FF]/50 cursor-not-allowed"
                                  : "bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/20 hover:bg-[#00D9FF]/20 hover:scale-105"
                              }`}
                            >
                              {isMarking ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-[#00D9FF] border-t-transparent rounded-full animate-spin"></div>
                                  <span className="hidden sm:inline">Marking...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4" />
                                  <span className="hidden xs:inline">Mark</span>
                                  <span className="hidden sm:inline">Present</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

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
                          <div className="relative w-5 h-5">
                            <div className="absolute inset-0 border-2 border-white/20 rounded-full"></div>
                            <div className="absolute inset-0 border-2 border-transparent border-t-white rounded-full animate-spin"></div>
                          </div>
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
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Monthly Chart Modal */}
      {showMonthlyChartModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => setShowMonthlyChartModal(false)}>
          <div className="bg-gradient-to-br from-[#0F1629] to-[#0A0E27] border border-[#1A1F3A] rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="p-4 border-b border-[#1A1F3A] bg-gradient-to-r from-[#7C3AED]/10 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-[#7C3AED]/20 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-[#7C3AED]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Monthly Attendance Overview</h2>
                    <p className="text-xs text-gray-400">Last 30 days - Week by week</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMonthlyChartModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#10B981] rounded"></div>
                  <span className="text-xs text-gray-400">≥75%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#F59E0B] rounded"></div>
                  <span className="text-xs text-gray-400">50-74%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#EF4444] rounded"></div>
                  <span className="text-xs text-gray-400">&lt;50%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#1A1F3A] border border-[#2A2F4A] rounded"></div>
                  <span className="text-xs text-gray-400">No classes</span>
                </div>
              </div>
            </div>

            {/* Weekly Chart Grid */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-220px)]">
              {mounted && (() => {
                // Generate all 30 days with data
                const today = new Date();
                const allDays = [];
                
                for (let i = 29; i >= 0; i--) {
                  const date = new Date(today);
                  date.setDate(date.getDate() - i);
                  const dateStr = date.toISOString().split('T')[0];
                  const dayName = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  
                  // Find matching data from monthlyData
                  const dataPoint = monthlyData.find(d => d.day === dayName);
                  
                  allDays.push({
                    date: dateStr,
                    day: dayName,
                    dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'short' }),
                    scheduled: dataPoint?.scheduled || 0,
                    attended: dataPoint?.attended || 0,
                    percentage: dataPoint?.percentage || 0
                  });
                }
                
                // Group into weeks (7 days each)
                const weeks = [];
                for (let i = 0; i < allDays.length; i += 7) {
                  weeks.push(allDays.slice(i, i + 7));
                }
                
                // Reverse to show newest week first
                weeks.reverse();
                
                return (
                  <div className="space-y-6">
                    {weeks.map((week, weekIndex) => {
                      const actualWeekNumber = weeks.length - weekIndex;
                      
                      return (
                        <div key={weekIndex} className="bg-gradient-to-r from-[#0A0E27] to-[#0F1629] border border-[#1A1F3A] rounded-xl p-4 sm:p-5">
                          {/* Week Header */}
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-[#7C3AED]/20 rounded-lg flex items-center justify-center">
                              <span className="text-sm font-bold text-[#7C3AED]">W{actualWeekNumber}</span>
                            </div>
                            <h3 className="text-base font-medium text-white">
                              Week {actualWeekNumber}
                            </h3>
                            <span className="text-xs text-gray-500">
                              {week[0].day} - {week[week.length - 1].day}
                            </span>
                            {weekIndex === 0 && (
                              <span className="ml-auto text-xs bg-[#00D9FF]/20 text-[#00D9FF] px-2 py-1 rounded-full">
                                Current Week
                              </span>
                            )}
                          </div>

                          {/* Week Chart - 7 columns for 7 days */}
                          <div className="grid grid-cols-7 gap-1 sm:gap-2">
                            {week.map((day, dayIndex) => {
                              const percentage = parseFloat(day.percentage);
                              const hasClasses = day.scheduled > 0;
                              const maxClasses = Math.max(...week.map(d => d.scheduled), 1);
                              const height = hasClasses ? (day.attended / maxClasses) * 100 : 0;

                              return (
                                <div key={dayIndex} className="flex flex-col items-center group">
                                  {/* Bar */}
                                  <div className="w-full h-24 sm:h-32 mb-2 relative">
                                    <div className="absolute inset-0 bg-[#1A1F3A] rounded-t-lg overflow-hidden">
                                      {hasClasses ? (
                                        <>
                                          {/* Background (scheduled) */}
                                          <div className="absolute inset-0 bg-gray-700/20"></div>
                                          
                                          {/* Foreground (attended) */}
                                          <div
                                            className={`absolute bottom-0 inset-x-0 rounded-t-lg transition-all duration-500 ${
                                              percentage >= 75 ? 'bg-gradient-to-t from-[#10B981] to-[#059669]' :
                                              percentage >= 50 ? 'bg-gradient-to-t from-[#F59E0B] to-[#D97706]' :
                                              percentage > 0 ? 'bg-gradient-to-t from-[#EF4444] to-[#DC2626]' :
                                              'bg-gray-700/30'
                                            } group-hover:shadow-lg`}
                                            style={{ height: `${height}%` }}
                                          ></div>

                                          {/* Hover tooltip */}
                                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-t-lg">
                                            <div className="text-center">
                                              <p className="text-xs font-bold text-white">{day.attended}/{day.scheduled}</p>
                                              <p className="text-[10px] text-gray-300">{percentage}%</p>
                                            </div>
                                          </div>
                                        </>
                                      ) : (
                                        // No classes - show empty state
                                        <div className="absolute inset-0 flex items-center justify-center">
                                          <div className="text-center opacity-30">
                                            <div className="w-1 h-1 bg-gray-600 rounded-full mx-auto"></div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Day label */}
                                  <div className="text-center">
                                    <p className="text-[10px] sm:text-xs font-medium text-gray-400">
                                      {day.dayOfWeek}
                                    </p>
                                    <p className="text-[9px] sm:text-[10px] text-gray-600">
                                      {day.day.split(' ')[1]}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Week Summary */}
                          <div className="mt-4 pt-3 border-t border-[#1A1F3A] grid grid-cols-3 gap-2 text-center">
                            <div>
                              <p className="text-[10px] text-gray-500">Scheduled</p>
                              <p className="text-sm font-bold text-gray-300">
                                {week.reduce((sum, d) => sum + d.scheduled, 0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-500">Attended</p>
                              <p className="text-sm font-bold text-[#00D9FF]">
                                {week.reduce((sum, d) => sum + d.attended, 0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-500">Rate</p>
                              <p className={`text-sm font-bold ${
                                (() => {
                                  const totalScheduled = week.reduce((sum, d) => sum + d.scheduled, 0);
                                  const totalAttended = week.reduce((sum, d) => sum + d.attended, 0);
                                  const weekPercent = totalScheduled > 0 ? (totalAttended / totalScheduled) * 100 : 0;
                                  return weekPercent >= 75 ? 'text-[#10B981]' :
                                         weekPercent >= 50 ? 'text-[#F59E0B]' : 'text-[#EF4444]';
                                })()
                              }`}>
                                {(() => {
                                  const totalScheduled = week.reduce((sum, d) => sum + d.scheduled, 0);
                                  const totalAttended = week.reduce((sum, d) => sum + d.attended, 0);
                                  return totalScheduled > 0 ? ((totalAttended / totalScheduled) * 100).toFixed(0) : 0;
                                })()}%
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Footer Summary */}
            {monthlyData.length > 0 && (
              <div className="p-6 border-t border-[#1A1F3A] bg-gradient-to-r from-[#00D9FF]/5 to-transparent">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Total Scheduled</p>
                    <p className="text-2xl font-bold text-[#7C3AED]">
                      {monthlyData.reduce((sum, d) => sum + d.scheduled, 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Total Attended</p>
                    <p className="text-2xl font-bold text-[#00D9FF]">
                      {monthlyData.reduce((sum, d) => sum + d.attended, 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Overall Rate</p>
                    <p className={`text-2xl font-bold ${
                      parseFloat(attendancePercent) >= 75 ? 'text-[#10B981]' :
                      parseFloat(attendancePercent) >= 50 ? 'text-[#F59E0B]' : 'text-[#EF4444]'
                    }`}>
                      {attendancePercent}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subjects Overview Modal */}
      {showSubjectsOverviewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => setShowSubjectsOverviewModal(false)}>
          <div className="bg-gradient-to-br from-[#0F1629] to-[#0A0E27] border border-[#1A1F3A] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-4 border-b border-[#1A1F3A] bg-gradient-to-r from-[#00D9FF]/10 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-[#00D9FF]/20 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-[#00D9FF]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Subjects Overview</h2>
                    <p className="text-xs text-gray-400">Detailed breakdown by subject</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSubjectsOverviewModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Subjects Grid */}
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {subjectStats.map((subject, index) => {
                  const colors = getSubjectColor(index);

                  return (
                    <div
                      key={subject.id}
                      onClick={() => router.push(`/student/subject/${subject.id}`)}
                      className="bg-gradient-to-br from-[#0A0E27] to-[#0F1629] border border-[#1A1F3A] rounded-lg p-3 cursor-pointer hover:border-[#00D9FF]/30 hover:scale-[1.01] transition-all duration-300 group"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className={`w-2 h-2 rounded-full ${colors.bg} shadow-lg ${colors.glow} animate-pulse-slow flex-shrink-0`}></div>
                          <span className="text-white font-medium text-sm truncate">{subject.name}</span>
                        </div>
                        <span className={`${colors.text} font-bold text-xl ml-2`}>{subject.percent}%</span>
                      </div>

                      <p className="text-gray-500 text-xs mb-2">
                        <span className={colors.text}>{subject.present}</span> / {subject.total} Sessions Attended
                      </p>

                      <div className="w-full bg-[#1A1F3A] h-2 rounded-full overflow-hidden">
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
          </div>
        </div>
      )}

      {/* Join Code Change Modal */}
      {showJoinCodeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => setShowJoinCodeModal(false)}>
          <div className="bg-gradient-to-br from-[#0F1629] to-[#0A0E27] border border-[#1A1F3A] rounded-2xl max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="p-4 border-b border-[#1A1F3A]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-[#00D9FF]/20 rounded-lg flex items-center justify-center">
                    <Book className="w-4 h-4 text-[#00D9FF]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Change Class</h2>
                    <p className="text-xs text-gray-400">Enter new join code</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowJoinCodeModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* Current Class Info */}
              <div className="bg-[#00D9FF]/10 border border-[#00D9FF]/20 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Current Join Code</p>
                <code className="text-[#00D9FF] font-mono text-base">{joinCode}</code>
              </div>
            </div>

            {/* Body */}
            <div className="p-4">
              <label className="block text-xs text-gray-400 mb-1.5">New Join Code</label>
              <input
                type="text"
                value={newJoinCode}
                onChange={(e) => setNewJoinCode(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="w-full bg-transparent border border-[#1A1F3A] rounded-xl px-4 py-3 text-white focus:border-[#00D9FF] focus:outline-none transition-colors font-mono text-lg tracking-wider"
              />
              <p className="text-xs text-gray-500 mt-2">
                ⚠️ Changing class will reset your attendance data
              </p>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#1A1F3A] flex gap-3">
              <button
                onClick={() => setShowJoinCodeModal(false)}
                className="flex-1 px-4 py-3 rounded-xl border border-[#1A1F3A] text-gray-400 hover:bg-white/5 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleChangeClass}
                disabled={changingClass || newJoinCode.length !== 6}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                  changingClass || newJoinCode.length !== 6
                    ? "bg-[#00D9FF]/20 text-[#00D9FF]/50 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#00D9FF] to-[#0EA5E9] text-white hover:scale-105"
                }`}
              >
                {changingClass ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    Changing...
                  </>
                ) : (
                  "Change Class"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        .animate-bounce {
          animation: bounce 0.6s ease-in-out infinite;
        }

        @keyframes pulseBorder {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }

        .animate-pulse-border {
          animation: pulseBorder 3s ease-in-out infinite;
        }

        @keyframes progressFill {
          from {
            width: 0%;
          }
        }

        .animate-progress-fill {
          animation: progressFill 1.5s ease-out;
        }
      `}</style>

    </div>

  );

}