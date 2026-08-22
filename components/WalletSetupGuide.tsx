"use client";

import { useState } from "react";
import { ExternalLink, ChevronDown } from "lucide-react";

export default function WalletSetupGuide() {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-cyan-500/5 border border-cyan-400/20 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-medium text-cyan-200">Don&apos;t have a test wallet yet? How to get one →</span>
        <ChevronDown size={16} className={`text-cyan-300/60 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          <a
            href="https://wallet.interledger-test.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-cyan-300 hover:text-cyan-200 underline"
          >
            Open the Interledger Testnet portal <ExternalLink size={14} />
          </a>
          <ol className="space-y-2 text-sm text-purple-200/70">
            <li className="flex gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-200 text-xs font-semibold flex items-center justify-center">
                1
              </span>
              Click the link above to open the Interledger Testnet portal in a new tab.
            </li>
            <li className="flex gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-200 text-xs font-semibold flex items-center justify-center">
                2
              </span>
              Create or log in to your test account, then copy your payment pointer — it looks like{" "}
              <code className="text-cyan-200 bg-white/5 px-1 rounded">$ilp.interledger-test.dev/yourname</code>.
            </li>
            <li className="flex gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-200 text-xs font-semibold flex items-center justify-center">
                3
              </span>
              Paste that address back into the field above.
            </li>
          </ol>
          <p className="text-xs text-purple-300/40">This is a free test network — no real money or real bank details involved.</p>
          <p className="text-xs text-amber-300/80 bg-amber-500/10 border border-amber-400/20 rounded-lg px-3 py-2">
            Important: your wallet must come from a different wallet.interledger-test.dev login/email than the
            person you're transacting with. Two wallets under the same login (even in different currencies) can
            cause real payments to fail.
          </p>
        </div>
      )}
    </div>
  );
}
