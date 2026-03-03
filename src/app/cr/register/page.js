"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function CRRegister() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleRegister = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      // Save user data in Firestore
      await setDoc(doc(db, "users", user.uid), {
        name,
        email,
        role: "cr",
        classId: null,
        createdAt: new Date()
      });

      alert("CR Registered Successfully");
      router.push("/cr/login");

    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-10">
      <h1 className="text-xl font-bold">CR Register</h1>

      <input
        type="text"
        placeholder="Full Name"
        className="border p-2"
        onChange={(e) => setName(e.target.value)}
      />

      <input
        type="email"
        placeholder="Email"
        className="border p-2"
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        className="border p-2"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        onClick={handleRegister}
        className="bg-blue-600 text-white p-2"
      >
        Register
      </button>
    </div>
  );
}