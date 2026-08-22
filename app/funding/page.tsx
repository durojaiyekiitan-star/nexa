"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SPONSOR_NETWORKS, STUDENT_NETWORK } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";
import { ROLE_HOME, type Role } from "@/lib/auth/roles";
import { getFullName, getInitials } from "@/lib/utils/names";
import { getPercentFunded } from "@/lib/utils/funding";
import { AlertTriangle } from "lucide-react";

const AMOUNT_OPTIONS = [5, 10, 20, 50];

const HOPS = [
  { id: "sponsor", label: "Sponsor's Network" },
  { id: "nexa", label: "Nexa Backend" },
  { id: "ilp", label: "Interledger Protocol" },
  { id: "student", label: "Student's Local Network" },
];

type HopStatus = "pending" | "active" | "done";

interface Receipt {
  amount: number;
  sponsorNetwork: string;
  studentNetwork: string;
  timestamp: string;
  route: string[];
  settlementMs: number;
}

interface Goal {
  id: string;
  title: string;
  amount_needed: number;
  amount_raised: number;
  studentName: string;
  studentCountry: string | null;
  studentHasWallet: boolean;
}

function FundingContent() {
  const params = useSearchParams();
  const router = useRouter();
  const goalId = params.get("goalId");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [sponsorInitials, setSponsorInitials] = useState("YO");
  const [goal, setGoal] = useState<Goal | null>(null);

  const [amount, setAmount] = useState<number>(10);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [sponsorNetworkId, setSponsorNetworkId] = useState<string>(SPONSOR_NETWORKS[0].id);
  const [hopStatuses, setHopStatuses] = useState<HopStatus[]>(HOPS.map(() => "pending"));
  const [isRunning, setIsRunning] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [isLaunchingReal, setIsLaunchingReal] = useState(false);
  const [realIlpError, setRealIlpError] = useState<string>("");
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const supabase = createClient();

    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);

      const { data: profile } = await supabase.from("profiles").select("first_name, last_name, role").eq("id", user.id).single();
      if (profile && profile.role !== "sponsor") {
        router.push(ROLE_HOME[profile.role as Role] ?? "/");
        return;
      }
      if (profile) setSponsorInitials(getInitials(profile.first_name, profile.last_name));

      if (!goalId) {
        setLoadError("No funding goal selected. Go to the sponsor dashboard and click \"Fund this goal\" on a student.");
        setLoading(false);
        return;
      }

      const { data: goalData, error: goalError } = await supabase
        .from("funding_goals")
        .select("id, title, amount_needed, amount_raised, student_id")
        .eq("id", goalId)
        .single();

      if (goalError || !goalData) {
        setLoadError("That funding goal couldn't be found.");
        setLoading(false);
        return;
      }

      const { data: studentProfile } = await supabase
        .from("profiles")
        .select("first_name, last_name, country, ilp_wallet_address")
        .eq("id", goalData.student_id)
        .single();

      setGoal({
        id: goalData.id,
        title: goalData.title,
        amount_needed: goalData.amount_needed,
        amount_raised: goalData.amount_raised,
        studentName: studentProfile ? getFullName(studentProfile.first_name, studentProfile.last_name) : "Student",
        studentCountry: studentProfile?.country ?? null,
        studentHasWallet: Boolean(studentProfile?.ilp_wallet_address),
      });
      setLoading(false);
    };

    load();
  }, [goalId, router]);

  const finalAmount = customAmount ? Number(customAmount) : amount;
  const sponsorNetwork = SPONSOR_NETWORKS.find((n) => n.id === sponsorNetworkId)!;

  const runPaymentFlow = () => {
    if (!finalAmount || finalAmount <= 0 || !goal || !userId) return;
    setIsRunning(true);
    setReceipt(null);
    setHopStatuses(HOPS.map(() => "pending"));
    startTimeRef.current = Date.now();

    HOPS.forEach((hop, i) => {
      setTimeout(() => {
        setHopStatuses((prev) => {
          const next = [...prev];
          next[i] = "active";
          if (i > 0) next[i - 1] = "done";
          return next;
        });
      }, i * 900);
    });

    setTimeout(async () => {
      setHopStatuses(HOPS.map(() => "done"));
      const settlementMs = Date.now() - startTimeRef.current;

      const supabase = createClient();
      const { error: insertError } = await supabase.from("contributions").insert({
        goal_id: goal.id,
        sponsor_id: userId,
        sponsor_initials: sponsorInitials,
        amount: finalAmount,
        source: "simulated",
      });

      if (!insertError) {
        setGoal((prev) => (prev ? { ...prev, amount_raised: prev.amount_raised + finalAmount } : prev));
      }

      setReceipt({
        amount: finalAmount,
        sponsorNetwork: `${sponsorNetwork.label} — ${sponsorNetwork.region}`,
        studentNetwork: `${STUDENT_NETWORK.label} — ${STUDENT_NETWORK.region}`,
        timestamp: new Date().toLocaleString(),
        route: HOPS.map((h) => h.label),
        settlementMs,
      });
      setIsRunning(false);
    }, HOPS.length * 900);
  };

  const handleRealIlpPayment = async () => {
    if (!goal) return;
    setRealIlpError("");
    setIsLaunchingReal(true);
    try {
      const res = await fetch("/api/ilp/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: finalAmount, goalId: goal.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start real ILP payment");
      window.location.href = data.redirectUrl;
    } catch (err) {
      setRealIlpError(err instanceof Error ? err.message : "Unknown error");
      setIsLaunchingReal(false);
    }
  };

  if (loading) return null;

  if (loadError || !goal) {
    return (
      <main className="min-h-screen relative z-10 px-6 py-12 flex items-center justify-center">
        <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center">
          <p className="text-white font-medium mb-2">Can&apos;t load this funding page</p>
          <p className="text-sm text-purple-300/60">{loadError}</p>
        </div>
      </main>
    );
  }

  const percentFunded = getPercentFunded(goal.amount_raised, goal.amount_needed);

  return (
    <main className="min-h-screen relative z-10 px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Fund a Learning Goal</h1>
        <p className="text-purple-200/60 mb-8">
          Watch your support move across borders in real time — from your payment network, through Nexa, over the Interledger Protocol, to the student.
        </p>

        {/* Goal summary */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(139,92,246,0.15)] p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-white">{goal.studentName}</p>
              <p className="text-sm text-purple-300/50">{goal.studentCountry || "Location not set"}</p>
              <p className="text-sm text-purple-200/70 mt-2">{goal.title}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-purple-300/50">
                ${goal.amount_raised} of ${goal.amount_needed} raised
              </p>
            </div>
          </div>
          <div className="w-full bg-white/5 rounded-full h-2 mt-3 border border-white/5">
            <div
              className="bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 h-2 rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(139,92,246,0.6)]"
              style={{ width: `${percentFunded}%` }}
            />
          </div>
        </div>

        {/* Amount + network selection */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(139,92,246,0.15)] p-6 mb-6 space-y-5">
          <div>
            <p className="text-sm font-medium text-purple-100 mb-2">Contribution amount</p>
            <div className="flex gap-2 flex-wrap">
              {AMOUNT_OPTIONS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => {
                    setAmount(a);
                    setCustomAmount("");
                  }}
                  className={`px-4 py-2 rounded-lg text-sm border transition-all ${
                    !customAmount && amount === a
                      ? "bg-gradient-to-r from-cyan-500 to-violet-500 text-white border-transparent shadow-[0_0_16px_rgba(139,92,246,0.5)]"
                      : "bg-white/5 text-purple-200/70 border-white/10 hover:border-cyan-400/40 hover:text-white"
                  }`}
                >
                  ${a}
                </button>
              ))}
              <input
                type="number"
                placeholder="Custom"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-24 px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10 text-white placeholder:text-purple-300/40 focus:border-cyan-400/50 outline-none"
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-purple-100 mb-2">Your payment network</p>
            <div className="flex gap-2 flex-wrap">
              {SPONSOR_NETWORKS.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setSponsorNetworkId(n.id)}
                  className={`px-3 py-2 rounded-lg text-sm border transition-all ${
                    sponsorNetworkId === n.id
                      ? "bg-gradient-to-r from-cyan-500 to-violet-500 text-white border-transparent shadow-[0_0_16px_rgba(139,92,246,0.5)]"
                      : "bg-white/5 text-purple-200/70 border-white/10 hover:border-cyan-400/40 hover:text-white"
                  }`}
                >
                  {n.label} — {n.region}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={runPaymentFlow}
            disabled={isRunning || !finalAmount}
            className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 disabled:from-white/10 disabled:to-white/10 disabled:text-purple-300/40 text-white font-medium rounded-lg py-2.5 transition-all hover:from-indigo-400 hover:to-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] disabled:shadow-none"
          >
            {isRunning ? "Routing payment..." : `Fund $${finalAmount || 0}`}
          </button>

          <div className="pt-1 border-t border-white/10">
            {goal.studentHasWallet ? (
              <>
                <button
                  onClick={handleRealIlpPayment}
                  disabled={isLaunchingReal || !finalAmount}
                  className="w-full mt-4 bg-white/5 hover:bg-white/10 disabled:opacity-40 text-cyan-200 font-medium rounded-lg py-2.5 border border-cyan-400/30 transition-colors text-sm"
                >
                  {isLaunchingReal ? "Connecting to Interledger..." : `⚡ Try with real Interledger testnet ($${finalAmount || 0})`}
                </button>
                <p className="text-xs text-purple-300/40 mt-2">
                  This redirects you to a real wallet at wallet.interledger-test.dev to approve — test-network value, not real money.
                </p>
                {realIlpError && <p className="text-xs text-red-300 mt-2">{realIlpError}</p>}
              </>
            ) : (
              <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-400/30 rounded-xl px-4 py-3 mt-4">
                <AlertTriangle size={16} className="text-amber-300 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200">
                  This student has not linked an Interledger test wallet yet. Real transfers cannot be initiated
                  until they update their account settings. You can still use the simulated flow above.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Network hop animation */}
        {(isRunning || receipt) && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(139,92,246,0.15)] p-6 mb-6">
            <h2 className="font-semibold text-white mb-6">Payment route</h2>
            <div className="flex items-center justify-between">
              {HOPS.map((hop, i) => (
                <div key={hop.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-500 ${
                        hopStatuses[i] === "done"
                          ? "bg-gradient-to-br from-emerald-400 to-cyan-400 text-white shadow-[0_0_18px_rgba(34,211,238,0.55)]"
                          : hopStatuses[i] === "active"
                          ? "bg-gradient-to-br from-cyan-400 to-violet-500 text-white animate-pulse shadow-[0_0_24px_rgba(34,211,238,0.7)]"
                          : "bg-white/5 border border-white/10 text-purple-300/40"
                      }`}
                    >
                      {hopStatuses[i] === "done" ? "✓" : i + 1}
                    </div>
                    <p className="text-xs text-purple-300/50 mt-2 text-center w-20">{hop.label}</p>
                  </div>
                  {i < HOPS.length - 1 && (
                    <div className="flex-1 h-0.5 mx-1 mb-6 bg-white/5 relative overflow-hidden rounded-full">
                      <div
                        className={`h-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all duration-700 shadow-[0_0_8px_rgba(34,211,238,0.6)] ${
                          hopStatuses[i] === "done" ? "w-full" : "w-0"
                        }`}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Receipt */}
        {receipt && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(139,92,246,0.15)] p-6">
            <h2 className="font-semibold text-white mb-4">Transaction receipt</h2>
            <dl className="text-sm space-y-2">
              <div className="flex justify-between">
                <dt className="text-purple-300/50">Amount</dt>
                <dd className="text-white font-medium">${receipt.amount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-purple-300/50">From</dt>
                <dd className="text-purple-100">{receipt.sponsorNetwork}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-purple-300/50">To</dt>
                <dd className="text-purple-100">{receipt.studentNetwork}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-purple-300/50">Route</dt>
                <dd className="text-purple-100 text-right">{receipt.route.join(" → ")}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-purple-300/50">Settled in</dt>
                <dd className="text-purple-100">{(receipt.settlementMs / 1000).toFixed(1)}s</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-purple-300/50">Timestamp</dt>
                <dd className="text-purple-100">{receipt.timestamp}</dd>
              </div>
            </dl>

            <div className="mt-5 pt-4 border-t border-white/10">
              <p className="text-xs font-medium text-purple-300/50 mb-2">Trust & transparency trail</p>
              <p className="text-sm text-purple-200/70">
                Funds received → course purchase pending → certificate upload pending
              </p>
              <p className="text-xs text-purple-300/40 mt-2">
                Goal is now {percentFunded}% funded —{" "}
                <a href="/sponsor/dashboard" className="text-cyan-300 underline">
                  back to sponsor dashboard
                </a>
                .
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function FundingPage() {
  return (
    <Suspense fallback={null}>
      <FundingContent />
    </Suspense>
  );
}
