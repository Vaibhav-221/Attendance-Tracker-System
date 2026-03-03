"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs
} from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function CRDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [className, setClassName] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [todaySubjects, setTodaySubjects] = useState([]);
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const checkUser = async () => {
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
      }

      setLoading(false);
    };

    checkUser();
  }, []);

  const generateJoinCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateClass = async () => {
    if (!className.trim()) return;

    const user = auth.currentUser;
    const classId = user.uid;
    const joinCode = generateJoinCode();

    await setDoc(doc(db, "classes", classId), {
      className: className.trim(),
      crId: user.uid,
      joinCode,
      createdAt: new Date()
    });

    await updateDoc(doc(db, "users", user.uid), {
      classId
    });

    setUserData((prev) => ({
      ...prev,
      classId
    }));
  };

  const fetchSubjects = async (classId) => {
    const snapshot = await getDocs(
      collection(db, "classes", classId, "subjects")
    );

    setSubjects(snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })));
  };

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
    }
  };

  const handleAddSubject = async () => {
    if (!newSubject.trim()) return;

    const user = auth.currentUser;

    await addDoc(
      collection(db, "classes", user.uid, "subjects"),
      {
        subjectName: newSubject.trim(),
        createdAt: new Date()
      }
    );

    setNewSubject("");
    fetchSubjects(user.uid);
  };

  const handleAddToToday = async (subjectId) => {
    if (todaySubjects.includes(subjectId)) return;

    const user = auth.currentUser;

    const scheduleRef = doc(
      db,
      "classes",
      user.uid,
      "dailySchedule",
      today
    );

    await setDoc(
      scheduleRef,
      {
        subjects: [...todaySubjects, subjectId]
      },
      { merge: true }
    );

    setTodaySubjects([...todaySubjects, subjectId]);
  };

  if (loading) return <div className="p-10">Loading...</div>;

  return (
    <div className="p-10 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">CR Dashboard</h1>

      {!userData.classId ? (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Class Name"
            className="border p-2"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
          />
          <button
            onClick={handleCreateClass}
            className="bg-green-600 text-white px-4"
          >
            Create
          </button>
        </div>
      ) : (
        <>
          <h2 className="text-lg font-semibold mt-6 mb-2">
            Semester Subjects
          </h2>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Add Subject"
              className="border p-2 flex-1"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
            />
            <button
              onClick={handleAddSubject}
              className="bg-blue-600 text-white px-4"
            >
              Add
            </button>
          </div>

          <ul className="space-y-2">
            {subjects.map((sub) => (
              <li
                key={sub.id}
                className="border p-2 flex justify-between items-center"
              >
                <span>{sub.subjectName}</span>
                <button
                  onClick={() => handleAddToToday(sub.id)}
                  className="bg-purple-600 text-white px-3 py-1 rounded"
                >
                  Add to Today
                </button>
              </li>
            ))}
          </ul>

          <h2 className="text-lg font-semibold mt-8 mb-2">
            Today's Schedule ({today})
          </h2>

          {todaySubjects.length === 0 ? (
            <p>No subjects selected today.</p>
          ) : (
            <ul className="space-y-2">
              {todaySubjects.map((id) => {
                const sub = subjects.find(s => s.id === id);
                return (
                  <li key={id} className="border p-2">
                    {sub?.subjectName}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}