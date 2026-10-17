"use client";

import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, Loader2, Lock, Plug } from "lucide-react";
import { authHeaders } from "@/lib/clientAuth";

interface Toolkit {
  slug: string;
  label: string;
  blurb: string;
  connected: boolean;
}

interface State {
  authenticated: boolean;
  configured: boolean;
  error?: string;
  note?: string;
  toolkits: Toolkit[];
}

export function ConnectionsView({ onRequestSignIn }: { onRequestSignIn: () => void }) {
  const [state, setState] = useState<State | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/connections", { headers: await authHeaders(), cache: "no-store" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || `Failed (${res.status})`);
      setState(j);
    } catch (e: any) {
      setError(e?.message || "Could not load connections");
    }
  }, []);

  useEffect(() => {
    void load();
    // Returning from the OAuth redirect: refresh state and clean the URL.
    const p = new URLSearchParams(window.location.search);
    if (p.get("connected")) {
      window.history.replaceState({}, "", window.location.pathname);
      void load();
    }
  }, [load]);

  async function connect(slug: string) {
    setBusy(slug);
    setError(null);
    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "content-type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ toolkit: slug }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || `Failed (${res.status})`);
      window.location.href = j.url;
    } catch (e: any) {
      setError(e?.message || "Could not start the connection");
      setBusy(null);
    }
  }

  const signedOut = state && !state.authenticated;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Connections</h1>
        <p className="mt-1 text-sm text-slate-500">
          Connect your own accounts. Agents read from them to build your company graph and can act on them only with your approval.
        </p>
      </div>

      {signedOut && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <div className="flex items-center gap-2 text-sm text-indigo-900">
            <Lock size={16} /> Sign in with Google to connect your accounts.
          </div>
          <button onClick={onRequestSignIn} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700">
            Sign in
          </button>
        </div>
      )}

      {state && !state.configured && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <CircleAlert size={16} className="mt-0.5 shrink-0" /> Connectors are not configured on this server (COMPOSIO_API_KEY missing).
        </div>
      )}

      {(error || state?.error) && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <CircleAlert size={16} className="mt-0.5 shrink-0" /> {error || state?.error}
        </div>
      )}

      {!state && !error && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 size={15} className="animate-spin" /> Checking your connections…
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {state?.toolkits.map((t) => (
          <div key={t.slug} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">{t.label}</p>
              <p className="text-xs text-slate-500">{t.blurb}</p>
            </div>
            {t.connected ? (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <CheckCircle2 size={13} /> Connected
              </span>
            ) : (
              <button
                disabled={!state.authenticated || !state.configured || busy !== null}
                onClick={() => connect(t.slug)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-40"
              >
                {busy === t.slug ? <Loader2 size={13} className="animate-spin" /> : <Plug size={13} />} Connect
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
