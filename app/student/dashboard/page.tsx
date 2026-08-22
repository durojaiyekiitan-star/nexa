"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { buildRoadmap, type RoadmapItem } from "@/lib/ai-engine";
import { getPercentFunded } from "@/lib/utils/funding";
import { createClient } from "@/lib/supabase/client";
import { ROLE_HOME, type Role } from "@/lib/auth/roles";
import RevealOnScroll from "@/components/RevealOnScroll";

interface Profile {
  first_name: string;
  last_name: string;
  country: string | null;
}

interface StudentProfileData {
  skills: string[];
  interests: string[];
  goal: string | null;
}

interface Contribution {
  sponsor_id: string | null;
  sponsor_initials: string;
  amount: number;
  created_at: string;
  source: string;
}

interface FundingGoal {
  id: string;
  title: string;
  amount_needed: number;
  amount_raised: number;
  contributions: Contribution[];
}

const REFUND_HOPS = ["Nexa Backend", "Interledger Protocol", "Sponsor's Network"];
type HopStatus = "pending" | "active" | "done";

export default function StudentDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfileData | null>(null);
  const [goals, setGoals] = useState<FundingGoal[]>([]);
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);

  // Deletion / refund flow
  const [confirmingGoalId, setConfirmingGoalId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [processingGoalId, setProcessingGoalId] = useState<string | null>(null);
  const [hopStatuses, setHopStatuses] = useState<HopStatus[]>(REFUND_HOPS.map(() => "pending"));
  const [deleteError, setDeleteError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

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

      const { data: roleCheck } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (roleCheck && roleCheck.role !== "student") {
        router.push(ROLE_HOME[roleCheck.role as Role] ?? "/");
        return;
      }

      const [{ data: profileData }, { data: studentData }, { data: goalsData }] = await Promise.all([
        supabase.from("profiles").select("first_name, last_name, country").eq("id", user.id).single(),
        supabase.from("student_profiles").select("skills, interests, goal").eq("profile_id", user.id).single(),
        supabase
          .from("funding_goals")
          .select("id, title, amount_needed, amount_raised")
          .eq("student_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (profileData) setProfile(profileData);
      if (studentData) setStudentProfile(studentData);

      let contributionsData: Contribution[] & { goal_id: string }[] = [];
      if (goalsData && goalsData.length > 0) {
        const goalIds = goalsData.map((g) => g.id);
        const { data } = await supabase
          .from("contributions")
          .select("goal_id, sponsor_id, sponsor_initials, amount, created_at, source")
          .in("goal_id", goalIds)
          .order("created_at", { ascending: false });
        contributionsData = (data ?? []) as typeof contributionsData;
      }

      const withContributions = (goalsData ?? []).map((g) => ({
        ...g,
        contributions: contributionsData.filter((c) => c.goal_id === g.id),
      }));
      withContributions.sort(
        (a, b) => getPercentFunded(b.amount_raised, b.amount_needed) - getPercentFunded(a.amount_raised, a.amount_needed)
      );
      setGoals(withContributions);

      if (studentData) {
        const claimedTitles = (goalsData ?? []).map((g) => g.title);
        setRoadmap(
          buildRoadmap(
            { skills: studentData.skills ?? [], interests: studentData.interests ?? [], goal: studentData.goal ?? "" },
            5,
            claimedTitles
          )
        );
      }

      setLoading(false);
    };

    load();

    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, [router]);

  const startDeleteFlow = (goalId: string) => {
    setConfirmingGoalId(goalId);
    setReason("");
    setDeleteError("");
    setSuccessMessage("");
  };

  const cancelDeleteFlow = () => {
    setConfirmingGoalId(null);
    setReason("");
    setDeleteError("");
  };

  const confirmDelete = async (goal: FundingGoal) => {
    if (reason.trim().length < 10) {
      setDeleteError("Please give a brief reason (at least 10 characters) before deleting a goal.");
      return;
    }
    if (!userId) return;

    setDeleteError("");
    setConfirmingGoalId(null);
    setProcessingGoalId(goal.id);

    const hasMoney = goal.amount_raised > 0 && goal.contributions.length > 0;

    if (hasMoney) {
      setHopStatuses(REFUND_HOPS.map(() => "pending"));
      // Animate the reversed flow: Nexa -> Interledger Protocol -> Sponsor's Network
      REFUND_HOPS.forEach((_, i) => {
        const t = setTimeout(() => {
          setHopStatuses((prev) => {
            const next = [...prev];
            next[i] = "active";
            if (i > 0) next[i - 1] = "done";
            return next;
          });
        }, i * 800);
        timeoutsRef.current.push(t);
      });

      const finishAnimation = new Promise<void>((resolve) => {
        const t = setTimeout(() => {
          setHopStatuses(REFUND_HOPS.map(() => "done"));
          resolve();
        }, REFUND_HOPS.length * 800);
        timeoutsRef.current.push(t);
      });

      await finishAnimation;
    }

    const supabase = createClient();
    let refundLogFailed = false;

    if (hasMoney) {
      const refundRows = goal.contributions.map((c) => ({
        goal_id: goal.id,
        goal_title: goal.title,
        student_id: userId,
        sponsor_id: c.sponsor_id,
        sponsor_initials: c.sponsor_initials,
        amount: c.amount,
        reason: reason.trim(),
      }));
      const { error: refundError } = await supabase.from("refunds").insert(refundRows);
      if (refundError) refundLogFailed = true;
    }

    const { error: deleteGoalError } = await supabase.from("funding_goals").delete().eq("id", goal.id);

    if (deleteGoalError) {
      setDeleteError("Failed to delete the goal: " + deleteGoalError.message);
      setProcessingGoalId(null);
      return;
    }

    // Update local state: remove the goal, and recompute the roadmap since
    // this course is no longer claimed and can be recommended again.
    const updatedGoals = goals.filter((g) => g.id !== goal.id);
    setGoals(updatedGoals);

    if (studentProfile) {
      const claimedTitles = updatedGoals.map((g) => g.title);
      setRoadmap(
        buildRoadmap(
          { skills: studentProfile.skills, interests: studentProfile.interests, goal: studentProfile.goal ?? "" },
          5,
          claimedTitles
        )
      );
    }

    setProcessingGoalId(null);
    setSuccessMessage(
      hasMoney
        ? `Goal removed. $${goal.amount_raised} simulated-refunded to ${goal.contributions.length === 1 ? "the sponsor" : "sponsors"} via Interledger.${refundLogFailed ? " (Note: the audit log entry failed to save.)" : ""}`
        : "Goal removed."
    );
  };

  if (loading || !profile || !studentProfile) return null;

  const nextStep = roadmap[0];
  const usingDefaults = studentProfile.skills.length === 0 && studentProfile.interests.length === 0 && !studentProfile.goal;
  const initials = `${profile.first_name[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase();

  return (
    <main className="min-h-screen relative z-10 px-6 py-12">
      <div className="max-w-3xl mx-auto space-y-6">
        {usingDefaults && (
          <div className="bg-white/5 backdrop-blur-xl border border-cyan-400/20 rounded-xl p-4 text-sm text-cyan-200">
            You haven&apos;t taken the assessment yet.{" "}
            <Link href="/assessment" className="underline font-medium text-cyan-300">
              Take the AI assessment
            </Link>{" "}
            to build your real roadmap and create funding goals.
          </div>
        )}

        {successMessage && (
          <div className="bg-white/5 backdrop-blur-xl border border-emerald-400/20 rounded-xl p-4 text-sm text-emerald-200">
            {successMessage}
          </div>
        )}

        {/* Profile summary */}
        <RevealOnScroll>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(139,92,246,0.15)] p-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 text-white flex items-center justify-center font-semibold text-lg shadow-[0_0_20px_rgba(139,92,246,0.4)]">
              {initials}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                {profile.first_name} {profile.last_name}
              </h1>
              <p className="text-sm text-purple-200/60">
                {profile.country || "Location not set"} · Goal: {studentProfile.goal || "Not set"}
              </p>
            </div>
          </div>
        </RevealOnScroll>

        {/* Roadmap */}
        <RevealOnScroll delay={80}>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(139,92,246,0.15)] p-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-white">Roadmap</h2>
              <span className="text-sm text-purple-300/50">{roadmap.length} matched courses</span>
            </div>
            {nextStep ? (
              <div className="bg-white/5 border border-violet-400/20 rounded-xl p-4">
                <p className="text-xs font-medium text-cyan-300 mb-1">Next recommended step</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-white">{nextStep.title}</p>
                  <span className="text-[10px] font-semibold uppercase tracking-wide bg-white/10 text-purple-200/80 border border-white/10 px-1.5 py-0.5 rounded">
                    {nextStep.provider}
                  </span>
                </div>
                <p className="text-xs text-purple-300/50">
                  {nextStep.difficulty} · {nextStep.duration} · {nextStep.estimatedCost === 0 ? "Free" : `$${nextStep.estimatedCost}`}
                </p>
              </div>
            ) : (
              <p className="text-sm text-purple-300/40">
                {goals.length > 0
                  ? "You've claimed every matched course — nice work."
                  : "No roadmap yet — take the assessment to generate one."}
              </p>
            )}
            <Link
              href="/assessment"
              className="inline-block mt-4 text-sm text-cyan-300 font-medium hover:text-cyan-200 transition-colors"
            >
              View / retake full assessment →
            </Link>
          </div>
        </RevealOnScroll>

        {/* Funding goals */}
        <div>
          <h2 className="font-semibold text-white mb-3">Your funding goals</h2>
          {goals.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-sm text-purple-300/40">
              No funding goals yet.{" "}
              <Link href="/assessment" className="text-cyan-300 underline">
                Create one from your roadmap
              </Link>
              .
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map((goal, i) => {
                const percentFunded = getPercentFunded(goal.amount_raised, goal.amount_needed);
                const isConfirming = confirmingGoalId === goal.id;
                const isProcessing = processingGoalId === goal.id;

                return (
                  <RevealOnScroll
                    key={goal.id}
                    delay={i * 80}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(139,92,246,0.15)] p-6"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-medium text-white">{goal.title}</p>
                        <p className="text-xs text-purple-300/50">
                          ${goal.amount_raised} of ${goal.amount_needed} raised
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-fuchsia-300">{percentFunded}%</span>
                        {!isConfirming && !isProcessing && (
                          <button
                            onClick={() => startDeleteFlow(goal.id)}
                            className="text-xs text-red-300/70 hover:text-red-300 border border-red-400/20 hover:border-red-400/40 rounded-full px-2.5 py-1 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2 mb-4 border border-white/5">
                      <div
                        className="bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 h-2 rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(139,92,246,0.6)]"
                        style={{ width: `${percentFunded}%` }}
                      />
                    </div>

                    {isConfirming && (
                      <div className="bg-red-500/5 border border-red-400/20 rounded-xl p-4 mb-4">
                        <p className="text-sm text-red-200 font-medium mb-2">Delete this goal?</p>
                        {goal.amount_raised > 0 && (
                          <p className="text-xs text-purple-300/60 mb-2">
                            ${goal.amount_raised} already raised will be refunded (simulated) to{" "}
                            {goal.contributions.length === 1 ? "the sponsor who funded it" : "the sponsors who funded it"}.
                          </p>
                        )}
                        <textarea
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="Brief reason for deleting this goal (required)"
                          rows={2}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-purple-300/40 focus:border-red-400/50 outline-none mb-2"
                        />
                        {deleteError && <p className="text-xs text-red-300 mb-2">{deleteError}</p>}
                        <div className="flex gap-2">
                          <button
                            onClick={() => confirmDelete(goal)}
                            className="text-sm bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-400/30 rounded-lg px-3 py-1.5 transition-colors"
                          >
                            Confirm delete{goal.amount_raised > 0 ? " & refund" : ""}
                          </button>
                          <button
                            onClick={cancelDeleteFlow}
                            className="text-sm text-purple-300/60 hover:text-white px-3 py-1.5 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {isProcessing && (
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
                        <p className="text-xs font-medium text-purple-300/60 mb-4">Processing refund...</p>
                        <div className="flex items-center justify-between">
                          {REFUND_HOPS.map((hop, i) => (
                            <div key={hop} className="flex items-center flex-1">
                              <div className="flex flex-col items-center flex-shrink-0">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-500 ${
                                    hopStatuses[i] === "done"
                                      ? "bg-gradient-to-br from-emerald-400 to-cyan-400 text-white shadow-[0_0_14px_rgba(34,211,238,0.5)]"
                                      : hopStatuses[i] === "active"
                                      ? "bg-gradient-to-br from-cyan-400 to-violet-500 text-white animate-pulse shadow-[0_0_18px_rgba(34,211,238,0.6)]"
                                      : "bg-white/5 border border-white/10 text-purple-300/40"
                                  }`}
                                >
                                  {hopStatuses[i] === "done" ? "✓" : i + 1}
                                </div>
                                <p className="text-[10px] text-purple-300/50 mt-1.5 text-center w-16">{hop}</p>
                              </div>
                              {i < REFUND_HOPS.length - 1 && (
                                <div className="flex-1 h-0.5 mx-1 mb-5 bg-white/5 relative overflow-hidden rounded-full">
                                  <div
                                    className={`h-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all duration-700 ${
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

                    <p className="text-xs font-medium text-purple-300/50 mb-2">Sponsor activity</p>
                    {goal.contributions.length === 0 ? (
                      <p className="text-sm text-purple-300/40">No contributions yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {goal.contributions.map((c, ci) => (
                          <li key={ci} className="flex items-center gap-2 text-sm text-purple-200/70">
                            <span className="w-7 h-7 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-xs font-medium text-purple-100">
                              {c.sponsor_initials}
                            </span>
                            contributed ${c.amount} · {new Date(c.created_at).toLocaleDateString()}
                            {c.source === "ilp" && <span className="text-xs text-cyan-300/70">(real ILP)</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </RevealOnScroll>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
