// ═══════════════════════════════════════════════════════════
//  StoryVital — Firebase Shared Module
//  모든 페이지에서 import해서 사용
// ═══════════════════════════════════════════════════════════

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
  getFirestore,
  collection, doc,
  addDoc, setDoc, getDoc, getDocs, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, where, serverTimestamp,
  writeBatch
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import {
  getAuth,
  signInWithPopup, signOut,
  GoogleAuthProvider,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

// ───────────────────────────────────────────────────────────
//  🔥 Firebase 설정 — 이 파일 딱 한 곳에만 붙여넣으면 전 페이지 적용
//  발급 방법: docs/FIREBASE_SETUP.md 참고
// ───────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:"AIzaSyBEkQmeFG8XGxNuYDZof_3_9oOS4cEMOyk",
  authDomain:"story-vital.firebaseapp.com",
  projectId:"story-vital",
  storageBucket:"story-vital.firebasestorage.app",
  messagingSenderId:"872952700994",
  appId:"1:872952700994:web:efa41cd38cd491fe5ccddb",
  measurementId:"G-T90FP0JRY7"
};

// ───────────────────────────────────────────────────────────
//  Firestore 컬렉션 경로 헬퍼
//  users/{uid}/works/{workId}/characters/{charId}
//  users/{uid}/works/{workId}/chapters/{chapId}
//  users/{uid}/works/{workId}/threads/{threadId}
//  users/{uid}/stats/{YYYY-MM-DD}
//  users/{uid}/profile
//  users/{uid}/subscription
// ───────────────────────────────────────────────────────────

// 설정값이 아직 자리표시자면 false — 각 페이지가 이 값으로 연동 여부를 판단
export const isConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY" && !!firebaseConfig.apiKey;

let _app, _db, _auth;

function getApp() {
  if (!_app) _app = initializeApp(firebaseConfig);
  return _app;
}
export function getDB()   { if (!_db)   _db   = getFirestore(getApp());  return _db; }
export function getAuthI(){ if (!_auth) _auth = getAuth(getApp());       return _auth; }

// ── paths ────────────────────────────────────────────────
export const paths = {
  profile:      (uid)                       => doc(getDB(), 'users', uid, 'profile', 'data'),
  subscription: (uid)                       => doc(getDB(), 'users', uid, 'subscription', 'data'),
  works:        (uid)                       => collection(getDB(), 'users', uid, 'works'),
  work:         (uid, wid)                  => doc(getDB(), 'users', uid, 'works', wid),
  characters:   (uid, wid)                  => collection(getDB(), 'users', uid, 'works', wid, 'characters'),
  character:    (uid, wid, cid)             => doc(getDB(), 'users', uid, 'works', wid, 'characters', cid),
  chapters:     (uid, wid)                  => collection(getDB(), 'users', uid, 'works', wid, 'chapters'),
  chapter:      (uid, wid, chapId)          => doc(getDB(), 'users', uid, 'works', wid, 'chapters', chapId),
  threads:      (uid, wid)                  => collection(getDB(), 'users', uid, 'works', wid, 'threads'),
  thread:       (uid, wid, tid)             => doc(getDB(), 'users', uid, 'works', wid, 'threads', tid),
  stat:         (uid, date)                 => doc(getDB(), 'users', uid, 'stats', date),
  stats:        (uid)                       => collection(getDB(), 'users', uid, 'stats'),
};

// ── Auth ─────────────────────────────────────────────────
export async function signInGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(getAuthI(), provider);
}
export async function signOutUser() {
  return signOut(getAuthI());
}
export function onAuth(cb) {
  return onAuthStateChanged(getAuthI(), cb);
}

