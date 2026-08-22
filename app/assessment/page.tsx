"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  assessSkills,
  buildRoadmap,
  SKILL_TAGS,
  INTEREST_TAGS,
  GOAL_OPTIONS,
  type SkillAssessment,
  type RoadmapItem,
} from "@/lib/ai-engine";
import { createClient } from "@/lib/supabase/client";
import { ROLE_HOME, type Role } from "@/lib/auth/roles";
import { Plus, CheckCircle2 } from "lucide-react";

const PROCESSING_STEPS = [
  "Analyzing skill gaps...",
  "Fetching top courses on Coursera, Udemy, and edX...",
  "Generating your personalized roadmap...",
];

function TagPicker({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (tag: string) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-purple-100 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((tag) => {
          const isSelected = selected.includes(tag);
          return (
            <button
              type="button"
              key={tag}
              onClick={() => onToggle(tag)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                isSelected
                  ? "bg-gradient-to-r from-cyan-500 to-violet-500 text-white border-transparent shadow-[0_0_16px_rgba(139,92,246,0.5)]"
                  : "bg-white/5 text-purple-200/70 border-white/10 hover:border-cyan-400/40 hover:text-white"
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RadarBars({ scores }: { scores: SkillAssessment["radarScores"] }) {
  return (
    <div className="space-y-3">
      {Object.entries(scores).map(([category, value]) => (
        <div key={category}>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-purple-100">{category}</span>
            <span className="text-purple-300/60">{value}</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-2.5 border border-white/5">
            <div
              className="bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 h-2.5 rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(139,92,246,0.6)]"
              style={{ width: `${value}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AssessmentPage() {
  const router = useRouter();
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [goal, setGoal] = useState<string>("");
  const [assessment, setAssessment] = useState<SkillAssessment | null>(null);
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);
  const [lastClaimedTitle, setLastClaimedTitle] = useState<string | null>(null);
  const [claimedTitles, setClaimedTitles] = useState<string[]>([]);
  const [saveError, setSaveError] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);

  // Require login, and pre-fill from whatever's already saved for this student
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

      const { data: studentProfile } = await supabase
        .from("student_profiles")
        .select("skills, interests, goal")
        .eq("profile_id", user.id)
        .single();

      const { data: existingGoals } = await supabase.from("funding_goals").select("title").eq("student_id", user.id);
      setClaimedTitles((existingGoals ?? []).map((g) => g.title));

      if (studentProfile) {
        setSkills(studentProfile.skills ?? []);
        setInterests(studentProfile.interests ?? []);
        setGoal(studentProfile.goal ?? "");
      }
      setLoadingAuth(false);
    };

    load();
  }, [router]);

  const toggle = (list: string[], setList: (v: string[]) => void, tag: string) => {
    setList(list.includes(tag) ? list.filter((t) => t !== tag) : [...list, tag]);
  };

  const runAssessment = async () => {
    if (!userId) return;
    setSaveError("");
    setLastClaimedTitle(null);
    setIsProcessing(true);
    setProcessingStep(0);

    // Simulated staged processing — the actual computation below is
    // near-instant (pure functions), so this is deliberately paced for
    // clarity/feel, not real latency. Each step gets its own delay so the
    // labels are readable rather than flashing past.
    await new Promise((r) => setTimeout(r, 700));
    setProcessingStep(1);
    await new Promise((r) => setTimeout(r, 900));
    setProcessingStep(2);
    await new Promise((r) => setTimeout(r, 700));

    const profile = { skills, interests, goal };
    setAssessment(assessSkills(profile));
    setRoadmap(buildRoadmap(profile, 5, claimedTitles));

    const supabase = createClient();
    const { error } = await supabase.from("student_profiles").update({ skills, interests, goal }).eq("profile_id", userId);
    if (error) setSaveError("Your roadmap was generated, but saving to your profile failed: " + error.message);

    setIsProcessing(false);
  };

  const handleCreateGoal = async (item: RoadmapItem) => {
    if (!userId) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("funding_goals")
      .insert({ student_id: userId, title: item.title, amount_needed: item.estimatedCost })
      .select("id")
      .single();

    if (error || !data) {
      setSaveError("Failed to create funding goal: " + (error?.message ?? "unknown error"));
      return;
    }
    setLastClaimedTitle(item.title);

    // Recompute right away — the course the student just claimed disappears
    // from the roadmap and the next best match takes its place, without
    // needing to re-run the assessment.
    const updatedClaimed = [...claimedTitles, item.title];
    setClaimedTitles(updatedClaimed);
    setRoadmap(buildRoadmap({ skills, interests, goal }, 5, updatedClaimed));
  };

  const canSubmit = skills.length > 0 && goal !== "";

  if (loadingAuth) return null;

  return (
    <main className="min-h-screen relative z-10 px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">AI Skill Assessment</h1>
        <p className="text-purple-200/60 mb-8">
          Tell us what you know and where you want to go. We&apos;ll build your personalized learning path.
        </p>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(139,92,246,0.15)] p-6 space-y-6">
          <TagPicker
            label="Your skills"
            options={SKILL_TAGS}
            selected={skills}
            onToggle={(t) => toggle(skills, setSkills, t)}
          />
          <TagPicker
            label="Your interests"
            options={INTEREST_TAGS}
            selected={interests}
            onToggle={(t) => toggle(interests, setInterests, t)}
          />
          <div>
            <p className="text-sm font-medium text-purple-100 mb-2">Your career goal</p>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white [&>option]:bg-[#1A0B36]"
            >
              <option value="">Select a goal...</option>
              {GOAL_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={runAssessment}
            disabled={!canSubmit || isProcessing}
            className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 disabled:from-white/10 disabled:to-white/10 disabled:text-purple-300/40 text-white font-medium rounded-lg py-2.5 transition-all hover:from-indigo-400 hover:to-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] disabled:shadow-none"
          >
            {isProcessing ? "Working on it..." : "Get my roadmap"}
          </button>

          {saveError && <p className="text-sm text-red-300">{saveError}</p>}
        </div>

        {isProcessing && (
          <div className="mt-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(139,92,246,0.15)] p-10 flex flex-col items-center text-center">
            <div className="relative w-16 h-16 mb-6">
              <div className="absolute inset-0 rounded-full border-2 border-cyan-400/20" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400 border-r-violet-400 animate-spin shadow-[0_0_25px_rgba(34,211,238,0.5)]" />
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/20 animate-pulse" />
            </div>
            <p key={processingStep} className="text-sm font-medium text-white animate-[fadeIn_0.4s_ease-out]">
              {PROCESSING_STEPS[processingStep]}
            </p>
            <div className="flex gap-1.5 mt-4">
              {PROCESSING_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i <= processingStep ? "w-8 bg-gradient-to-r from-cyan-400 to-violet-400" : "w-4 bg-white/10"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {assessment && !isProcessing && (
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(139,92,246,0.15)] p-6">
              <h2 className="font-semibold text-white mb-4">Your skill profile</h2>
              <RadarBars scores={assessment.radarScores} />
              <p className="text-sm text-purple-200/60 mt-4">
                Strongest area:{" "}
                <span className="font-medium text-cyan-300">{assessment.topCategory}</span>
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(139,92,246,0.15)] p-6">
              <h2 className="font-semibold text-white mb-4">Your recommended roadmap</h2>
              {lastClaimedTitle && (
                <div className="flex items-center gap-3 mb-4 bg-emerald-500/10 backdrop-blur-md border border-emerald-400/30 rounded-xl px-4 py-3 shadow-[0_0_20px_rgba(52,211,153,0.15)]">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={18} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-emerald-100">Funding goal created</p>
                    <p className="text-xs text-emerald-200/70 truncate">&quot;{lastClaimedTitle}&quot;</p>
                  </div>
                  <button
                    onClick={() => router.push("/student/dashboard")}
                    className="text-xs font-medium text-emerald-200 hover:text-white bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 rounded-lg px-3 py-1.5 transition-colors flex-shrink-0"
                  >
                    View dashboard
                  </button>
                </div>
              )}
              <ol className="space-y-4">
                {roadmap.map((item) => (
                  <li key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-white text-sm">
                        {item.order}. {item.title}
                      </p>
                      <span className="text-[10px] font-semibold uppercase tracking-wide bg-white/10 text-purple-200/80 border border-white/10 px-1.5 py-0.5 rounded">
                        {item.provider}
                      </span>
                    </div>
                    <p className="text-xs text-purple-300/50 mb-3">
                      {item.difficulty} · {item.duration} · {item.estimatedCost === 0 ? "Free" : `$${item.estimatedCost}`}
                    </p>
                    <button
                      onClick={() => handleCreateGoal(item)}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 hover:from-cyan-500/30 hover:to-violet-500/30 text-cyan-100 text-sm font-medium border border-cyan-400/30 hover:border-cyan-400/50 rounded-lg py-2 transition-all backdrop-blur-md shadow-[0_0_16px_rgba(34,211,238,0.15)] hover:shadow-[0_0_24px_rgba(34,211,238,0.3)]"
                    >
                      <Plus size={16} />
                      {item.estimatedCost === 0 ? "Add as free course goal" : "Create a funding goal"}
                    </button>
                  </li>
                ))}
                {roadmap.length === 0 && (
                  <p className="text-sm text-purple-300/40">
                    {claimedTitles.length > 0
                      ? "You've created goals for every course that matches your profile right now — nice work. Add more skills or interests above to unlock further recommendations."
                      : "No strong matches yet — try adding a skill or interest that relates to your goal."}
                  </p>
                )}
              </ol>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
