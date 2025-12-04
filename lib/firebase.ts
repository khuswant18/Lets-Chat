import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user, error: null };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return { user: null, error: errorMessage };
  }
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { user: result.user, error: null };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return { user: null, error: errorMessage };
  }
};

// Sign up with email and password
export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName: string
) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    // Update the user's display name
    await updateProfile(result.user, { displayName });
    return { user: result.user, error: null };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return { user: null, error: errorMessage };
  }
};

// Sign out
export const logOut = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return { error: errorMessage };
  }
};

export { auth, onAuthStateChanged };
export type { User };
