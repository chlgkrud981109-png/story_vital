import { auth } from './config.js';
import { 
  GoogleAuthProvider, 
  signInWithRedirect, 
  getRedirectResult,
  onAuthStateChanged,
  signOut 
} from "firebase/auth";
import { createUserProfile } from './db.js';

const provider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    await signInWithRedirect(auth, provider);
  } catch (error) {
    console.error("Login failed:", error.code, error.message);
    alert("구글 로그인 중 오류가 발생했습니다.");
    throw error;
  }
};

export const checkRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      // 회원가입 및 마지막 로그인 시간 업데이트
      await createUserProfile(result.user);
      return result.user;
    }
    return null;
  } catch (error) {
    console.error("Redirect login failed:", error);
    return null;
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
