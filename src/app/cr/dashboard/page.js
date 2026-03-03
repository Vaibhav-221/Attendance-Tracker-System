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
  const [error, setError] = useState("");

  // 🔐 AUTH + ROLE CHECK
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
      }

      setLoading(false);
    };

    checkUser();
  }, []);

  // 🔢 GENERATE JOIN CODE
  const generateJoinCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // 🏫 CREATE CLASS
  const handleCreateClass = async () => {
    if (!className.trim()) {
      setError("Class name is required");
      return;
    }

    try {
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

      fetchSubjects(classId);

    } catch (err) {
      setError(err.message);
    }
  };

  // 📚 FETCH SUBJECTS
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

  // ➕ ADD SUBJECT
  const handleAddSubject = async () => {
    if (!newSubject.trim()) return;

    try {
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

    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="p-10">Loading...</div>;

  return (
    <div className="p-10 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">CR Dashboard</h1>

      <p className="mb-4">Welcome, {userData.name}</p>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      {/* IF CLASS EXISTS */}
      {userData.classId ? (
        <div className="border p-4 rounded mb-6">
          <p className="font-semibold mb-2">Class Created Successfully ✅</p>
          <p className="text-sm">
            Class ID: {userData.classId}
          </p>

          {/* SUBJECT SECTION */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Subjects</h2>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Enter Subject Name"
                className="border p-2 rounded flex-1"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
              />

              <button
                onClick={handleAddSubject}
                className="bg-blue-600 text-white px-4 rounded"
              >
                Add
              </button>
            </div>

            <ul className="space-y-2">
              {subjects.map((sub) => (
                <li key={sub.id} className="border p-2 rounded">
                  {sub.subjectName}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        // IF NO CLASS
        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Enter Class Name"
            className="border p-2 rounded"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
          />

          <button
            onClick={handleCreateClass}
            className="bg-green-600 text-white p-2 rounded"
          >
            Create Class
          </button>
        </div>
      )}
    </div>
  );
}