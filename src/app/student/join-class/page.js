"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function JoinClass() {
  const router = useRouter();

  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoinClass = async () => {
    if (loading) return;

    if (!joinCode.trim()) {
      setError("Join Code is required.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const classesRef = collection(db, "classes");
      const q = query(classesRef, where("joinCode", "==", joinCode.trim().toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("Invalid Join Code.");
      }

      const classDoc = querySnapshot.docs[0];
      const classId = classDoc.id;

      const user = auth.currentUser;

      if (!user) {
        throw new Error("User not authenticated.");
      }

      await updateDoc(doc(db, "users", user.uid), {
        classId: classId
      });

      router.push("/student/dashboard");

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-10 max-w-md mx-auto">
      <h1 className="text-2xl font-bold">Join Class</h1>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <input
        type="text"
        placeholder="Enter Join Code"
        className="border p-2 rounded"
        value={joinCode}
        onChange={(e) => setJoinCode(e.target.value)}
      />

      <button
        onClick={handleJoinClass}
        disabled={loading}
        className="bg-purple-600 text-white p-2 rounded disabled:opacity-50"
      >
        {loading ? "Joining..." : "Join Class"}
      </button>
    </div>
  );
}