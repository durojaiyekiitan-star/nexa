import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import CursorGlow from "@/components/CursorGlow";
import TopRightAuth from "@/components/TopRightAuth";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nexa — AI-Powered Education Funding",
  description: "Connecting talented students with sponsors, powered by AI and Interledger.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-[#0B071E] text-white`}>
        {/* Base radial gradient wash */}
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_#1A0B36_0%,_#0B071E_70%)] -z-20" />

        {/* Ambient neon glow blobs — drifting on their own */}
        <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-[550px] h-[550px] bg-cyan-500/35 rounded-full blur-[150px] animate-[blob-drift-1_12s_ease-in-out_infinite]" />
          <div className="absolute top-1/4 -right-40 w-[650px] h-[650px] bg-violet-600/40 rounded-full blur-[160px] animate-[blob-drift-2_14s_ease-in-out_infinite]" />
          <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-fuchsia-500/30 rounded-full blur-[155px] animate-[blob-drift-3_11s_ease-in-out_infinite]" />
          <div className="absolute bottom-10 -right-20 w-[500px] h-[500px] bg-blue-600/35 rounded-full blur-[145px] animate-[blob-drift-4_13s_ease-in-out_infinite]" />
        </div>

        {/* Cursor-following glow — layered on top of the drifting blobs */}
        <CursorGlow />

        <Sidebar />
        <TopRightAuth />
        <div className="pl-16">{children}</div>
      </body>
    </html>
  );
}
