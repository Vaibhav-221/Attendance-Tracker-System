"use client";

import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

import { auth, db } from "@/lib/firebase";

import {
  doc,
  getDoc,
  getDocs,
  collection
} from "firebase/firestore";

export default function AttendanceCalendar() {

  const [attendanceData, setAttendanceData] = useState({});
  const [subjectsMap, setSubjectsMap] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);

  const [daySubjects, setDaySubjects] = useState([]);
  const [dayStats, setDayStats] = useState({
    total: 0,
    present: 0,
    absent: 0
  });

  const formatDate = (date) => {
    return date.toISOString().split("T")[0];
  };

  useEffect(() => {

    const loadAttendance = async () => {

      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(
        doc(db, "users", user.uid)
      );

      const classId = userDoc.data().classId;

      /* Fetch Subjects */

      const subjectsSnapshot = await getDocs(
        collection(db, "classes", classId, "subjects")
      );

      let subjectMap = {};

      subjectsSnapshot.docs.forEach((docItem) => {
        subjectMap[docItem.id] = docItem.data().subjectName;
      });

      setSubjectsMap(subjectMap);

      /* Fetch Attendance */

      const scheduleSnapshot = await getDocs(
        collection(db, "classes", classId, "dailySchedule")
      );

      let data = {};

      for (const scheduleDoc of scheduleSnapshot.docs) {

        const date = scheduleDoc.id;

        const scheduledSubjects =
          scheduleDoc.data().subjects || [];

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

        let presentSubjects = [];

        if (attendanceDoc.exists()) {
          presentSubjects =
            attendanceDoc.data().subjects || [];
        }

        data[date] = {
          scheduled: scheduledSubjects,
          present: presentSubjects
        };

      }

      setAttendanceData(data);

    };

    loadAttendance();

  }, []);

  /* Handle Date Click */

  const handleDateClick = (date) => {

    const formattedDate = formatDate(date);

    setSelectedDate(formattedDate);

    const day = attendanceData[formattedDate];

    if (!day) {

      setDaySubjects([]);
      setDayStats({
        total: 0,
        present: 0,
        absent: 0
      });

      return;

    }

    const subjects = day.scheduled.map((subjectId) => ({

      id: subjectId,
      name: subjectsMap[subjectId] || subjectId,
      present: day.present.includes(subjectId)

    }));

    const total = subjects.length;
    const present = subjects.filter(s => s.present).length;
    const absent = total - present;

    setDaySubjects(subjects);

    setDayStats({
      total,
      present,
      absent
    });

  };

  /* Calendar Color Logic */

  const tileClassName = ({ date }) => {

    const formattedDate = formatDate(date);
    const day = attendanceData[formattedDate];

    if (!day) return "";

    if (day.scheduled.length === 0) return "";

    if (day.present.length === day.scheduled.length) {
      return "bg-emerald-600 text-white";
    }

    if (day.present.length > 0) {
      return "bg-amber-500 text-black";
    }

    return "bg-rose-600 text-white";

  };

  return (

    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">

      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-xl p-8">

        <h1 className="text-2xl font-bold text-white mb-6">
          Attendance Calendar
        </h1>

        {/* Legend */}

        <div className="flex gap-6 text-sm mb-6 font-medium">

          <span className="text-emerald-400">● Full Present</span>
          <span className="text-amber-400">● Partial</span>
          <span className="text-rose-400">● Absent</span>

        </div>

        {/* Calendar */}

        <div className="mb-8">

          <Calendar
            onClickDay={handleDateClick}
            tileClassName={tileClassName}
            className="bg-slate-900 text-white border-none w-full"
          />

        </div>

        {/* Day Details */}

        {selectedDate && (

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">

            <h2 className="font-semibold text-white mb-4">
              {selectedDate}
            </h2>

            {/* Day Stats */}

            <div className="flex justify-between text-center mb-6">

              <div>
                <p className="text-xl font-bold text-white">
                  {dayStats.total}
                </p>
                <p className="text-slate-400 text-sm">
                  Total
                </p>
              </div>

              <div>
                <p className="text-xl font-bold text-emerald-400">
                  {dayStats.present}
                </p>
                <p className="text-slate-400 text-sm">
                  Present
                </p>
              </div>

              <div>
                <p className="text-xl font-bold text-rose-400">
                  {dayStats.absent}
                </p>
                <p className="text-slate-400 text-sm">
                  Absent
                </p>
              </div>

            </div>

            {/* Subject List */}

            {daySubjects.length === 0 ? (

              <p className="text-slate-400">
                No classes scheduled
              </p>

            ) : (

              <ul className="space-y-3">

                {daySubjects.map((subject) => (

                  <li
                    key={subject.id}
                    className="flex justify-between items-center bg-slate-900 px-4 py-2 rounded-lg border border-slate-700"
                  >

                    <span className="text-slate-200">
                      {subject.name}
                    </span>

                    <span
                      className={
                        subject.present
                          ? "text-emerald-400 font-medium"
                          : "text-rose-400 font-medium"
                      }
                    >
                      {subject.present
                        ? "Present ✓"
                        : "Absent"}
                    </span>

                  </li>

                ))}

              </ul>

            )}

          </div>

        )}

      </div>

    </div>

  );

}