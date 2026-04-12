import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, doc,
  getDocs, addDoc, setDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth, signInWithEmailAndPassword,
  signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { state } from './state.js';

// ========== CONFIGURAÇÃO ==========
const firebaseConfig = {
  apiKey: "AIzaSyDGd0_x3EOOHjBKgmeabcb85xdEjADL7lg",
  authDomain: "cautionorder-f132e.firebaseapp.com",
  projectId: "cautionorder-f132e",
  storageBucket: "cautionorder-f132e.firebasestorage.app",
  messagingSenderId: "620268886285",
  appId: "1:620268886285:web:ffad106d19d34b38a17844"
};

const app = initializeApp(firebaseConfig);
export const db  = getFirestore(app);
export const auth = getAuth(app);

// ========== AUTH ==========
export async function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function logout() {
  return signOut(auth);
}

export function onAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

// ========== CARREGAR DADOS ==========
export async function fbLoadTechs() {
  const snap = await getDocs(collection(db, 'technicians'));
  state.technicians = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
}

export async function fbLoadOrders() {
  const snap = await getDocs(query(collection(db, 'orders'), orderBy('created', 'desc')));
  state.orders = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
}

// ========== SALVAR / DELETAR ==========
export async function fbSaveTech(data) {
  if (data.firestoreId) {
    const { firestoreId, ...clean } = data;
    await setDoc(doc(db, 'technicians', firestoreId), clean);
    return firestoreId;
  } else {
    const ref = await addDoc(collection(db, 'technicians'), data);
    return ref.id;
  }
}

export async function fbDeleteTech(firestoreId) {
  await deleteDoc(doc(db, 'technicians', firestoreId));
}

export async function fbSaveOrder(os) {
  const ref = await addDoc(collection(db, 'orders'), { ...os, createdAt: serverTimestamp() });
  return ref.id;
}

export async function fbDeleteOrder(firestoreId) {
  await deleteDoc(doc(db, 'orders', firestoreId));
}

// ========== LISTENERS EM TEMPO REAL ==========
export function listenOrders(onUpdate) {
  onSnapshot(query(collection(db, 'orders'), orderBy('created', 'desc')), snap => {
    state.orders = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
    onUpdate();
  });
}

export function listenTechs(onUpdate) {
  onSnapshot(collection(db, 'technicians'), snap => {
    state.technicians = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
    onUpdate();
  });
}

// ========== CARREGAR DADOS ==========
export async function fbLoadTechs() {
  const snap = await getDocs(collection(db, 'technicians'));
  state.technicians = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
}

export async function fbLoadOrders() {
  const snap = await getDocs(query(collection(db, 'orders'), orderBy('created', 'desc')));
  state.orders = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
}

// ========== SALVAR / DELETAR ==========
export async function fbSaveTech(data) {
  if (data.firestoreId) {
    const { firestoreId, ...clean } = data;
    await setDoc(doc(db, 'technicians', firestoreId), clean);
    return firestoreId;
  } else {
    const ref = await addDoc(collection(db, 'technicians'), data);
    return ref.id;
  }
}

export async function fbDeleteTech(firestoreId) {
  await deleteDoc(doc(db, 'technicians', firestoreId));
}

export async function fbSaveOrder(os) {
  const ref = await addDoc(collection(db, 'orders'), { ...os, createdAt: serverTimestamp() });
  return ref.id;
}

export async function fbDeleteOrder(firestoreId) {
  await deleteDoc(doc(db, 'orders', firestoreId));
}

// ========== LISTENERS EM TEMPO REAL ==========
export function listenOrders(onUpdate) {
  onSnapshot(query(collection(db, 'orders'), orderBy('created', 'desc')), snap => {
    state.orders = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
    onUpdate();
  });
}

export function listenTechs(onUpdate) {
  onSnapshot(collection(db, 'technicians'), snap => {
    state.technicians = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
    onUpdate();
  });
}