import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Your provided credentials
const firebaseConfig = {
    apiKey: "AIzaSyDHdfCBUFACayHZ4l4iVRhl3B78g64zd_M",
    authDomain: "varun-iot-245b3.firebaseapp.com",
    databaseURL: "https://varun-iot-245b3-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "varun-iot-245b3",
    storageBucket: "varun-iot-245b3.firebasestorage.app",
    messagingSenderId: "332151626196",
    appId: "1:332151626196:web:40c390db67742da6b9de41",
    measurementId: "G-GFYEKLPEGY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and export it
export const database = getDatabase(app);