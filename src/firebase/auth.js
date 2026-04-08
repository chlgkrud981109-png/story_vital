import { auth } from './config.js';
import { 
  GoogleAuthProvider, 
  signInWithRedirect, 
  onAuthStateChanged,
  signOut 
} from "firebase/auth";
import { createUserProfile } from './db.js';

const provider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  console.log("[Auth] Calling signInWithRedirect(auth, provider)...");
  try {
    await signInWithRedirect(auth, provider);
    // Note: getRedirectResult should be handled in the main entry point (index.html)
  } catch (error) {
    console.error("Login initiation failed:", error.code, error.message);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout failed:", error);
  }
};

export const subscribeToAuthChanges = (callback) => {
  return onAuthStateChanged(auth, callback);
};
