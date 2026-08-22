import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen relative z-10 px-6 py-12 flex items-center justify-center">
      <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(139,92,246,0.15)] p-8 text-center">
        <p className="text-4xl font-bold bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent mb-2">
          404
        </p>
        <h1 className="text-lg font-bold text-white mb-2">Page not found</h1>
        <p className="text-sm text-purple-300/60 mb-6">This page doesn&apos;t exist, or you don&apos;t have access to it.</p>
        <Link
          href="/"
          className="inline-block bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white font-medium rounded-lg px-5 py-2.5 transition-all shadow-[0_0_20px_rgba(139,92,246,0.4)]"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
