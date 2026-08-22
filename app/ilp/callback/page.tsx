"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface CompletedPayment {
  id: string;
  amount: number;
  debitAmount: { value: string; assetCode: string; assetScale: number };
  receiveAmount: { value: string; assetCode: string; assetScale: number };
  state: string;
  warning: string | null;
}

function formatMoney(m: { value: string; assetCode: string; assetScale: number }) {
  return `${(Number(m.value) / 10 ** m.assetScale).toFixed(2)} ${m.assetCode}`;
}

function CallbackContent() {
  const params = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [result, setResult] = useState<CompletedPayment | null>(null);
  const [error, setError] = useState<string>("");
  const hasRunRef = useRef(false);

  useEffect(() => {
    // Guards against React Strict Mode's double-invoked effect in dev,
    // which would otherwise fire this completion request twice.
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    const sessionId = params.get("session");
    const interactRef = params.get("interact_ref");

    if (!sessionId || !interactRef) {
      setStatus("error");
      setError("Missing session or interact_ref in the redirect — the wallet may not have approved the request.");
      return;
    }

    fetch("/api/ilp/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, interactRef }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to complete payment");
        setResult(data);
        setStatus("success");
      })
      .catch((err) => {
        setError(err.message);
        setStatus("error");
      });
  }, [params]);

  return (
    <main className="min-h-screen relative z-10 px-6 py-12 flex items-center justify-center">
      <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(139,92,246,0.15)] p-8 text-center">
        {status === "loading" && (
          <>
            <div className="w-10 h-10 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin mx-auto mb-4" />
            <p className="text-white font-medium">Finishing your real Interledger payment...</p>
            <p className="text-sm text-purple-300/50 mt-1">Continuing the grant and creating the outgoing payment.</p>
          </>
        )}

        {status === "success" && result && (
          <>
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 text-white flex items-center justify-center text-2xl mx-auto mb-4 shadow-[0_0_20px_rgba(34,211,238,0.5)]">
              ✓
            </div>
            <h1 className="text-xl font-bold text-white mb-1">Real payment sent</h1>
            <p className="text-sm text-purple-300/50 mb-5">This actually moved value on the Interledger test network.</p>
            <dl className="text-sm text-left space-y-2 bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex justify-between">
                <dt className="text-purple-300/50">Sent</dt>
                <dd className="text-white">{formatMoney(result.debitAmount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-purple-300/50">Received</dt>
                <dd className="text-white">{formatMoney(result.receiveAmount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-purple-300/50">Status</dt>
                <dd className="text-emerald-300 capitalize">{result.state}</dd>
              </div>
            </dl>
            {result.warning && (
              <p className="text-xs text-amber-300 mt-4 bg-amber-500/10 border border-amber-400/20 rounded-lg p-3">
                {result.warning}
              </p>
            )}
            <Link
              href="/sponsor/dashboard"
              className="inline-block mt-6 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white font-medium rounded-lg px-5 py-2.5 transition-all shadow-[0_0_20px_rgba(139,92,246,0.4)]"
            >
              Back to sponsor dashboard
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-14 h-14 rounded-full bg-red-500/20 border border-red-400/30 text-red-300 flex items-center justify-center text-2xl mx-auto mb-4">
              !
            </div>
            <h1 className="text-xl font-bold text-white mb-1">Something went wrong</h1>
            <p className="text-sm text-purple-300/60">{error}</p>
            <Link href="/funding" className="inline-block mt-6 text-cyan-300 underline text-sm">
              Back to funding page
            </Link>
          </>
        )}
      </div>
    </main>
  );
}

export default function IlpCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackContent />
    </Suspense>
  );
}
