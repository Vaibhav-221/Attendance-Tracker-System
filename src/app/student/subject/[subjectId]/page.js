"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  getDocs,
  collection
} from "firebase/firestore";
import { useParams } from "next/navigation";

export default function SubjectPage() {

  const { subjectId } = useParams();

  const [loading, setLoading] = useState(true);

  const [subjectName, setSubjectName] = useState("");

  const [total, setTotal] = useState(0);
  const [present, setPresent] = useState(0);
  const [absent, setAbsent] = useState(0);

  const [percent, setPercent] = useState(0);

  const [history, setHistory] = useState([]);

  useEffect(() => {

    const load = async () => {

      const user = auth.currentUser;

      const userDoc = await getDoc(
        doc(db,"users",user.uid)
      );

      const classId = userDoc.data().classId;

      const subjectDoc = await getDoc(
        doc(db,"classes",classId,"subjects",subjectId)
      );

      setSubjectName(subjectDoc.data().subjectName);

      const scheduleSnapshot = await getDocs(
        collection(db,"classes",classId,"dailySchedule")
      );

      let totalClasses = 0;
      let presentClasses = 0;

      let historyData = [];

      for (const scheduleDoc of scheduleSnapshot.docs) {

        const date = scheduleDoc.id;

        const subjects = scheduleDoc.data().subjects || [];

        if (subjects.includes(subjectId)) {

          totalClasses++;

          const attendanceDoc = await getDoc(
            doc(
              db,
              "classes",
              classId,
              "attendance",
              date,
              "students",
              user.uid
            )
          );

          let isPresent = false;

          if (
            attendanceDoc.exists() &&
            attendanceDoc.data().subjects.includes(subjectId)
          ) {
            presentClasses++;
            isPresent = true;
          }

          historyData.push({
            date,
            present: isPresent
          });

        }

      }

      const absentClasses = totalClasses - presentClasses;

      setTotal(totalClasses);
      setPresent(presentClasses);
      setAbsent(absentClasses);

      setHistory(historyData);

      const percentage =
        totalClasses === 0
          ? 0
          : ((presentClasses / totalClasses) * 100).toFixed(2);

      setPercent(percentage);

      setLoading(false);

    };

    load();

  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (

    <div className="min-h-screen bg-slate-950 p-8">

      <div className="max-w-2xl mx-auto">

        <h1 className="text-3xl font-bold text-white mb-6">
          {subjectName}
        </h1>

        {/* Percentage */}

        <div className="text-center mb-8">

          <p className="text-6xl font-bold text-emerald-400">
            {percent}%
          </p>

          <p className="text-slate-400">
            Attendance
          </p>

        </div>

        {/* Stats */}

        <div className="flex justify-around text-center mb-10">

          <div>
            <p className="text-3xl font-bold text-white">{total}</p>
            <p className="text-slate-400">Total</p>
          </div>

          <div>
            <p className="text-3xl font-bold text-emerald-400">{present}</p>
            <p className="text-slate-400">Present</p>
          </div>

          <div>
            <p className="text-3xl font-bold text-rose-400">{absent}</p>
            <p className="text-slate-400">Absent</p>
          </div>

        </div>

        {/* Attendance History */}

        <h2 className="text-xl font-semibold text-white mb-4">
          Attendance History
        </h2>

        <div className="space-y-3">

          {history.map((item,index) => (

            <div
              key={index}
              className="flex justify-between items-center bg-slate-900 border border-slate-700 rounded-lg p-4"
            >

              <span className="text-slate-300">
                {item.date}
              </span>

              {item.present ? (

                <span className="text-emerald-400 font-medium">
                  Present ✓
                </span>

              ) : (

                <span className="text-rose-400 font-medium">
                  Absent
                </span>

              )}

            </div>

          ))}

        </div>

      </div>

    </div>

  );

}