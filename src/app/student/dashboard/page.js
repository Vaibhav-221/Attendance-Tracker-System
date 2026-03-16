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
  
      // allow both student and CR
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

  /* FETCH ALL SUBJECTS */

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

  /* LISTEN DAILY SCHEDULE */

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

  /* LISTEN TODAY ATTENDANCE */

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

  /* MARK ATTENDANCE */

  const handleMarkAttendance = (subjectId, e) => {

    e.stopPropagation();

    if (markedSubjects.includes(subjectId)) return;

    setMarking(prev => ({ ...prev, [subjectId]: true }));

    setMarkedSubjects(prev => [...prev, subjectId]);

    setMarking(prev => ({ ...prev, [subjectId]: false }));

  };

  /* UNDO ATTENDANCE */

  const handleUndoAttendance = (subjectId, e) => {

    e.stopPropagation();

    setUndoing(prev => ({ ...prev, [subjectId]: true }));

    const updated = markedSubjects.filter(id => id !== subjectId);

    setMarkedSubjects(updated);

    setUndoing(prev => ({ ...prev, [subjectId]: false }));

  };

  /* UPDATE FIRESTORE */

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

  /* FETCH HISTORY */

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

  /* LOADING */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (

    <div className="min-h-screen bg-slate-950 p-5">

      <div className="max-w-4xl mx-auto">

        <h1 className="text-3xl font-bold text-white mb-2">
          Student Dashboard
        </h1>

        <p className="text-slate-400 mb-8">
          Welcome, {userData.name}
        </p>

        {/* Attendance Card */}

        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 mb-6">

          <p className="text-slate-400">
            Overall Attendance
          </p>

          <p className="text-3xl font-bold text-emerald-400">
            {attendancePercent}%
          </p>

        </div>

        {/* Calendar Button */}

        <button
          onClick={() => router.push("/student/calender")}
          className="mb-8 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg"
        >
          View Attendance Calendar
        </button>

        {/* SUBJECT OVERVIEW */}

        <h2 className="text-xl font-semibold text-white mb-4">
          Subjects Overview
        </h2>

        <div className="space-y-4">

          {subjectStats.map(subject => (

            <div
              key={subject.id}
              onClick={() => router.push(`/student/subject/${subject.id}`)}
              className="bg-slate-900 border border-slate-700 rounded-xl p-4 cursor-pointer hover:bg-slate-800"
            >

              <div className="flex justify-between mb-2">

                <span className="text-white font-medium">
                  {subject.name}
                </span>

                <span className="text-emerald-400 font-semibold">
                  {subject.percent}%
                </span>

              </div>

              <p className="text-slate-400 text-sm mb-2">
                {subject.present} / {subject.total} Sessions
              </p>

              <div className="w-full bg-slate-700 h-2 rounded">

                <div
                  className="bg-emerald-500 h-2 rounded"
                  style={{ width: `${subject.percent}%` }}
                />

              </div>

            </div>

          ))}

        </div>

        {/* TODAY CLASSES */}

        <h2 className="text-xl font-semibold text-white mt-10 mb-4">
          Today's Classes ({today})
        </h2>

        {todaySubjects.length === 0 ? (

          <p className="text-slate-400">
            No classes scheduled today.
          </p>

        ) : (

          <ul className="space-y-3">

            {todaySubjects.map(subjectId => {

              const subject = allSubjects.find(
                s => s.id === subjectId
              );

              const marked = markedSubjects.includes(subjectId);

              return (

                <li
                  key={subjectId}
                  onClick={() => router.push(`/student/subject/${subjectId}`)}
                  className="bg-slate-900 border border-slate-700 rounded-lg p-4 flex justify-between items-center hover:bg-slate-800"
                >

                  <span className="text-white">
                    {subject?.subjectName}
                  </span>

                  {marked ? (

                    <button
                      onClick={(e) => handleUndoAttendance(subjectId, e)}
                      className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded"
                    >
                      Undo
                    </button>

                  ) : (

                    <button
                      onClick={(e) => handleMarkAttendance(subjectId, e)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                    >
                      Mark Present
                    </button>

                  )}

                </li>

              );

            })}

          </ul>

        )}

        <button
          onClick={updateAttendance}
          disabled={updating}
          className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg"
        >
          {updating ? "Updating..." : "Update Attendance"}
        </button>

      </div>

    </div>

  );

}