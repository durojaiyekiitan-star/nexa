"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import CountrySelect from "@/components/CountrySelect";
import WalletSetupGuide from "@/components/WalletSetupGuide";
import { isValidWalletInput, normalizeWalletAddress } from "@/lib/utils/wallet";

type Role = "student" | "sponsor" | "organization";

const ROLES: { value: Role; label: string; description: string }[] = [
  { value: "student", label: "Student", description: "Get assessed, matched, and funded" },
  { value: "sponsor", label: "Sponsor", description: "Discover and fund talented students" },
  { value: "organization", label: "Organization", description: "Run scholarship programs at scale" },
];

const STEP_LABELS = ["Role", "About you", "Wallet", "Account"];

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);

  const [role, setRole] = useState<Role>("student");

  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam === "student" || roleParam === "sponsor" || roleParam === "organization") {
      setRole(roleParam);
      setStep(2);
    }
  }, [searchParams]);

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [country, setCountry] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const walletRequired = role === "student" || role === "sponsor";
  const walletValid = !walletRequired || isValidWalletInput(walletAddress.trim());

  const canProceed =
    step === 1 ||
    (step === 2 && firstName.trim() && lastName.trim()) ||
    (step === 3 && walletValid && (!walletRequired || walletAddress.trim())) ||
    step === 4;

  const canSubmit = firstName.trim() && lastName.trim() && email.trim() && password.length >= 6 && walletValid && (!walletRequired || walletAddress.trim());

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError("");
    setIsSubmitting(true);
    const supabase = createClient();

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

    if (!data.session) {
      setAwaitingConfirmation(true);
      setIsSubmitting(false);
      return;
    }

    if (role === "student") router.push("/assessment");
    else if (role === "sponsor") router.push("/sponsor/dashboard");
    else router.push("/organization");
    router.refresh();
  };

  const handleResend = async () => {
    setIsSubmitting(true);
    setResendMessage("");
    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({ type: "signup", email });
    setResendMessage(resendError ? resendError.message : "Confirmation email resent.");
    setIsSubmitting(false);
  };

  if (awaitingConfirmation) {
    return (
      <main className="min-h-screen relative z-10 px-6 py-12 flex items-center justify-center">
        <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(139,92,246,0.15)] p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center text-2xl mx-auto mb-4">
            ✉️
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Check your email</h1>
          <p className="text-sm text-purple-200/60 mb-1">
            We&apos;ve sent a confirmation link to <span className="text-white font-medium">{email}</span>.
          </p>
          <p className="text-sm text-purple-200/60 mb-6">Click it to activate your account, then come back and log in.</p>
          <button
            onClick={handleResend}
            disabled={isSubmitting}
            className="text-sm text-cyan-300 hover:text-cyan-200 underline disabled:opacity-50"
          >
            {isSubmitting ? "Resending..." : "Resend confirmation email"}
          </button>
          {resendMessage && <p className="text-sm text-purple-200/60 mt-3">{resendMessage}</p>}
          <p className="text-sm text-purple-300/50 mt-6">
            <a href="/login" className="text-cyan-300 underline">
              Back to log in
            </a>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative z-10 px-6 py-12 flex items-center justify-center">
      <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(139,92,246,0.15)] p-8">
        <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
        <p className="text-sm text-purple-200/60 mb-5">Join Nexa as a student, sponsor, or organization.</p>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-6">
          {STEP_LABELS.map((label, i) => {
            const stepNum = i + 1;
            const isDone = stepNum < step;
            const isCurrent = stepNum === step;
            return (
              <div key={label} className="flex-1">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    isDone || isCurrent ? "bg-gradient-to-r from-cyan-400 to-violet-400" : "bg-white/10"
                  }`}
                />
                <p className={`text-[10px] mt-1.5 text-center ${isCurrent ? "text-cyan-300 font-medium" : "text-purple-300/40"}`}>
                  {label}
                </p>
              </div>
            );
          })}
        </div>

        <div key={step} className="space-y-4 animate-[fadeIn_0.35s_ease-out]">
          {/* Step 1: Role */}
          {step === 1 && (
            <div>
              <p className="text-sm font-medium text-purple-100 mb-3">I am a...</p>
              <div className="space-y-2">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                      role === r.value
                        ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border-cyan-400/40 text-white"
                        : "bg-white/5 border-white/10 text-purple-200/60 hover:border-white/20"
                    }`}
                  >
                    <p className="font-semibold">{r.label}</p>
                    <p className="text-xs text-purple-300/50 mt-0.5">{r.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Personal details */}
          {step === 2 && (
            <>
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
                <CountrySelect value={country} onChange={setCountry} />
              </div>
            </>
          )}

          {/* Step 3: Wallet */}
          {step === 3 && (
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
          )}

          {/* Step 4: Account credentials */}
          {step === 4 && (
            <>
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
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-purple-300/40 focus:border-cyan-400/50 outline-none"
                  placeholder="At least 6 characters"
                />
              </div>
              {error && <p className="text-sm text-red-300">{error}</p>}
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-2 mt-6">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="px-4 py-2.5 rounded-lg text-sm text-purple-200/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            >
              Back
            </button>
          )}
          {step < 4 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed}
              className="flex-1 bg-gradient-to-r from-indigo-500 to-violet-500 disabled:from-white/10 disabled:to-white/10 disabled:text-purple-300/40 text-white font-medium rounded-lg py-2.5 transition-all hover:from-indigo-400 hover:to-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] disabled:shadow-none"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="flex-1 bg-gradient-to-r from-indigo-500 to-violet-500 disabled:from-white/10 disabled:to-white/10 disabled:text-purple-300/40 text-white font-medium rounded-lg py-2.5 transition-all hover:from-indigo-400 hover:to-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] disabled:shadow-none"
            >
              {isSubmitting ? "Creating account..." : "Sign up"}
            </button>
          )}
        </div>

        <p className="text-sm text-purple-300/50 text-center mt-4">
          Already have an account?{" "}
          <a href="/login" className="text-cyan-300 underline">
            Log in
          </a>
        </p>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
