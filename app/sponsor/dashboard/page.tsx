"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { matchScore, INTEREST_TAGS } from "@/lib/ai-engine";
import { createClient } from "@/lib/supabase/client";
import { ROLE_HOME, type Role } from "@/lib/auth/roles";
import { getPercentFunded } from "@/lib/utils/funding";
import RevealOnScroll from "@/components/RevealOnScroll";
import { ChevronDown, ArrowRight, AlertTriangle } from "lucide-react";

interface GoalRow {
  id: string;
  student_id: string;
  title: string;
  amount_needed: number;
  amount_raised: number;
}

interface StudentCard {
  id: string;
  name: string;
  country: string | null;
  skills: string[];
  interests: string[];
  goal: string | null;
  matchPercent: number;
  goals: GoalRow[];
  hasWallet: boolean;
}

export default function SponsorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [sponsorFirstName, setSponsorFirstName] = useState("");
  const [sponsorInterests, setSponsorInterests] = useState<string[]>([]);
  const [savingInterests, setSavingInterests] = useState(false);
  const [students, setStudents] = useState<StudentCard[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [fundedCount, setFundedCount] = useState(0);
  const [totalDistributed, setTotalDistributed] = useState(0);
  const [goalsCompleted, setGoalsCompleted] = useState(0);

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
      if (roleCheck && roleCheck.role !== "sponsor") {
        router.push(ROLE_HOME[roleCheck.role as Role] ?? "/");
        return;
      }

      const [{ data: profileData }, { data: sponsorData }] = await Promise.all([
        supabase.from("profiles").select("first_name").eq("id", user.id).single(),
        supabase.from("sponsor_profiles").select("interests").eq("profile_id", user.id).single(),
      ]);
      if (profileData) setSponsorFirstName(profileData.first_name);
      const myInterests = sponsorData?.interests ?? [];
      setSponsorInterests(myInterests);

      const { data: studentProfiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, country, ilp_wallet_address")
        .eq("role", "student");

      if (!studentProfiles || studentProfiles.length === 0) {
        setLoading(false);
        return;
      }
      const studentIds = studentProfiles.map((s) => s.id);

      const [{ data: studentDetails }, { data: allGoals }] = await Promise.all([
        supabase.from("student_profiles").select("profile_id, skills, interests, goal").in("profile_id", studentIds),
        supabase
          .from("funding_goals")
          .select("id, student_id, title, amount_needed, amount_raised")
          .in("student_id", studentIds),
      ]);

      const detailMap = new Map((studentDetails ?? []).map((d) => [d.profile_id, d]));
      const goalsByStudent = new Map<string, GoalRow[]>();
      (allGoals ?? []).forEach((g) => {
        const list = goalsByStudent.get(g.student_id) ?? [];
        list.push(g);
        goalsByStudent.set(g.student_id, list);
      });

      const cards: StudentCard[] = studentProfiles.map((sp) => {
        const detail = detailMap.get(sp.id);
        const skills = detail?.skills ?? [];
        const studentInterests = detail?.interests ?? [];
        return {
          id: sp.id,
          name: `${sp.first_name} ${sp.last_name ?? ""}`.trim(),
          country: sp.country,
          skills,
          interests: studentInterests,
          goal: detail?.goal ?? null,
          matchPercent: matchScore(skills.concat(studentInterests), myInterests),
          goals: goalsByStudent.get(sp.id) ?? [],
          hasWallet: Boolean(sp.ilp_wallet_address),
        };
      });

      cards.sort((a, b) => b.matchPercent - a.matchPercent);
      setStudents(cards.filter((c) => c.goals.length > 0));

      const goalsList = allGoals ?? [];
      const fundedStudentIds = new Set(goalsList.filter((g) => g.amount_raised > 0).map((g) => g.student_id));
      setFundedCount(fundedStudentIds.size);
      setTotalDistributed(goalsList.reduce((sum, g) => sum + Number(g.amount_raised), 0));
      setGoalsCompleted(goalsList.filter((g) => Number(g.amount_raised) >= Number(g.amount_needed)).length);

      setLoading(false);
    };

    load();
  }, [router]);

  const toggleInterest = (tag: string) => {
    setSponsorInterests((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const saveInterests = async () => {
    if (!userId) return;
    setSavingInterests(true);
    const supabase = createClient();
    await supabase.from("sponsor_profiles").update({ interests: sponsorInterests }).eq("profile_id", userId);
    setSavingInterests(false);
    setStudents((prev) =>
      [...prev]
        .map((s) => ({ ...s, matchPercent: matchScore(s.skills.concat(s.interests), sponsorInterests) }))
        .sort((a, b) => b.matchPercent - a.matchPercent)
    );
  };

  const toggleExpanded = (studentId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  if (loading) return null;

  return (
    <main className="min-h-screen relative z-10 px-6 py-12">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome back, {sponsorFirstName}</h1>
          <p className="text-sm text-purple-200/60">Students below are ranked using your interests.</p>
        </div>

        {/* Interests editor */}
        <RevealOnScroll>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(139,92,246,0.15)] p-6">
            <h2 className="font-semibold text-white mb-3">Your interests</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {INTEREST_TAGS.map((tag) => {
                const isSelected = sponsorInterests.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleInterest(tag)}
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
            <button
              onClick={saveInterests}
              disabled={savingInterests}
              className="text-sm bg-white/5 hover:bg-white/10 text-cyan-200 border border-cyan-400/30 rounded-lg px-4 py-2 transition-colors"
            >
              {savingInterests ? "Saving..." : "Save interests"}
            </button>
          </div>
        </RevealOnScroll>

        {/* Impact panel */}
        <RevealOnScroll delay={80}>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(139,92,246,0.15)] p-6 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">{fundedCount}</p>
              <p className="text-xs text-purple-300/50 mt-1">Students funded</p>
            </div>
            <div>
              <p className="text-2xl font-bold bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                ${totalDistributed.toFixed(0)}
              </p>
              <p className="text-xs text-purple-300/50 mt-1">Total distributed</p>
            </div>
            <div>
              <p className="text-2xl font-bold bg-gradient-to-r from-fuchsia-300 to-pink-300 bg-clip-text text-transparent">{goalsCompleted}</p>
              <p className="text-xs text-purple-300/50 mt-1">Goals fully funded</p>
            </div>
          </div>
        </RevealOnScroll>

        {/* Ranked student feed — student-first, click to see all their goals */}
        <div>
          <h2 className="font-semibold text-white mb-3">Students matched to you</h2>
          {students.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-sm text-purple-300/40">
              No students with active funding goals yet.
            </div>
          ) : (
            <div className="space-y-4">
              {students.map((student, studentIndex) => {
                const isExpanded = expandedIds.has(student.id);
                const initials = student.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();
                const totalRaised = student.goals.reduce((sum, g) => sum + Number(g.amount_raised), 0);
                const totalNeeded = student.goals.reduce((sum, g) => sum + Number(g.amount_needed), 0);
                const overallPercent = getPercentFunded(totalRaised, totalNeeded);

                return (
                  <RevealOnScroll
                    key={student.id}
                    delay={studentIndex * 90}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(139,92,246,0.15)] overflow-hidden hover:border-violet-400/30 transition-colors"
                  >
                    {/* Student summary row — click to expand/collapse */}
                    <button
                      onClick={() => toggleExpanded(student.id)}
                      className="w-full flex items-center gap-4 p-5 text-left"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 text-white flex items-center justify-center font-semibold flex-shrink-0 shadow-[0_0_16px_rgba(139,92,246,0.4)]">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-white">{student.name}</p>
                            <p className="text-xs text-purple-300/50">
                              {student.country || "Location not set"} · {student.goal || "Goal not set"}
                            </p>
                          </div>
                          <span className="text-xs font-semibold text-fuchsia-200 bg-fuchsia-500/10 border border-fuchsia-400/20 px-2 py-1 rounded-full flex-shrink-0">
                            {student.matchPercent}% match
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 bg-white/5 rounded-full h-1.5 border border-white/5">
                            <div
                              className="bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 h-1.5 rounded-full"
                              style={{ width: `${overallPercent}%` }}
                            />
                          </div>
                          <span className="text-xs text-purple-300/40 flex-shrink-0">
                            {student.goals.length} active goal{student.goals.length === 1 ? "" : "s"} · {overallPercent}% funded overall
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {student.skills.map((skill) => (
                            <span key={skill} className="text-xs bg-white/5 border border-white/10 text-purple-200/70 px-2 py-0.5 rounded-full">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`flex-shrink-0 text-purple-300/50 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </button>

                    {/* Expanded: every goal this student is seeking */}
                    {isExpanded && (
                      <div className="border-t border-white/10 bg-white/[0.02] px-5 py-4 space-y-3">
                        {!student.hasWallet && (
                          <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-400/30 rounded-xl px-4 py-3">
                            <AlertTriangle size={16} className="text-amber-300 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-200">
                              This student has not linked an Interledger test wallet yet. Real transfers cannot be
                              initiated until they update their account settings.
                            </p>
                          </div>
                        )}
                        {student.goals.map((goal) => {
                          const goalPercent = getPercentFunded(goal.amount_raised, goal.amount_needed);
                          return (
                            <div key={goal.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                              <div className="flex justify-between items-start mb-2">
                                <p className="text-sm font-medium text-white">{goal.title}</p>
                                <span className="text-xs font-semibold text-fuchsia-300 flex-shrink-0 ml-2">{goalPercent}%</span>
                              </div>
                              <div className="w-full bg-white/5 rounded-full h-1.5 border border-white/5 mb-2">
                                <div
                                  className="bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 h-1.5 rounded-full"
                                  style={{ width: `${goalPercent}%` }}
                                />
                              </div>
                              <div className="flex justify-between items-center">
                                <p className="text-xs text-purple-300/50">
                                  ${goal.amount_raised} of ${goal.amount_needed} raised
                                </p>
                                {student.hasWallet ? (
                                  <Link
                                    href={`/funding?goalId=${goal.id}`}
                                    className="inline-flex items-center gap-1 text-sm text-cyan-300 font-medium hover:text-cyan-200 transition-colors"
                                  >
                                    Fund this goal <ArrowRight size={14} />
                                  </Link>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-sm text-purple-300/30 cursor-not-allowed">
                                    Fund this goal <ArrowRight size={14} />
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
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
