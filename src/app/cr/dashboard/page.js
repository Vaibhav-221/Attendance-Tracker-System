"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc
} from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function CRDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [className, setClassName] = useState("");
  const [error, setError] = useState("");

  // 🔐 Auth + Role Protection
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
      setLoading(false);
    };

    checkUser();
  }, []);

  // 🔢 Generate Join Code
  const generateJoinCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // 🏫 Create Class
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

      // Refresh local state
      setUserData((prev) => ({
        ...prev,
        classId
      }));

    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="p-10">Loading...</div>;

  return (
    <div className="p-10 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">CR Dashboard</h1>

      <p className="mb-4">Welcome, {userData.name}</p>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      {/* If Class Already Exists */}
      {userData.classId ? (
        <div className="border p-4 rounded">
          <p className="font-semibold">Class Created Successfully ✅</p>
          <p className="text-sm mt-2">
            Class ID: {userData.classId}
          </p>
        </div>
      ) : (
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