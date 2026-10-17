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

// Firebase configuration strictly loaded from environment variables
// No secrets or keys are hardcoded in the codebase
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
};

export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
export let analytics: Analytics | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) {
    return null;
  }
  if (!app) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }
  return app;
}

export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined") return null;
  const fbApp = getFirebaseApp();
  if (!fbApp) return null;
  if (!analytics) {
    try {
      const supported = await isSupported();
      if (supported) {
        analytics = getAnalytics(fbApp);
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

// Default workspace user identity for unauthenticated exploration
export const GUEST_ENTERPRISE_USER: EnterpriseUser = {
  uid: "workspace-member",
  displayName: "Workspace Member",
  email: "member@company.internal",
  tenantId: "acme-core",
  role: "Platform Engineer",
  department: "Core Architecture",
  isFirebaseAuthenticated: false,
};

// Clean reference array
export const DEMO_ENTERPRISE_USERS: EnterpriseUser[] = [GUEST_ENTERPRISE_USER];

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
