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
  const [subjects, setSubjects] = useState([]);
  const [markedSubjects, setMarkedSubjects] = useState([]);
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const checkUser = async () => {
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

      setUserData(userDoc.data());

      fetchSubjects(userDoc.data().classId);
      fetchMarkedAttendance(user.uid, userDoc.data().classId);

      setLoading(false);
    };

    checkUser();
  }, []);

  const fetchSubjects = async (classId) => {
    const querySnapshot = await getDocs(
      collection(db, "classes", classId, "subjects")
    );

    const subjectList = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    setSubjects(subjectList);
  };

  const fetchMarkedAttendance = async (studentId, classId) => {
    const attendanceRef = doc(
      db,
      "classes",
      classId,
      "attendance",
      today,
      studentId,
      "subjects",
      "data"
    );

    const attendanceDoc = await getDoc(attendanceRef);

    if (attendanceDoc.exists()) {
      setMarkedSubjects(attendanceDoc.data().subjects || []);
    }
  };

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
        user.uid,
        "subjects",
        "data"
      );

      await setDoc(
        attendanceRef,
        {
          subjects: [...markedSubjects, subjectId]
        },
        { merge: true }
      );

      setMarkedSubjects([...markedSubjects, subjectId]);

    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="p-10">Loading...</div>;

  return (
    <div className="p-10 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Student Dashboard</h1>

      <p className="mb-6">Welcome, {userData.name}</p>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      <h2 className="text-lg font-semibold mb-3">
        Mark Attendance ({today})
      </h2>

      {subjects.length === 0 ? (
        <p className="text-gray-500">
          No subjects added by CR yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {subjects.map((sub) => (
            <li
              key={sub.id}
              className="border p-3 rounded flex justify-between items-center"
            >
              <span>{sub.subjectName}</span>

              {markedSubjects.includes(sub.id) ? (
                <span className="text-green-600 font-semibold">
                  Present ✓
                </span>
              ) : (
                <button
                  onClick={() => handleMarkAttendance(sub.id)}
                  className="bg-blue-600 text-white px-3 py-1 rounded"
                >
                  Mark Present
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}