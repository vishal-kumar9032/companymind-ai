import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User,
  onAuthStateChanged,
  Auth,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  Firestore,
} from "firebase/firestore";

// Firebase credentials configuration strictly loaded from environment variables
// No secrets or keys are hardcoded in the codebase
export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) {
    return null;
  }
  if (!app) {
    if (getApps().length > 0) {
      app = getApp();
    } else {
      app = initializeApp(firebaseConfig);
    }
  }
  return app;
}

export function getFirebaseAuth(): Auth | null {
  const fbApp = getFirebaseApp();
  if (!fbApp) {
    return null;
  }
  if (!auth) {
    auth = getAuth(fbApp);
  }
  return auth;
}

export function getFirebaseFirestore(): Firestore | null {
  const fbApp = getFirebaseApp();
  if (!fbApp) {
    return null;
  }
  if (!db) {
    db = getFirestore(fbApp);
  }
  return db;
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export interface EnterpriseUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  tenantId: string;
  role: string;
  department: string;
  isFirebaseAuthenticated: boolean;
}

// Preset Enterprise Profiles for instant demo / verification
export const DEMO_ENTERPRISE_USERS: EnterpriseUser[] = [
  {
    uid: "sarah-chen-infra",
    displayName: "Sarah Chen",
    email: "sarah.chen@acme.corp",
    photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    tenantId: "acme-core",
    role: "Staff Principal Engineer",
    department: "Core Infrastructure",
    isFirebaseAuthenticated: false,
  },
  {
    uid: "alex-mercer-payments",
    displayName: "Alex Mercer",
    email: "alex.mercer@finflow.io",
    photoURL: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    tenantId: "finflow-global",
    role: "Lead Platform Engineer",
    department: "Checkout & Payments",
    isFirebaseAuthenticated: false,
  },
  {
    uid: "elena-rostova-mobile",
    displayName: "Elena Rostova",
    email: "elena.rostova@acme.corp",
    photoURL: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    tenantId: "acme-core",
    role: "Lead Mobile Architect",
    department: "Mobile Platform",
    isFirebaseAuthenticated: false,
  },
];

/**
 * Signs in using Firebase Google Auth with popup.
 * Falls back to local enterprise profile if credentials are unconfigured in environment.
 */
export async function signInWithGoogleAuth(
  presetUser?: EnterpriseUser
): Promise<EnterpriseUser> {
  if (presetUser) {
    if (typeof window !== "undefined") {
      localStorage.setItem("companymind_user", JSON.stringify(presetUser));
    }
    return presetUser;
  }

  try {
    const authInstance = getFirebaseAuth();
    if (!authInstance) {
      const defaultUser = DEMO_ENTERPRISE_USERS[0];
      if (typeof window !== "undefined") {
        localStorage.setItem("companymind_user", JSON.stringify(defaultUser));
      }
      return defaultUser;
    }

    const result = await signInWithPopup(authInstance, googleProvider);
    const fbUser = result.user;

    const enterpriseUser: EnterpriseUser = {
      uid: fbUser.uid,
      displayName: fbUser.displayName || "Enterprise User",
      email: fbUser.email || "user@enterprise.com",
      photoURL: fbUser.photoURL || undefined,
      tenantId: "acme-core",
      role: "Enterprise Engineer",
      department: "Engineering & Architecture",
      isFirebaseAuthenticated: true,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("companymind_user", JSON.stringify(enterpriseUser));
    }

    // Attempt to persist user profile in Firestore
    try {
      const firestore = getFirebaseFirestore();
      if (firestore) {
        // Fire-and-forget: login must never wait on a profile write (Firestore may be
        // unprovisioned or offline, in which case the write promise never settles).
        addDoc(collection(firestore, "users"), {
          uid: enterpriseUser.uid,
          email: enterpriseUser.email,
          displayName: enterpriseUser.displayName,
          tenantId: enterpriseUser.tenantId,
          lastLogin: serverTimestamp(),
        }).catch(() => {});
      }
    } catch {
      // Local fallback if Firestore rules or offline
    }

    return enterpriseUser;
  } catch (error: any) {
    console.warn("Firebase Google Auth popup encountered an issue, defaulting to Demo Profile:", error?.message);
    const defaultUser = DEMO_ENTERPRISE_USERS[0];
    if (typeof window !== "undefined") {
      localStorage.setItem("companymind_user", JSON.stringify(defaultUser));
    }
    return defaultUser;
  }
}

/**
 * Sign out user
 */
export async function signOutEnterpriseUser(): Promise<void> {
  try {
    const authInstance = getFirebaseAuth();
    if (authInstance) {
      await signOut(authInstance);
    }
  } catch {
    // Ignore error
  }
  if (typeof window !== "undefined") {
    localStorage.removeItem("companymind_user");
  }
}

/**
 * Multi-Tenant Data Storage: Save query log in Firestore
 */
export async function saveTenantQuery(
  tenantId: string,
  userEmail: string,
  question: string,
  answer: string,
  model: string,
  latencyMs: number
): Promise<void> {
  try {
    const firestore = getFirebaseFirestore();
    if (!firestore) return;
    await addDoc(collection(firestore, `tenants/${tenantId}/queries`), {
      userEmail,
      question,
      answer: answer.slice(0, 500),
      model,
      latencyMs,
      timestamp: serverTimestamp(),
    });
  } catch {
    // Graceful offline fallback
  }
}
