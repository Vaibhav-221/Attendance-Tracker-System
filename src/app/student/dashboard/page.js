"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
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
  const [attendanceHistory, setAttendanceHistory] = useState([]);

  const [attendancePercent, setAttendancePercent] = useState(0);

  const [marking, setMarking] = useState({});
  const [undoing, setUndoing] = useState({});
  const [updating, setUpdating] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {

    const initialize = async () => {

      const user = auth.currentUser;

      if (!user) {
        router.push("/student/login");
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists() || userDoc.data().role !== "student") {
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

    };

    initialize();

  }, []);

  const fetchAllSubjects = async (classId) => {

    const snapshot = await getDocs(
      collection(db, "classes", classId, "subjects")
    );

    setAllSubjects(
      snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    );

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

  const handleMarkAttendance = (subjectId) => {

    if (markedSubjects.includes(subjectId)) return;

    setMarking(prev => ({ ...prev, [subjectId]: true }));

    setMarkedSubjects([...markedSubjects, subjectId]);

    setMarking(prev => ({ ...prev, [subjectId]: false }));

  };

  const handleUndoAttendance = (subjectId) => {

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

    let history = [];
    let totalScheduled = 0;
    let totalPresent = 0;

    for (const scheduleDoc of scheduleSnapshot.docs) {

      const date = scheduleDoc.id;
      const scheduled = scheduleDoc.data().subjects || [];

      totalScheduled += scheduled.length;

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

      let presentSubjects = [];

      if (attendanceDoc.exists()) {

        presentSubjects = attendanceDoc.data().subjects || [];

        totalPresent += presentSubjects.length;

      }

      history.push({
        date,
        scheduled,
        present: presentSubjects
      });

    }

    if (totalScheduled === 0) {
      setAttendancePercent(0);
    } else {
      setAttendancePercent(
        ((totalPresent / totalScheduled) * 100).toFixed(2)
      );
    }

    setAttendanceHistory(history);

  };

  if (loading) return <div className="p-10">Loading...</div>;

  return (

    <div className="p-10 max-w-xl mx-auto">

      <h1 className="text-2xl font-bold mb-4">
        Student Dashboard
      </h1>

      <p className="mb-6">
        Welcome, {userData.name}
      </p>

      <div className="mb-6 p-4 border rounded bg-gray-100">

        <p className="font-semibold">
          Attendance Percentage:
          <span className="ml-2 text-blue-600">
            {attendancePercent}%
          </span>
        </p>

      </div>

      <h2 className="text-lg font-semibold mb-3">
        Today's Classes ({today})
      </h2>

      {todaySubjects.length === 0 ? (

        <p className="text-gray-500">
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
                className="border p-3 rounded flex justify-between"
              >

                <span>{subject?.subjectName}</span>

                {marked ? (

                  <button
                    onClick={() =>
                      handleUndoAttendance(subjectId)
                    }
                    disabled={undoing[subjectId]}
                    className="bg-red-500 text-white px-3 py-1 rounded"
                  >
                    {undoing[subjectId]
                      ? "Undoing..."
                      : "Undo"}
                  </button>

                ) : (

                  <button
                    onClick={() =>
                      handleMarkAttendance(subjectId)
                    }
                    disabled={marking[subjectId]}
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    {marking[subjectId]
                      ? "Adding..."
                      : "Mark Present"}
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
        className="mt-6 bg-green-600 text-white px-4 py-2 rounded"
      >
        {updating ? "Updating..." : "Update Attendance"}
      </button>

      <div className="mt-10">

        <h2 className="text-lg font-semibold mb-4">
          Attendance Overview
        </h2>

        {attendanceHistory.map(day => (

          <div
            key={day.date}
            className="border p-3 mb-3 rounded"
          >

            <p className="font-semibold mb-2">
              {day.date}
            </p>

            <ul className="text-sm">

              {day.scheduled.map(subjectId => {

                const subject = allSubjects.find(
                  s => s.id === subjectId
                );

                const present =
                  day.present.includes(subjectId);

                return (

                  <li key={subjectId}>

                    {subject?.subjectName}
                    {" — "}
                    {present ? "Present ✓" : "Absent"}

                  </li>

                );

              })}

            </ul>

          </div>

        ))}

      </div>

    </div>

  );

}