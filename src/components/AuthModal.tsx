"use client";

import React, { useState } from "react";
import {
  X,
  Lock,
  Building2,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  User,
} from "lucide-react";
import {
  EnterpriseUser,
  signInWithGoogleAuth,
  isFirebaseConfigured,
} from "@/lib/firebase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAuthenticated: (user: EnterpriseUser) => void;
}

export function AuthModal({
  isOpen,
  onClose,
  onUserAuthenticated,
}: AuthModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSignIn = async (preset?: EnterpriseUser) => {
    try {
      setLoading(true);
      setError(null);
      const user = await signInWithGoogleAuth(preset);
      onUserAuthenticated(user);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to sign in. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  };

  const hasFirebase = isFirebaseConfigured();

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 animate-in fade-in duration-150 select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Lock size={15} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Enterprise Authentication
              </h3>
              <p className="text-[11px] text-slate-500">
                Sign in to your organization workspace
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            onClick={() => handleSignIn()}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <svg className="size-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.2 8.9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
              />
              <path
                fill="#FBBC05"
                d="M5.3 14.7c-.2-.7-.4-1.6-.4-2.7s.1-1.9.4-2.7L1.6 6.4C.6 8.3 0 10.1 0 12s.6 3.7 1.6 5.6l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.2-6.7-5.3L1.6 16c1.9 3.7 5.8 7 10.4 7z"
              />
            </svg>
            <span>
              {hasFirebase
                ? "Continue with Google (Firebase)"
                : "Enterprise Google SSO"}
            </span>
          </button>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Need an enterprise account?</span>
            <a
              href="/?stage=register"
              onClick={(e) => {
                e.preventDefault();
                onClose();
                window.location.href = "/?stage=register";
              }}
              className="text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center gap-1"
            >
              <span>Register workspace</span>
              <ArrowRight size={12} />
            </a>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
              <ShieldCheck size={13} className="text-emerald-600" />
              <span>Multi-Tenant Role-Based Access Control</span>
            </div>
            <p className="text-[10px] leading-relaxed">
              Enterprise sessions are partitioned by tenant domain with FalkorDB OpenCypher governance policies enforced automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
