"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen relative z-10 px-6 py-12 flex items-center justify-center">
      <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(139,92,246,0.15)] p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-red-500/20 border border-red-400/30 text-red-300 flex items-center justify-center text-2xl mx-auto mb-4">
          !
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Something went wrong</h1>
        <p className="text-sm text-purple-300/60 mb-6">
          An unexpected error occurred. This has been logged — try again, or head back home.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white font-medium rounded-lg px-5 py-2.5 transition-all shadow-[0_0_20px_rgba(139,92,246,0.4)]"
          >
            Try again
          </button>
          <Link
            href="/"
            className="bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg px-5 py-2.5 border border-white/15 transition-colors"
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
