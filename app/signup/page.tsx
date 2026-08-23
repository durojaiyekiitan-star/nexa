"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { COUNTRIES } from "@/lib/constants/countries";
import WalletSetupGuide from "@/components/WalletSetupGuide";
import { isValidWalletInput, normalizeWalletAddress } from "@/lib/utils/wallet";

type Role = "student" | "sponsor" | "organization";

const ROLES: { value: Role; label: string; description: string }[] = [
  { value: "student", label: "Student", description: "Get assessed, matched, and funded" },
  { value: "sponsor", label: "Sponsor", description: "Discover and fund talented students" },
  { value: "organization", label: "Organization", description: "Run scholarship programs at scale" },
];

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("student");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [country, setCountry] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const walletRequired = role === "student" || role === "sponsor";
  const walletValid = !walletRequired || isValidWalletInput(walletAddress.trim());
  const canSubmit =
    firstName.trim() && lastName.trim() && email.trim() && password.length >= 6 && walletValid && (!walletRequired || walletAddress.trim());

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError("");
    setIsSubmitting(true);
    const supabase = createClient();

    // Profile + role-specific rows are now created automatically by a DB
    // trigger in the same transaction as the account itself — no separate
    // insert steps that could fail halfway through.
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          first_name: firstName.trim(),
          middle_name: middleName.trim() || null,
          last_name: lastName.trim(),
          country: country || null,
          ilp_wallet_address: walletAddress.trim() ? normalizeWalletAddress(walletAddress) : null,
        },
      },
    });
    if (signUpError || !data.user) {
      setError(signUpError?.message || "Failed to create account");
      setIsSubmitting(false);
      return;
    }

    if (role === "student") router.push("/assessment");
    else if (role === "sponsor") router.push("/sponsor/dashboard");
    else router.push("/organization");
    router.refresh();
  };

  return (
    <main className="min-h-screen relative z-10 px-6 py-12 flex items-center justify-center">
      <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(139,92,246,0.15)] p-8">
        <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
        <p className="text-sm text-purple-200/60 mb-6">Join Nexa as a student, sponsor, or organization.</p>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-purple-100 mb-2">I am a...</p>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`text-left px-3 py-2 rounded-lg border text-xs transition-all ${
                    role === r.value
                      ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border-cyan-400/40 text-white"
                      : "bg-white/5 border-white/10 text-purple-200/60 hover:border-white/20"
                  }`}
                >
                  <p className="font-semibold">{r.label}</p>
                </button>
              ))}
            </div>
            <p className="text-xs text-purple-300/40 mt-1.5">{ROLES.find((r) => r.value === role)?.description}</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-sm font-medium text-purple-100 mb-1 block">First name</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-purple-300/40 focus:border-cyan-400/50 outline-none"
                placeholder="First"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-purple-100 mb-1 block">Middle</label>
              <input
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-purple-300/40 focus:border-cyan-400/50 outline-none"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-purple-100 mb-1 block">Last name</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-purple-300/40 focus:border-cyan-400/50 outline-none"
                placeholder="Last"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-purple-100 mb-1 block">Country (optional)</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white [&>option]:bg-[#1A0B36]"
            >
              <option value="">Select a country...</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-purple-100 mb-1 block">
              Interledger wallet address{walletRequired ? "" : " (optional)"}
            </label>
            <input
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="$ilp.interledger-test.dev/yourname"
              className={`w-full bg-white/5 border rounded-lg px-3 py-2 text-sm text-white placeholder:text-purple-300/40 outline-none mb-2 ${
                walletAddress && !walletValid ? "border-red-400/50 focus:border-red-400/70" : "border-white/10 focus:border-cyan-400/50"
              }`}
            />
            {walletAddress && !walletValid && (
              <p className="text-xs text-red-300 mb-2">Should look like $ilp.interledger-test.dev/yourname (the format shown on the test wallet site)</p>
            )}
            {walletRequired && (
              <p className="text-xs text-purple-300/40 mb-2">
                Required for {role === "student" ? "students" : "sponsors"} — this is how real funds move to or from your account.
              </p>
            )}
            <WalletSetupGuide />
          </div>

          <div>
            <label className="text-sm font-medium text-purple-100 mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-purple-300/40 focus:border-cyan-400/50 outline-none"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-purple-100 mb-1 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-purple-300/40 focus:border-cyan-400/50 outline-none"
              placeholder="At least 6 characters"
            />
          </div>

          {error && <p className="text-sm text-red-300">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 disabled:from-white/10 disabled:to-white/10 disabled:text-purple-300/40 text-white font-medium rounded-lg py-2.5 transition-all hover:from-indigo-400 hover:to-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] disabled:shadow-none"
          >
            {isSubmitting ? "Creating account..." : "Sign up"}
          </button>

          <p className="text-sm text-purple-300/50 text-center">
            Already have an account?{" "}
            <a href="/login" className="text-cyan-300 underline">
              Log in
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
