import { auth } from './config.js';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged,
  signOut 
} from "firebase/auth";
import { createUserProfile } from './db.js';

const provider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  console.log("[Auth] Calling signInWithPopup(auth, provider)...");
  try {
    const result = await signInWithPopup(auth, provider);
    if (result && result.user) {
      console.log("[Auth] Popup successful, user:", result.user.displayName);
      await createUserProfile(result.user);
      return result.user;
    }
  } catch (error) {
    console.error("Login failed:", error.code, error.message);
    alert(`구글 로그인 중 오류가 발생했습니다: ${error.message}`);
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