// ── Profile ──────────────────────────────────────────────
export async function getProfile(uid) {
  const snap = await getDoc(paths.profile(uid));
  return snap.exists() ? snap.data() : null;
}
export async function saveProfile(uid, data) {
  return setDoc(paths.profile(uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

// ── Subscription ─────────────────────────────────────────
export async function getSubscription(uid) {
  const snap = await getDoc(paths.subscription(uid));
  return snap.exists() ? snap.data() : { plan: 'free', worksLimit: 1 };
}
export async function saveSubscription(uid, data) {
  return setDoc(paths.subscription(uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

// ── Works ────────────────────────────────────────────────
export async function getWorks(uid) {
  const snap = await getDocs(query(paths.works(uid), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function addWork(uid, data) {
  return addDoc(paths.works(uid), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}
export async function updateWork(uid, wid, data) {
  return updateDoc(paths.work(uid, wid), { ...data, updatedAt: serverTimestamp() });
}
export async function deleteWork(uid, wid) {
  // cascade delete via batch
  const db = getDB();
  const batch = writeBatch(db);
  const subs = ['characters','chapters','threads'];
  for (const sub of subs) {
    const snap = await getDocs(collection(db, 'users', uid, 'works', wid, sub));
    snap.docs.forEach(d => batch.delete(d.ref));
  }
  batch.delete(paths.work(uid, wid));
  return batch.commit();
}
export function watchWorks(uid, cb) {
  return onSnapshot(query(paths.works(uid), orderBy('createdAt', 'desc')), snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ── Characters ───────────────────────────────────────────
export async function getCharacters(uid, wid) {
  const snap = await getDocs(query(paths.characters(uid, wid), orderBy('createdAt', 'asc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function addCharacter(uid, wid, data) {
  return addDoc(paths.characters(uid, wid), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}
export async function updateCharacter(uid, wid, cid, data) {
  return updateDoc(paths.character(uid, wid, cid), { ...data, updatedAt: serverTimestamp() });
}
export async function deleteCharacter(uid, wid, cid) {
  return deleteDoc(paths.character(uid, wid, cid));
}
export function watchCharacters(uid, wid, cb) {
  return onSnapshot(query(paths.characters(uid, wid), orderBy('createdAt', 'asc')), snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ── Chapters ─────────────────────────────────────────────
export async function getChapters(uid, wid) {
  const snap = await getDocs(query(paths.chapters(uid, wid), orderBy('num', 'asc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function addChapter(uid, wid, data) {
  return addDoc(paths.chapters(uid, wid), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}
export async function updateChapter(uid, wid, chapId, data) {
  return updateDoc(paths.chapter(uid, wid, chapId), { ...data, updatedAt: serverTimestamp() });
}
export async function deleteChapter(uid, wid, chapId) {
  return deleteDoc(paths.chapter(uid, wid, chapId));
}
export function watchChapters(uid, wid, cb) {
  return onSnapshot(query(paths.chapters(uid, wid), orderBy('num', 'asc')), snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ── Threads ──────────────────────────────────────────────
export async function getThreads(uid, wid) {
  const snap = await getDocs(query(paths.threads(uid, wid), orderBy('createdAt', 'asc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function addThread(uid, wid, data) {
  return addDoc(paths.threads(uid, wid), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}
export async function updateThread(uid, wid, tid, data) {
  return updateDoc(paths.thread(uid, wid, tid), { ...data, updatedAt: serverTimestamp() });
}
export async function deleteThread(uid, wid, tid) {
  return deleteDoc(paths.thread(uid, wid, tid));
}
export function watchThreads(uid, wid, cb) {
  return onSnapshot(query(paths.threads(uid, wid), orderBy('createdAt', 'asc')), snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ── Writing Stats ─────────────────────────────────────────
export async function getStats(uid, days = 70) {
  const snap = await getDocs(paths.stats(uid));
  return snap.docs.map(d => ({ date: d.id, ...d.data() }));
}
export async function saveStat(uid, date, chars, goal) {
  return setDoc(paths.stat(uid, date), { chars, goal, updatedAt: serverTimestamp() }, { merge: true });
}

// ── Utility ──────────────────────────────────────────────
export function today() {
  return new Date().toISOString().split('T')[0];
}
export function isDemoMode() {
  return !getAuthI().currentUser;
}
