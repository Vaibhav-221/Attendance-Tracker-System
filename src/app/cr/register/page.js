"use client";

import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function CRRegister() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (loading) return;

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("All fields are required.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Step 1: Create Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password.trim()
      );

      const user = userCredential.user;

      if (!user) {
        throw new Error("User creation failed.");
      }

      // Step 2: Save user in Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: name.trim(),
        email: email.trim(),
        role: "cr",
        classId: null,
        createdAt: new Date()
      });

      // Step 3: Logout after registration
      await signOut(auth);

      // Step 4: Redirect
      router.push("/cr/login");

    } catch (err) {
      console.error("Registration Error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-10 max-w-md mx-auto">
      <h1 className="text-2xl font-bold">CR Register</h1>

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      <input
        type="text"
        placeholder="Full Name"
        className="border p-2 rounded"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        type="email"
        placeholder="Email"
        className="border p-2 rounded"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        className="border p-2 rounded"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        onClick={handleRegister}
        disabled={loading}
        className="bg-blue-600 text-white p-2 rounded disabled:opacity-50"
      >
        {loading ? "Registering..." : "Register"}
      </button>
    </div>
  );
}