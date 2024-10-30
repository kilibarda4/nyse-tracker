// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCuseRknx5lb_0yV4hFah97V63Ojuy8YUE",
  authDomain: "cloud-computing-project4333.firebaseapp.com",
  projectId: "cloud-computing-project4333",
  storageBucket: "cloud-computing-project4333.appspot.com",
  messagingSenderId: "727501374435",
  appId: "1:727501374435:web:362594635db0f4ad32d6d6",
  measurementId: "G-C86N9G6TZ5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
export {db, auth};