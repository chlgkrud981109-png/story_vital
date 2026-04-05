import { auth } from './config.js';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged,
  signOut 
} from "firebase/auth";
import { createUserProfile } from './db.js';

const provider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    // 회원가입 및 마지막 로그인 시간 업데이트
    await createUserProfile(user);
    return user;
  } catch (error) {
    console.error("Login failed:", error.code, error.message);
    alert("구글 로그인 중 오류가 발생했습니다.");
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
