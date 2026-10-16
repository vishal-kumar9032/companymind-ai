"use client";

import React, { useState } from "react";
import {
  Brain,
  Lock,
  Mail,
  User,
  Building2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import {
  EnterpriseUser,
  DEMO_ENTERPRISE_USERS,
  signInWithGoogleAuth,
  isFirebaseConfigured,
} from "@/lib/firebase";
import { TENANTS } from "@/lib/tenants";

interface AuthPageProps {
  mode?: "login" | "register";
  onSuccess: (user: EnterpriseUser) => void;
  onBackToLanding: () => void;
}

export function AuthPage({
  mode = "login",
  onSuccess,
  onBackToLanding,
}: AuthPageProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">(mode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("Acme Corporation");
  const [selectedTenantId, setSelectedTenantId] = useState("acme-core");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = await signInWithGoogleAuth();
      onSuccess(user);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Google authentication failed. Please select an enterprise persona below.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const user: EnterpriseUser = {
        uid: `user-${Date.now()}`,
        displayName: name || (email.split("@")[0].replace(".", " ").replace(/\b\w/g, (l) => l.toUpperCase())),
        email,
        photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
        tenantId: selectedTenantId,
        role: activeTab === "register" ? "Lead Systems Architect" : "Senior Staff Engineer",
        department: orgName || "Engineering Platform",
        isFirebaseAuthenticated: false,
      };

      if (typeof window !== "undefined") {
        localStorage.setItem("companymind_user", JSON.stringify(user));
      }
      onSuccess(user);
      setLoading(false);
    }, 400);
  };

  const handleSelectPersona = (persona: EnterpriseUser) => {
    setLoading(true);
    setTimeout(() => {
      if (typeof window !== "undefined") {
        localStorage.setItem("companymind_user", JSON.stringify(persona));
      }
      onSuccess(persona);
      setLoading(false);
    }, 200);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* 1. Header with Back button */}
      <header className="h-16 px-4 sm:px-8 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl flex items-center justify-between">
        <button
          onClick={onBackToLanding}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft size={15} />
          <span>Back to TrueForge</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="size-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
            <Brain size={18} />
          </div>
          <span className="font-bold text-sm tracking-tight text-white">
            TrueForge Harness
          </span>
        </div>

        <div className="w-24" /> {/* Spacer */}
      </header>

      {/* 2. Main Authentication Card Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Card Top Branding */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono">
              <Sparkles size={12} />
              <span>Enterprise Identity & Access</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {activeTab === "login"
                ? "Sign In to Your Workspace"
                : "Create Enterprise Account"}
            </h1>
            <p className="text-xs text-slate-400">
              {activeTab === "login"
                ? "Access your FalkorDB knowledge graph and agent workforce."
                : "Initialize a new agent harness partitioned for your team."}
            </p>
          </div>

          {/* Segmented Switcher (Sign In vs Register) */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => {
                setActiveTab("login");
                setError(null);
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === "login"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setActiveTab("register");
                setError(null);
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === "register"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Google SSO Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
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
            <span>Continue with Google SSO</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <span className="relative bg-slate-900 px-3 text-[10px] font-mono uppercase tracking-wider text-slate-500">
              Or with work email
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailAuthSubmit} className="space-y-3.5">
            {activeTab === "register" && (
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-300">
                  Full Name
                </label>
                <div className="relative">
                  <User size={14} className="text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Sarah Chen"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-300">
                Work Email
              </label>
              <div className="relative">
                <Mail size={14} className="text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {activeTab === "register" && (
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-300">
                  Target Organization Domain
                </label>
                <div className="relative">
                  <Building2 size={14} className="text-slate-500 absolute left-3 top-3" />
                  <select
                    value={selectedTenantId}
                    onChange={(e) => {
                      setSelectedTenantId(e.target.value);
                      const t = TENANTS.find((item) => item.id === e.target.value);
                      if (t) setOrgName(t.name);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
                  >
                    {TENANTS.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name} ({tenant.badge})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-slate-300">
                  Password
                </label>
                {activeTab === "login" && (
                  <button
                    type="button"
                    onClick={() => setError("Password reset is managed by your SSO directory.")}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock size={14} className="text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50 active:scale-98"
            >
              <span>
                {activeTab === "login"
                  ? "Sign In to TrueForge"
                  : "Launch Your Workspace"}
              </span>
              <ArrowRight size={14} />
            </button>
          </form>

          {/* Quick Demo Persona Pickers */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                Instant 1-Click Demo Personas:
              </span>
              <span className="text-[10px] font-mono text-emerald-400">
                Ready
              </span>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {DEMO_ENTERPRISE_USERS.map((persona) => (
                <button
                  key={persona.uid}
                  type="button"
                  onClick={() => handleSelectPersona(persona)}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800/80 text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-6 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                      {persona.displayName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                        {persona.displayName}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {persona.role} · {persona.department}
                      </div>
                    </div>
                  </div>
                  <ArrowRight
                    size={12}
                    className="text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* 3. Footer */}
      <footer className="h-12 border-t border-slate-800/80 px-4 sm:px-8 flex items-center justify-between text-xs text-slate-500">
        <span>TrueForge Agent Harness · FalkorDB Platform</span>
        <div className="flex items-center gap-4">
          <a href="https://trueforge.dev" target="_blank" rel="noreferrer" className="hover:text-slate-400">
            Docs
          </a>
          <span>Privacy & Security</span>
        </div>
      </footer>
    </div>
  );
}
