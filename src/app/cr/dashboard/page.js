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
  getDocs,
  deleteDoc
} from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function CRDashboard() {

  const router = useRouter();

  const [view, setView] = useState("cr");

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  const [className, setClassName] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState("");

  const [todaySubjects, setTodaySubjects] = useState([]);
  const [published, setPublished] = useState(false);

  const [actionLoading, setActionLoading] = useState({});

  const today = new Date().toISOString().split("T")[0];

  const setLoadingState = (key, value) => {
    setActionLoading((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  useEffect(() => {

    const init = async () => {

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
        fetchJoinCode(user.uid);
      }

      setLoading(false);

    };

    init();

  }, []);

  const generateJoinCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const fetchJoinCode = async (classId) => {

    const classDoc = await getDoc(doc(db, "classes", classId));

    if (classDoc.exists()) {
      setJoinCode(classDoc.data().joinCode);
    }

  };

  const fetchSubjects = async (classId) => {

    const snapshot = await getDocs(
      collection(db, "classes", classId, "subjects")
    );

    setSubjects(
      snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }))
    );

  };

  const fetchTodaySchedule = async (classId) => {

    const ref = doc(db, "classes", classId, "dailySchedule", today);

    const data = await getDoc(ref);

    if (data.exists()) {
      setTodaySubjects(data.data().subjects || []);
      setPublished(data.data().published || false);
    }

  };

  const handleCreateClass = async () => {

    if (!className.trim()) return;

    try {

      setLoadingState("createClass", true);

      const user = auth.currentUser;

      const classId = user.uid;
      const code = generateJoinCode();

      await setDoc(doc(db, "classes", classId), {
        className: className.trim(),
        crId: user.uid,
        joinCode: code,
        createdAt: new Date()
      });

      await updateDoc(doc(db, "users", user.uid), {
        classId
      });

      setJoinCode(code);

      setUserData((prev) => ({
        ...prev,
        classId
      }));

    } catch (err) {
      console.error(err);
    }

    setLoadingState("createClass", false);

  };

  const handleAddSubject = async () => {

    if (!newSubject.trim()) return;

    try {

      setLoadingState("addSubject", true);

      const user = auth.currentUser;

      await addDoc(
        collection(db, "classes", user.uid, "subjects"),
        {
          subjectName: newSubject.trim(),
          createdAt: new Date()
        }
      );

      setNewSubject("");
      await fetchSubjects(user.uid);

    } catch (err) {
      console.error(err);
    }

    setLoadingState("addSubject", false);

  };

  const handleDeleteSubject = async (subjectId) => {

    try {

      setLoadingState(`delete-${subjectId}`, true);

      const user = auth.currentUser;

      await deleteDoc(
        doc(db, "classes", user.uid, "subjects", subjectId)
      );

      await fetchSubjects(user.uid);

    } catch (err) {
      console.error(err);
    }

    setLoadingState(`delete-${subjectId}`, false);

  };

  const handleAddToToday = async (subjectId) => {

    if (todaySubjects.includes(subjectId)) return;

    try {

      setLoadingState(`addToday-${subjectId}`, true);

      const user = auth.currentUser;

      const updated = [...todaySubjects, subjectId];

      const ref = doc(
        db,
        "classes",
        user.uid,
        "dailySchedule",
        today
      );

      await setDoc(
        ref,
        {
          subjects: updated,
          published: false
        },
        { merge: true }
      );

      setTodaySubjects(updated);

    } catch (err) {
      console.error(err);
    }

    setLoadingState(`addToday-${subjectId}`, false);

  };

  const handleRemoveFromToday = async (subjectId) => {

    try {

      setLoadingState(`removeToday-${subjectId}`, true);

      const user = auth.currentUser;

      const updated = todaySubjects.filter((id) => id !== subjectId);

      const ref = doc(
        db,
        "classes",
        user.uid,
        "dailySchedule",
        today
      );

      await setDoc(ref, { subjects: updated, published: false });

      setTodaySubjects(updated);

    } catch (err) {
      console.error(err);
    }

    setLoadingState(`removeToday-${subjectId}`, false);

  };

  const publishSchedule = async () => {

    if (todaySubjects.length === 0) {
      alert("Add subjects first");
      return;
    }

    try {

      setLoadingState("publish", true);

      const user = auth.currentUser;

      const ref = doc(
        db,
        "classes",
        user.uid,
        "dailySchedule",
        today
      );

      await setDoc(
        ref,
        {
          subjects: todaySubjects,
          published: true
        },
        { merge: true }
      );

      setPublished(true);

    } catch (err) {
      console.error(err);
    }

    setLoadingState("publish", false);

  };

  if (loading) return <div className="p-10">Loading...</div>;

  return (

    <div className="min-h-screen bg-slate-950 text-slate-200 p-10">

      <div className="max-w-3xl mx-auto">

        <h1 className="text-3xl font-bold mb-6">
          CR Dashboard
        </h1>

        <div className="flex gap-3 mb-8">

          <button
            onClick={() => setView("cr")}
            className={`px-4 py-2 rounded ${
              view === "cr"
                ? "bg-blue-600 text-white"
                : "bg-slate-700"
            }`}
          >
            CR Panel
          </button>

          <button
            onClick={() => setView("student")}
            className={`px-4 py-2 rounded ${
              view === "student"
                ? "bg-green-600 text-white"
                : "bg-slate-700"
            }`}
          >
            My Attendance
          </button>

        </div>

        {view === "student" && (

          <iframe
            src="/student/dashboard"
            className="w-full h-[800px] border border-slate-700 rounded"
          />

        )}

        {view === "cr" && (

          <>

            {!userData.classId ? (

              <div className="flex gap-2">

                <input
                  type="text"
                  placeholder="Class Name"
                  className="border border-slate-700 bg-slate-900 p-2 rounded flex-1"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                />

                <button
                  disabled={actionLoading.createClass}
                  onClick={handleCreateClass}
                  className="bg-green-600 px-4 py-2 rounded"
                >
                  {actionLoading.createClass ? "Creating..." : "Create Class"}
                </button>

              </div>

            ) : (

              <>

                <div className="bg-slate-900 p-4 rounded mb-6 border border-slate-700">

                  <p className="text-sm text-slate-400">
                    Share this code with students
                  </p>

                  <p className="text-2xl font-bold text-green-400">
                    Join Code: {joinCode}
                  </p>

                </div>

                <h2 className="text-lg font-semibold mb-3">
                  Semester Subjects
                </h2>

                <div className="flex gap-2 mb-4">

                  <input
                    type="text"
                    placeholder="Add Subject"
                    className="border border-slate-700 bg-slate-900 p-2 flex-1 rounded"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                  />

                  <button
                    disabled={actionLoading.addSubject}
                    onClick={handleAddSubject}
                    className="bg-blue-600 px-4 py-2 rounded"
                  >
                    {actionLoading.addSubject ? "Adding..." : "Add"}
                  </button>

                </div>

                <ul className="space-y-2">

                  {subjects.map((sub) => (

                    <li
                      key={sub.id}
                      className="bg-slate-900 p-3 rounded flex justify-between border border-slate-700"
                    >

                      {sub.subjectName}

                      <div className="flex gap-2">

                        <button
                          disabled={actionLoading[`addToday-${sub.id}`]}
                          onClick={() => handleAddToToday(sub.id)}
                          className="bg-purple-600 px-3 py-1 rounded"
                        >
                          {actionLoading[`addToday-${sub.id}`]
                            ? "Adding..."
                            : "Add to Today"}
                        </button>

                        <button
                          disabled={actionLoading[`delete-${sub.id}`]}
                          onClick={() => handleDeleteSubject(sub.id)}
                          className="bg-red-600 px-3 py-1 rounded"
                        >
                          {actionLoading[`delete-${sub.id}`]
                            ? "Deleting..."
                            : "Delete"}
                        </button>

                      </div>

                    </li>

                  ))}

                </ul>

                <h2 className="text-lg font-semibold mt-8 mb-3">
                  Today's Schedule
                </h2>

                <ul className="space-y-2">

                  {todaySubjects.map((id) => {

                    const sub = subjects.find((s) => s.id === id);

                    return (

                      <li
                        key={id}
                        className="bg-slate-900 p-3 rounded flex justify-between border border-slate-700"
                      >

                        {sub?.subjectName}

                        <button
                          disabled={actionLoading[`removeToday-${id}`]}
                          onClick={() => handleRemoveFromToday(id)}
                          className="bg-red-500 px-3 py-1 rounded"
                        >
                          {actionLoading[`removeToday-${id}`]
                            ? "Removing..."
                            : "Remove"}
                        </button>

                      </li>

                    );

                  })}

                </ul>

                <button
                  disabled={actionLoading.publish || published}
                  onClick={publishSchedule}
                  className="bg-green-600 mt-6 px-4 py-2 rounded"
                >
                  {actionLoading.publish
                    ? "Publishing..."
                    : published
                    ? "Published ✓"
                    : "Publish"}
                </button>

              </>

            )}

          </>

        )}

      </div>

    </div>

  );

}