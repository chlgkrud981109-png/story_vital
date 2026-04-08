import { db } from './config.js';
import { 
  doc, setDoc, getDoc, collection, addDoc, serverTimestamp, 
  query, where, getDocs, onSnapshot, updateDoc, deleteDoc, 
  orderBy, limit 
} from "firebase/firestore";

// ─── 유저 (Users) ─────────────────────────────────────────

/** 유저 프로필 생성 및 최근 접속 시간 업데이트 */
export const createUserProfile = async (user) => {
  if (!user) return;
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  const now = serverTimestamp();
  
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      settings: { theme: 'dark', activeWorkId: null },
      createdAt: now,
      lastLoginAt: now
    });
  } else {
    await updateDoc(userRef, { lastLoginAt: now });
  }
};

/** 유저 설정 업데이트 (activeWorkId, 테마 등) */
export const updateUserSetting = async (userId, settings) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      settings: settings,
      updatedAt: serverTimestamp()
    });
  } catch (e) {
    console.error("[DB] User setting update failed:", e);
  }
};

/** 유저 설정 가져오기 */
export const getUserSettings = async (userId) => {
  try {
    const userSnap = await getDoc(doc(db, 'users', userId));
    return userSnap.exists() ? userSnap.data().settings : null;
  } catch (e) {
    return null;
  }
};

// ─── 작품 (Projects) ───────────────────────────────────────

/** 작품 저장 (Create/Update) */
export const saveProject = async (projectData, userId) => {
  try {
    const data = {
      ...projectData,
      userId,
      updatedAt: serverTimestamp()
    };
    if (projectData.id && !projectData.id.startsWith('demo')) {
      const ref = doc(db, "projects", projectData.id);
      await updateDoc(ref, data);
      return projectData.id;
    } else {
      const ref = collection(db, "projects");
      const docRef = await addDoc(ref, { ...data, createdAt: serverTimestamp() });
      return docRef.id;
    }
  } catch (e) {
    console.error("[DB] Project save failed:", e);
    throw e;
  }
};

/** 작품 삭제 (Delete) - 연관 데이터는 클라이언트에서 별도 처리 권장 */
export const deleteProject = async (projectId) => {
  try {
    await deleteDoc(doc(db, "projects", projectId));
    return true;
  } catch (e) {
    console.error("[DB] Project delete failed:", e);
    return false;
  }
};

/** 기본 프로젝트 가져오기 */
export const getDefaultProject = async (userId) => {
  const q = query(
    collection(db, "projects"), 
    where("userId", "==", userId), 
    where("isDefault", "==", true),
    limit(1)
  );
  const snap = await getDocs(q);
  if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() };
  return null;
};

// ─── 캐릭터 (Characters) ───────────────────────────────────

/** 캐릭터 저장 */
export const saveCharacter = async (charData, userId, projectId) => {
  try {
    const data = {
      ...charData,
      userId,
      projectId,
      status: charData.status || 'active',
      updatedAt: serverTimestamp()
    };
    if (charData.id && !charData.id.startsWith('demo') && !charData.id.startsWith('local')) {
      await updateDoc(doc(db, "characters", charData.id), data);
      return charData.id;
    } else {
      const docRef = await addDoc(collection(db, "characters"), { ...data, createdAt: serverTimestamp() });
      return docRef.id;
    }
  } catch (e) {
    console.error("[DB] Character save failed:", e);
    throw e;
  }
};

/** 캐릭터 삭제 */
export const deleteCharacter = async (charId) => {
  try {
    await deleteDoc(doc(db, "characters", charId));
    return charId;
  } catch (e) {
    console.error("[DB] Character delete failed:", e);
    throw e;
  }
};

/** 캐릭터 실시간 구독 */
export const subscribeToCharacters = (userId, projectId, callback, statusFilter = null) => {
  let q = query(
    collection(db, "characters"),
    where("userId", "==", userId),
    where("projectId", "==", projectId)
  );
  if (statusFilter) {
    q = query(q, where("status", "==", statusFilter));
  }
  return onSnapshot(q, (snapshot) => {
    const chars = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(chars);
  });
};

// ─── 타임라인/챕터/복선 (Timeline Events) ─────────────────────

/** 이벤트 저장 (Chapter/Thread) */
export const saveTimelineEvent = async (eventData, userId, projectId) => {
  try {
    const data = {
      ...eventData,
      userId,
      projectId,
      updatedAt: serverTimestamp()
    };
    if (eventData.id && !eventData.id.startsWith('demo') && !eventData.id.startsWith('ch-') && !eventData.id.startsWith('th-')) {
      await updateDoc(doc(db, "timeline_events", eventData.id), data);
      return eventData.id;
    } else {
      const docRef = await addDoc(collection(db, "timeline_events"), { ...data, createdAt: serverTimestamp() });
      return docRef.id;
    }
  } catch (e) {
    console.error("[DB] Timeline event save failed:", e);
    throw e;
  }
};

/** 이벤트 삭제 */
export const deleteTimelineEvent = async (eventId) => {
  try {
    await deleteDoc(doc(db, "timeline_events", eventId));
    return true;
  } catch (e) {
    console.error("[DB] Timeline event delete failed:", e);
    return false;
  }
};

/** 이벤트 실시간 구독 */
export const subscribeToTimelineEvents = (projectId, callback) => {
  const q = query(
    collection(db, "timeline_events"),
    where("projectId", "==", projectId)
  );
  return onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    events.sort((a, b) => (a.order || 0) - (b.order || 0));
    callback(events);
  });
};

// ─── 통계 및 스프린트 (Stats & Sprints) ──────────────────────

/** 집필 기록 저장 (오늘의 자수) */
export const saveDailyStat = async (userId, count) => {
  const today = new Date().toISOString().split('T')[0];
  try {
    const ref = doc(db, "users", userId, "stats", today);
    await setDoc(ref, {
      chars: count,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (e) {
    console.error("[DB] Daily stat save failed:", e);
  }
};

/** 스프린트 세션 저장 */
export const saveSprintSession = async (userId, sprintData) => {
  try {
    const ref = collection(db, "users", userId, "sprints");
    const docRef = await addDoc(ref, {
      ...sprintData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (e) {
    console.error("[DB] Sprint session save failed:", e);
    return null;
  }
};
