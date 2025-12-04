import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getAuth as getFirebaseAuthInstance,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
  Auth,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Lazy initialization to prevent build-time errors
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

const getFirebaseApp = () => {
  if (!app) {
    // Only initialize if we have valid config
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      throw new Error('Firebase configuration is missing. Please check your environment variables.');
    }
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return app;
};

const getFirebaseAuth = (): Auth => {
  if (!auth) {
    auth = getFirebaseAuthInstance(getFirebaseApp());
  }
  return auth;
};

const getGoogleProvider = () => {
  if (!googleProvider) {
    googleProvider = new GoogleAuthProvider();
  }
  return googleProvider;
};

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(getFirebaseAuth(), getGoogleProvider());
    return { user: result.user, error: null };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return { user: null, error: errorMessage };
  }
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
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
    const result = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
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
    await signOut(getFirebaseAuth());
    return { error: null };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return { error: errorMessage };
  }
};

// Export auth getter and onAuthStateChanged
export const getAuthInstance = getFirebaseAuth;
export { onAuthStateChanged };
export type { User };
