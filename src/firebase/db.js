import { db } from './config.js';
import { doc, setDoc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";

// Users 컬렉션
export const createUserProfile = async (user) => {
  if (!user) return;
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    // 최초 로그인 시 유저 데이터 생성
    await setDoc(userRef, {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp()
    });
  } else {
    // 기존 유저는 접속 시간만 업데이트
    await setDoc(userRef, {
      lastLoginAt: serverTimestamp()
    }, { merge: true });
  }
};

// Projects: 기본 프로젝트 가져오기 (없으면 자동 생성)
export const getDefaultProject = async (userId) => {
  const q = query(
    collection(db, "projects"), 
    where("userId", "==", userId), 
    where("isDefault", "==", true)
  );
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
  } else {
    const docRef = await addDoc(collection(db, "projects"), {
      userId: userId,
      title: "기본 프로젝트",
      description: "첫 번째 웹소설 프로젝트입니다.",
      genre: "판타지",
      isDefault: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, userId, title: "기본 프로젝트", isDefault: true };
  }
};

// Characters: 캐릭터 저장
export const saveCharacter = async (projectId, characterData) => {
  try {
    const docRef = await addDoc(collection(db, "characters"), {
      projectId,
      ...characterData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (e) {
    console.error("캐릭터 저장 실패: ", e);
    throw e;
  }
};
