import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
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

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "folkerdb.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "folkerdb",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "folkerdb.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "724013743681",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:724013743681:web:2e15ebcf225eaca31290c0",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-L5ZMLWW2K0",
};

export function isFirebaseConfigured(): boolean {
  return Boolean(
    (process.env.NEXT_PUBLIC_FIREBASE_API_KEY || firebaseConfig.apiKey) &&
    (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || firebaseConfig.projectId)
  );
}

// Initialize Firebase
export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Analytics (safe for browser and SSR)
export let analytics: Analytics | null = null;
if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {});
}

let auth: Auth | null = null;
let db: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp {
  return app;
}

export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined") return null;
  if (!analytics) {
    try {
      const supported = await isSupported();
      if (supported) {
        analytics = getAnalytics(app);
      }
    } catch {
      // Ignored if blocked by client
    }
  }
  return analytics;
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
  // Guard: If Firestore is not enabled or provisioned, return null to avoid
  // "@firebase/firestore: Database '(default)' not found" retry noise in console.
  if (process.env.NEXT_PUBLIC_ENABLE_FIRESTORE !== "true") {
    return null;
  }
  const fbApp = getFirebaseApp();
  if (!fbApp) {
    return null;
  }
  if (!db) {
    try {
      db = getFirestore(fbApp);
    } catch {
      return null;
    }
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
 * Signs up using Firebase Email/Password Auth.
 * Falls back to local enterprise profile if Firebase is unconfigured or blocked.
 */
export async function signUpWithEmail(
  email: string,
  pass: string,
  displayName?: string,
  tenantId: string = "acme-core",
  department: string = "Engineering Platform"
): Promise<EnterpriseUser> {
  const authInstance = getFirebaseAuth();
  if (!authInstance) {
    const fallbackUser: EnterpriseUser = {
      uid: `user-${Date.now()}`,
      displayName: displayName || email.split("@")[0],
      email,
      tenantId,
      role: "Lead Systems Architect",
      department,
      isFirebaseAuthenticated: false,
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("companymind_user", JSON.stringify(fallbackUser));
    }
    return fallbackUser;
  }

  try {
    const cred = await createUserWithEmailAndPassword(authInstance, email, pass);
    if (displayName && cred.user) {
      await updateProfile(cred.user, { displayName }).catch(() => {});
    }

    const enterpriseUser: EnterpriseUser = {
      uid: cred.user.uid,
      displayName: displayName || cred.user.displayName || email.split("@")[0],
      email: cred.user.email || email,
      tenantId,
      role: "Lead Systems Architect",
      department,
      isFirebaseAuthenticated: true,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("companymind_user", JSON.stringify(enterpriseUser));
    }

    // Fire-and-forget Firestore profile save
    try {
      const firestore = getFirebaseFirestore();
      if (firestore) {
        addDoc(collection(firestore, "users"), {
          uid: enterpriseUser.uid,
          email: enterpriseUser.email,
          displayName: enterpriseUser.displayName,
          tenantId: enterpriseUser.tenantId,
          lastLogin: serverTimestamp(),
        }).catch(() => {});
      }
    } catch {}

    return enterpriseUser;
  } catch (error: any) {
    if (error?.code === "auth/email-already-in-use") {
      throw new Error("This email is already registered. Please switch to the Sign In tab.");
    }
    if (error?.code === "auth/weak-password") {
      throw new Error("Password should be at least 6 characters.");
    }
    if (error?.code === "auth/invalid-email") {
      throw new Error("Invalid email address format.");
    }
    if (error?.code === "auth/operation-not-allowed") {
      console.warn("Firebase Email/Password provider not enabled in console, using enterprise persona fallback:", error?.message);
      const fallbackUser: EnterpriseUser = {
        uid: `user-${Date.now()}`,
        displayName: displayName || email.split("@")[0],
        email,
        tenantId,
        role: "Lead Systems Architect",
        department,
        isFirebaseAuthenticated: false,
      };
      if (typeof window !== "undefined") {
        localStorage.setItem("companymind_user", JSON.stringify(fallbackUser));
      }
      return fallbackUser;
    }
    throw error;
  }
}

/**
 * Signs in using Firebase Email/Password Auth.
 * Falls back to local enterprise profile if Firebase is unconfigured or blocked.
 */
export async function signInWithEmail(
  email: string,
  pass: string,
  tenantId: string = "acme-core"
): Promise<EnterpriseUser> {
  const authInstance = getFirebaseAuth();
  if (!authInstance) {
    const fallbackUser: EnterpriseUser = {
      uid: `user-${Date.now()}`,
      displayName: email.split("@")[0].replace(".", " "),
      email,
      tenantId,
      role: "Senior Staff Engineer",
      department: "Engineering Platform",
      isFirebaseAuthenticated: false,
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("companymind_user", JSON.stringify(fallbackUser));
    }
    return fallbackUser;
  }

  try {
    const cred = await signInWithEmailAndPassword(authInstance, email, pass);
    const enterpriseUser: EnterpriseUser = {
      uid: cred.user.uid,
      displayName: cred.user.displayName || email.split("@")[0].replace(".", " "),
      email: cred.user.email || email,
      tenantId,
      role: "Senior Staff Engineer",
      department: "Engineering Platform",
      isFirebaseAuthenticated: true,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("companymind_user", JSON.stringify(enterpriseUser));
    }

    return enterpriseUser;
  } catch (error: any) {
    if (error?.code === "auth/user-not-found" || error?.code === "auth/wrong-password" || error?.code === "auth/invalid-credential") {
      throw new Error("Invalid email or password. Please verify your credentials or register.");
    }
    if (error?.code === "auth/operation-not-allowed") {
      console.warn("Firebase Email/Password not enabled in console, falling back to local enterprise persona:", error?.message);
      const fallbackUser: EnterpriseUser = {
        uid: `user-${Date.now()}`,
        displayName: email.split("@")[0].replace(".", " "),
        email,
        tenantId,
        role: "Senior Staff Engineer",
        department: "Engineering Platform",
        isFirebaseAuthenticated: false,
      };
      if (typeof window !== "undefined") {
        localStorage.setItem("companymind_user", JSON.stringify(fallbackUser));
      }
      return fallbackUser;
    }
    throw error;
  }
}

/**
 * Subscribes to Firebase auth state changes.
 */
export function onFirebaseAuthStateChanged(
  callback: (user: EnterpriseUser | null) => void
): () => void {
  const authInstance = getFirebaseAuth();
  if (!authInstance) {
    return () => {};
  }
  return onAuthStateChanged(authInstance, (fbUser) => {
    if (fbUser) {
      const enterpriseUser: EnterpriseUser = {
        uid: fbUser.uid,
        displayName: fbUser.displayName || fbUser.email?.split("@")[0] || "Enterprise User",
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
      callback(enterpriseUser);
    } else {
      callback(null);
    }
  });
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
