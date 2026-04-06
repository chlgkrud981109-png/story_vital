import { db } from './config.js';
import { doc, setDoc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs, onSnapshot, updateDoc, deleteDoc } from "firebase/firestore";

// Characters: 캐릭터 삭제 (Delete)
export const deleteCharacter = async (charId) => {
  try {
    const charRef = doc(db, 'characters', charId);
    await deleteDoc(charRef);
    return charId;
  } catch (e) {
    console.error("캐릭터 삭제 실패: ", e);
    throw e;
  }
};


// Characters: 캐릭터 수정 (Update)
export const updateCharacter = async (charId, characterData) => {
  try {
    const charRef = doc(db, 'characters', charId);
    await updateDoc(charRef, {
      ...characterData,
      updatedAt: serverTimestamp()
    });
    return charId;
  } catch (e) {
    console.error("캐릭터 수정 실패: ", e);
    throw e;
  }
};


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
  console.log(`[DB] getDefaultProject 호출됨. userId: ${userId}`);
  const q = query(
    collection(db, "projects"), 
    where("userId", "==", userId), 
    where("isDefault", "==", true)
  );
  
  console.log(`[DB] getDocs 쿼리 실행 시작...`);
  const querySnapshot = await getDocs(q);
  console.log(`[DB] getDocs 응답 받음. 결과 리스트 크기: ${querySnapshot.size}`);
  
  if (!querySnapshot.empty) {
    console.log(`[DB] 기존 프로젝트 발견. ID: ${querySnapshot.docs[0].id}`);
    return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
  } else {
    console.log(`[DB] 기존 프로젝트가 없습니다. '나의 첫 작품' 즉시 생성 로직 실행...`);
    const docRef = await addDoc(collection(db, "projects"), {
      userId: userId,
      title: "나의 첫 작품",
      description: "자동으로 생성된 첫 번째 웹소설 프로젝트입니다.",
      genre: "판타지",
      isDefault: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log(`[DB] 새 프로젝트 생성 완료. ID: ${docRef.id}`);
    return { id: docRef.id, userId, title: "나의 첫 작품", isDefault: true };
  }
};

// Characters: 캐릭터 아카이브 (Soft Delete)
export const archiveCharacter = async (charId) => {
  try {
    const charRef = doc(db, 'characters', charId);
    await updateDoc(charRef, {
      status: 'archived',
      updatedAt: serverTimestamp()
    });
    return charId;
  } catch (e) {
    console.error("캐릭터 아카이브 실패: ", e);
    throw e;
  }
};

// Characters: 캐릭터 복구 (Restore)
export const restoreCharacter = async (charId) => {
  try {
    const charRef = doc(db, 'characters', charId);
    await updateDoc(charRef, {
      status: 'active',
      updatedAt: serverTimestamp()
    });
    return charId;
  } catch (e) {
    console.error("캐릭터 복구 실패: ", e);
    throw e;
  }
};

// Timeline Events: 사건 저장
export const saveTimelineEvent = async (eventData) => {
  try {
    const docRef = await addDoc(collection(db, "timeline_events"), {
      ...eventData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (e) {
    console.error("타임라인 사건 저장 실패: ", e);
    throw e;
  }
};

// Timeline Events: 사건 수정
export const updateTimelineEvent = async (eventId, eventData) => {
  try {
    const eventRef = doc(db, 'timeline_events', eventId);
    await updateDoc(eventRef, {
      ...eventData,
      updatedAt: serverTimestamp()
    });
    return eventId;
  } catch (e) {
    console.error("타임라인 사건 수정 실패: ", e);
    throw e;
  }
};

// Timeline Events: 실시간 구독
export const subscribeToTimelineEvents = (projectId, callback) => {
  const q = query(
    collection(db, "timeline_events"),
    where("projectId", "==", projectId)
  );
  return onSnapshot(q, (snapshot) => {
    const events = [];
    snapshot.forEach((doc) => {
      events.push({ id: doc.id, ...doc.data() });
    });
    // 정렬 (order 기준)
    events.sort((a, b) => (a.order || 0) - (b.order || 0));
    callback(events);
  });
};

// Characters: 캐릭터 저장 (기본값 status: 'active')
export const saveCharacter = async (characterData, userId, projectId) => {
  try {
    const docRef = await addDoc(collection(db, "characters"), {
      userId,
      projectId,
      status: 'active',
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

// Characters: 본인 캐릭터 실시간 구독 (상태 필터 추가 가능)
export const subscribeToCharacters = (userId, callback, status = 'active') => {
  const q = query(
    collection(db, "characters"),
    where("userId", "==", userId),
    where("status", "==", status)
  );
  return onSnapshot(q, (snapshot) => {
    const characters = [];
    snapshot.forEach((doc) => {
      characters.push({ id: doc.id, ...doc.data() });
    });
    callback(characters);
  });
};
