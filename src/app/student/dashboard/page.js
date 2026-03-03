"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  setDoc
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
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const initialize = async () => {
      try {
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
        await fetchTodaySchedule(classId);
        await fetchMarkedAttendance(user.uid, classId);
        await calculateAttendance(classId, user.uid);

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    initialize();
  }, []);

  // Fetch semester subjects
  const fetchAllSubjects = async (classId) => {
    const snapshot = await getDocs(
      collection(db, "classes", classId, "subjects")
    );

    const subjectList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    setAllSubjects(subjectList);
  };

  // Fetch today's scheduled subjects
  const fetchTodaySchedule = async (classId) => {
    const scheduleRef = doc(
      db,
      "classes",
      classId,
      "dailySchedule",
      today
    );

    const scheduleDoc = await getDoc(scheduleRef);

    if (scheduleDoc.exists()) {
      setTodaySubjects(scheduleDoc.data().subjects || []);
    } else {
      setTodaySubjects([]);
    }
  };

  // Fetch marked attendance (CORRECTED PATH)
  const fetchMarkedAttendance = async (studentId, classId) => {
    const attendanceRef = doc(
      db,
      "classes",
      classId,
      "attendance",
      today,
      "students",
      studentId
    );

    const attendanceDoc = await getDoc(attendanceRef);

    if (attendanceDoc.exists()) {
      setMarkedSubjects(attendanceDoc.data().subjects || []);
    }
  };

  // Mark attendance (CORRECTED PATH)
  const handleMarkAttendance = async (subjectId) => {
    if (markedSubjects.includes(subjectId)) return;

    try {
      const user = auth.currentUser;

      const attendanceRef = doc(
        db,
        "classes",
        userData.classId,
        "attendance",
        today,
        "students",
        user.uid
      );

      const updatedSubjects = [...markedSubjects, subjectId];

      await setDoc(
        attendanceRef,
        { subjects: updatedSubjects },
        { merge: true }
      );

      setMarkedSubjects(updatedSubjects);

      await calculateAttendance(userData.classId, user.uid);

    } catch (err) {
      setError(err.message);
    }
  };

  // Calculate Attendance Percentage (CORRECTED PATH)
  const calculateAttendance = async (classId, studentId) => {
    try {
      let totalScheduled = 0;
      let totalPresent = 0;

      const scheduleSnapshot = await getDocs(
        collection(db, "classes", classId, "dailySchedule")
      );

      for (const scheduleDoc of scheduleSnapshot.docs) {
        const date = scheduleDoc.id;
        const scheduledSubjects = scheduleDoc.data().subjects || [];

        totalScheduled += scheduledSubjects.length;

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
          const presentSubjects = attendanceDoc.data().subjects || [];
          totalPresent += presentSubjects.length;
        }
      }

      if (totalScheduled === 0) {
        setAttendancePercent(0);
        return;
      }

      const percent = (totalPresent / totalScheduled) * 100;
      setAttendancePercent(percent.toFixed(2));

    } catch (err) {
      console.error("Attendance calculation error:", err);
    }
  };

  if (loading) return <div className="p-10">Loading...</div>;

  return (
    <div className="p-10 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Student Dashboard</h1>

      <p className="mb-6">Welcome, {userData.name}</p>

      {error && (
        <p className="text-red-500 text-sm mb-3">{error}</p>
      )}

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
          {todaySubjects.map((subjectId) => {
            const subject = allSubjects.find(
              s => s.id === subjectId
            );

            return (
              <li
                key={subjectId}
                className="border p-3 rounded flex justify-between items-center"
              >
                <span>{subject?.subjectName}</span>

                {markedSubjects.includes(subjectId) ? (
                  <span className="text-green-600 font-semibold">
                    Present ✓
                  </span>
                ) : (
                  <button
                    onClick={() =>
                      handleMarkAttendance(subjectId)
                    }
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    Mark Present
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}