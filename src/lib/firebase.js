import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA7_e8KkzfntEYJUlEh1Dv-EnCLgPPu0N4",
  authDomain: "attendance-tracker-syste-92fa6.firebaseapp.com",
  projectId: "attendance-tracker-syste-92fa6",
  storageBucket: "attendance-tracker-syste-92fa6.firebasestorage.app",
  messagingSenderId: "832972322222",
  appId: "1:832972322222:web:648f496bb0344cfdf5c43f",
  measurementId: "G-0CH69FSBPF"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);