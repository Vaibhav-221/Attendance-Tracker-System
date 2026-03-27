"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  getDocs,
  collection
} from "firebase/firestore";
import { ChevronLeft, ChevronRight, Calendar, CheckCircle, XCircle, BookOpen, TrendingUp, X, Clock } from "lucide-react";

export default function AttendanceCalendar() {
  const [attendanceData, setAttendanceData] = useState({});
  const [subjectsMap, setSubjectsMap] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [daySubjects, setDaySubjects] = useState([]);
  const [dayStats, setDayStats] = useState({ total: 0, present: 0, absent: 0 });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  const subjectColors = [
    { bg: 'bg-[#00D9FF]', text: 'text-[#00D9FF]', border: 'border-[#00D9FF]', hex: '#00D9FF' },
    { bg: 'bg-[#7C3AED]', text: 'text-[#7C3AED]', border: 'border-[#7C3AED]', hex: '#7C3AED' },
    { bg: 'bg-[#F59E0B]', text: 'text-[#F59E0B]', border: 'border-[#F59E0B]', hex: '#F59E0B' },
    { bg: 'bg-[#10B981]', text: 'text-[#10B981]', border: 'border-[#10B981]', hex: '#10B981' },
    { bg: 'bg-[#EC4899]', text: 'text-[#EC4899]', border: 'border-[#EC4899]', hex: '#EC4899' },
  ];
  const getSubjectColor = (index) => subjectColors[index % subjectColors.length];

  const formatDate = (date) => date.toISOString().split("T")[0];

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const loadAttendance = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      const classId = userDoc.data().classId;

      const subjectsSnapshot = await getDocs(collection(db, "classes", classId, "subjects"));
      let subjectMap = {};
      subjectsSnapshot.docs.forEach((docItem) => {
        subjectMap[docItem.id] = docItem.data().subjectName;
      });
      setSubjectsMap(subjectMap);

      const scheduleSnapshot = await getDocs(collection(db, "classes", classId, "dailySchedule"));
      let data = {};

      for (const scheduleDoc of scheduleSnapshot.docs) {
        const date = scheduleDoc.id;
        const scheduledSubjects = scheduleDoc.data().subjects || [];

        const attendanceDoc = await getDoc(
          doc(db, "classes", classId, "attendance", date, "students", user.uid)
        );

        let presentSubjects = [];
        if (attendanceDoc.exists()) {
          presentSubjects = attendanceDoc.data().subjects || [];
        }

        data[date] = { scheduled: scheduledSubjects, present: presentSubjects };
      }

      setAttendanceData(data);
      setLoading(false);
    };

    loadAttendance();
  }, []);

  const handleDateClick = (date) => {
    const formattedDate = formatDate(date);
    setSelectedDate(formattedDate);

    const day = attendanceData[formattedDate];
    if (!day || day.scheduled.length === 0) {
      setDaySubjects([]);
      setDayStats({ total: 0, present: 0, absent: 0 });
      setShowModal(true);
      return;
    }

    const subjects = day.scheduled.map((subjectId) => ({
      id: subjectId,
      name: subjectsMap[subjectId] || subjectId,
      present: day.present.includes(subjectId),
    }));

    const total = subjects.length;
    const present = subjects.filter((s) => s.present).length;
    setDaySubjects(subjects);
    setDayStats({ total, present, absent: total - present });
    setShowModal(true);
  };

  /* Returns color info based on attendance ratio */
  const getDayColor = (date) => {
    const formattedDate = formatDate(date);
    const day = attendanceData[formattedDate];

    if (!day || day.scheduled.length === 0) return null;

    const percent = (day.present.length / day.scheduled.length) * 100;

    if (percent >= 75) return { dot: '#10B981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.5)', label: 'green' };
    if (percent >= 50) return { dot: '#F59E0B', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.5)', label: 'amber' };
    return { dot: '#EF4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.5)', label: 'red' };
  };

  /* Calendar navigation */
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  /* Generate calendar days */
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  /* Monthly stats */
  const getMonthStats = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    let totalScheduled = 0, totalPresent = 0, daysWithClass = 0;

    Object.entries(attendanceData).forEach(([dateStr, day]) => {
      const d = new Date(dateStr);
      if (d.getFullYear() === year && d.getMonth() === month && day.scheduled.length > 0) {
        totalScheduled += day.scheduled.length;
        totalPresent += day.present.length;
        daysWithClass++;
      }
    });

    const percent = totalScheduled === 0 ? 0 : ((totalPresent / totalScheduled) * 100).toFixed(1);
    return { totalScheduled, totalPresent, daysWithClass, percent };
  };

  const monthStats = getMonthStats();
  const calendarDays = generateCalendarDays();
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  /* Selected date percent */
  const selectedDayPercent = dayStats.total > 0 ? ((dayStats.present / dayStats.total) * 100).toFixed(0) : 0;
  const getSelectedPercentColor = (p) => {
    if (p >= 75) return 'text-[#10B981]';
    if (p >= 50) return 'text-[#F59E0B]';
    return 'text-[#EF4444]';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00D9FF]/10 rounded-full blur-[100px] animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#7C3AED]/10 rounded-full blur-[100px] animate-float-delayed"></div>
        </div>
        <div className="text-center relative z-10">
          <div className="relative w-20 h-20 mx-auto mb-5">
            <div className="absolute inset-0 border-4 border-[#00D9FF]/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-[#00D9FF] rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-4 border-transparent border-t-[#7C3AED] rounded-full animate-spin-slow"></div>
          </div>
          <p className="text-gray-400 text-base font-medium animate-pulse">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0E27] text-gray-200 p-3 sm:p-5 lg:p-8 relative overflow-hidden">

      {/* Animated Background */}
      <div className="absolute top-[-100px] right-[-100px] w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] bg-[#00D9FF]/5 rounded-full blur-[100px] animate-float pointer-events-none"></div>
      <div className="absolute bottom-[-150px] left-[-150px] w-[350px] h-[350px] sm:w-[500px] sm:h-[500px] bg-[#7C3AED]/5 rounded-full blur-[120px] animate-float-delayed pointer-events-none"></div>

      <div className="max-w-4xl mx-auto relative z-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-[#00D9FF] to-[#7C3AED] rounded-xl flex items-center justify-center shadow-lg shadow-[#00D9FF]/30 flex-shrink-0">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-white">Attendance Calendar</h1>
            <p className="text-xs sm:text-sm text-transparent bg-clip-text bg-gradient-to-r from-[#00D9FF] to-[#7C3AED] font-medium">
              Your attendance history at a glance
            </p>
          </div>
        </div>

        {/* Monthly Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {[
            { label: 'Month Rate', value: `${monthStats.percent}%`, color: parseFloat(monthStats.percent) >= 75 ? 'text-[#10B981]' : parseFloat(monthStats.percent) >= 50 ? 'text-[#F59E0B]' : 'text-[#EF4444]', icon: TrendingUp, iconColor: 'text-[#00D9FF]' },
            { label: 'Days w/ Classes', value: monthStats.daysWithClass, color: 'text-[#00D9FF]', icon: Calendar, iconColor: 'text-[#00D9FF]' },
            { label: 'Present', value: monthStats.totalPresent, color: 'text-[#10B981]', icon: CheckCircle, iconColor: 'text-[#10B981]' },
            { label: 'Absent', value: monthStats.totalScheduled - monthStats.totalPresent, color: 'text-[#EF4444]', icon: XCircle, iconColor: 'text-[#EF4444]' },
          ].map((stat, i) => (
            <div key={i} className="bg-gradient-to-br from-[#0F1629] to-[#0A0E27] border border-[#1A1F3A] rounded-2xl p-4 sm:p-5 relative overflow-hidden hover:border-[#00D9FF]/30 transition-all duration-300 hover:scale-[1.02] group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/3 rounded-full blur-xl group-hover:bg-white/5 transition-all"></div>
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
              <p className={`text-2xl sm:text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Calendar Card */}
        <div className="bg-gradient-to-br from-[#0F1629] to-[#0A0E27] border border-[#1A1F3A] rounded-2xl overflow-hidden shadow-2xl mb-6">

          {/* Calendar Header */}
          <div className="p-4 sm:p-6 border-b border-[#1A1F3A] bg-gradient-to-r from-[#00D9FF]/5 to-[#7C3AED]/5">
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={prevMonth}
                className="w-9 h-9 rounded-xl bg-[#1A1F3A] hover:bg-[#00D9FF]/20 border border-[#2A2F4A] hover:border-[#00D9FF]/40 flex items-center justify-center text-gray-400 hover:text-[#00D9FF] transition-all duration-200"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <h2 className="text-base sm:text-xl font-semibold text-white tracking-wide">{monthName}</h2>

              <button
                onClick={nextMonth}
                className="w-9 h-9 rounded-xl bg-[#1A1F3A] hover:bg-[#00D9FF]/20 border border-[#2A2F4A] hover:border-[#00D9FF]/40 flex items-center justify-center text-gray-400 hover:text-[#00D9FF] transition-all duration-200"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 sm:gap-5 text-xs justify-center">
              {[
                { color: '#10B981', label: '≥ 75% Present' },
                { color: '#F59E0B', label: '50–74% Present' },
                { color: '#EF4444', label: '< 50% Present' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}80` }}></div>
                  <span className="text-gray-400">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weekday labels */}
          <div className="grid grid-cols-7 border-b border-[#1A1F3A]">
            {weekdays.map((day) => (
              <div key={day} className="py-2 sm:py-3 text-center text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 p-2 sm:p-4 gap-1 sm:gap-2">
            {calendarDays.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const color = getDayColor(date);
              const isToday = formatDate(date) === formatDate(today);
              const isSelected = selectedDate === formatDate(date);
              const dateStr = formatDate(date);
              const dayData = attendanceData[dateStr];
              const hasClasses = dayData && dayData.scheduled.length > 0;

              return (
                <button
                  key={dateStr}
                  onClick={() => handleDateClick(date)}
                  className={`
                    aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all duration-200 group
                    ${hasClasses ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
                    ${isSelected ? 'ring-2 ring-[#00D9FF] ring-offset-1 ring-offset-[#0F1629]' : ''}
                    ${isToday && !color ? 'border border-[#00D9FF]/40' : ''}
                  `}
                  style={{
                    backgroundColor: color ? color.bg : isToday ? 'rgba(0,217,255,0.05)' : 'transparent',
                    border: color ? `1px solid ${color.border}` : isToday ? '1px solid rgba(0,217,255,0.3)' : '1px solid transparent',
                  }}
                >
                  <span className={`text-xs sm:text-sm font-medium ${
                    isToday ? 'text-[#00D9FF] font-bold' :
                    color ? 'text-white' : 'text-gray-500'
                  }`}>
                    {date.getDate()}
                  </span>

                  {/* Attendance dot indicator */}
                  {color && (
                    <div
                      className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full mt-0.5 sm:mt-1"
                      style={{ backgroundColor: color.dot, boxShadow: `0 0 4px ${color.dot}` }}
                    />
                  )}

                  {/* Today indicator */}
                  {isToday && !color && (
                    <div className="w-1 h-1 rounded-full bg-[#00D9FF] mt-0.5 sm:mt-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick tip */}
        <p className="text-center text-xs text-gray-600">
          💡 Tap any highlighted date to view detailed attendance for that day
        </p>

      </div>

      {/* Day Detail Modal */}
      {showModal && selectedDate && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-fadeIn"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-gradient-to-br from-[#0F1629] to-[#0A0E27] border border-[#1A1F3A] rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-[#1A1F3A] bg-gradient-to-r from-[#00D9FF]/10 to-[#7C3AED]/5">
              {/* Drag handle (mobile) */}
              <div className="w-10 h-1 bg-[#2A2F4A] rounded-full mx-auto mb-4 sm:hidden"></div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-gradient-to-br from-[#00D9FF]/20 to-[#7C3AED]/20 rounded-xl flex items-center justify-center border border-[#00D9FF]/20">
                    <Calendar className="w-5 h-5 text-[#00D9FF]" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-base sm:text-lg">
                      {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </h3>
                    <p className="text-xs text-gray-500">{new Date(selectedDate + 'T00:00:00').getFullYear()}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-9 h-9 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Stats Row */}
              {dayStats.total > 0 ? (
                <div className="mt-5 grid grid-cols-3 gap-3">
                  {[
                    { label: 'Total', value: dayStats.total, color: 'text-[#00D9FF]', bg: 'bg-[#00D9FF]/10', border: 'border-[#00D9FF]/20' },
                    { label: 'Present', value: dayStats.present, color: 'text-[#10B981]', bg: 'bg-[#10B981]/10', border: 'border-[#10B981]/20' },
                    { label: 'Absent', value: dayStats.absent, color: 'text-[#EF4444]', bg: 'bg-[#EF4444]/10', border: 'border-[#EF4444]/20' },
                  ].map((s) => (
                    <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-3 text-center`}>
                      <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Percentage Bar */}
              {dayStats.total > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs text-gray-500">Day Attendance</span>
                    <span className={`text-sm font-bold ${getSelectedPercentColor(selectedDayPercent)}`}>{selectedDayPercent}%</span>
                  </div>
                  <div className="w-full bg-[#1A1F3A] h-2.5 rounded-full overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        selectedDayPercent >= 75 ? 'bg-[#10B981]' :
                        selectedDayPercent >= 50 ? 'bg-[#F59E0B]' : 'bg-[#EF4444]'
                      }`}
                      style={{ width: `${selectedDayPercent}%` }}
                    />
                    {/* 75% marker */}
                    <div className="absolute top-0 left-[75%] w-0.5 h-full bg-white/40" />
                  </div>
                  <p className="text-[10px] text-gray-600 mt-1">75% target line shown</p>
                </div>
              )}
            </div>

            {/* Subject List */}
            <div className="overflow-y-auto max-h-[40vh] p-4 sm:p-6">
              {daySubjects.length === 0 ? (
                <div className="text-center py-10">
                  <Clock className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 text-base">No classes scheduled</p>
                  <p className="text-gray-600 text-sm mt-1">This was a free day</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3">Class Breakdown</p>
                  {daySubjects.map((subject, index) => {
                    const colors = getSubjectColor(index);
                    return (
                      <div
                        key={subject.id}
                        className={`flex items-center justify-between bg-gradient-to-r from-[#0A0E27] to-[#0F1629] border ${colors.border} border-l-4 rounded-xl px-4 py-3 hover:scale-[1.01] transition-all duration-200`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-2 h-2 rounded-full ${colors.bg} flex-shrink-0`} style={{ boxShadow: `0 0 6px ${colors.hex}` }} />
                          <span className="text-gray-200 font-medium text-sm truncate">{subject.name}</span>
                        </div>
                        <div className={`flex items-center gap-1.5 flex-shrink-0 ml-3 px-3 py-1 rounded-full ${subject.present ? 'bg-[#10B981]/15' : 'bg-[#EF4444]/15'}`}>
                          {subject.present ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5 text-[#10B981]" />
                              <span className="text-[#10B981] text-xs font-medium">Present</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-[#EF4444]" />
                              <span className="text-[#EF4444] text-xs font-medium">Absent</span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, -20px) scale(1.05); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-20px, 20px) scale(1.05); }
        }
        .animate-float { animation: float 8s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 10s ease-in-out infinite; }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        .animate-spin-slow { animation: spin-slow 2s linear infinite; }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.25s ease-out; }
      `}</style>
    </div>
  );
}