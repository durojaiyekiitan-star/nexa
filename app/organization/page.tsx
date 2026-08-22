"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ROLE_HOME, type Role } from "@/lib/auth/roles";

interface ScholarshipProgram {
  id: string;
  name: string;
  criteria: string;
  total_pool: number;
  slots: number;
}

export default function OrganizationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [programs, setPrograms] = useState<ScholarshipProgram[]>([]);
  const [studentsFunded, setStudentsFunded] = useState(0);
  const [totalDistributed, setTotalDistributed] = useState(0);
  const [completionRate, setCompletionRate] = useState(0);

  const [name, setName] = useState("");
  const [criteria, setCriteria] = useState("");
  const [totalPool, setTotalPool] = useState("");
  const [slots, setSlots] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      if (roleCheck && roleCheck.role !== "organization") {
        router.push(ROLE_HOME[roleCheck.role as Role] ?? "/");
        return;
      }

      const [{ data: programsData }, { data: allGoals }] = await Promise.all([
        supabase
          .from("scholarship_programs")
          .select("id, name, criteria, total_pool, slots")
          .eq("organization_id", user.id)
          .order("created_at", { ascending: false }),
        supabase.from("funding_goals").select("student_id, amount_raised, amount_needed"),
      ]);

      setPrograms(programsData ?? []);

      const goals = allGoals ?? [];
      const fundedStudentIds = new Set(goals.filter((g) => g.amount_raised > 0).map((g) => g.student_id));
      setStudentsFunded(fundedStudentIds.size);
      setTotalDistributed(goals.reduce((sum, g) => sum + Number(g.amount_raised), 0));
      const fullyFunded = goals.filter((g) => Number(g.amount_raised) >= Number(g.amount_needed)).length;
      setCompletionRate(goals.length > 0 ? Math.round((fullyFunded / goals.length) * 100) : 0);

      setLoading(false);
    };

    load();
  }, [router]);

  const canSubmit = name.trim() && criteria.trim() && Number(totalPool) > 0 && Number(slots) > 0;

  const handleCreate = async () => {
    if (!canSubmit || !userId) return;
    setSubmitError("");
    setIsSubmitting(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("scholarship_programs")
      .insert({
        organization_id: userId,
        name: name.trim(),
        criteria: criteria.trim(),
        total_pool: Number(totalPool),
        slots: Number(slots),
      })
      .select("id, name, criteria, total_pool, slots")
      .single();

    if (error || !data) {
      setSubmitError(error?.message ?? "Failed to create program");
      setIsSubmitting(false);
      return;
    }

    setPrograms((prev) => [data, ...prev]);
    setName("");
    setCriteria("");
    setTotalPool("");
    setSlots("");
    setIsSubmitting(false);
  };

  if (loading) return null;

  return (
    <main className="min-h-screen relative z-10 px-6 py-12">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Organization Dashboard</h1>
          <p className="text-sm text-purple-200/60">
            Distribute funding at scale and track outcomes across many students at once.
          </p>
        </div>

        {/* Aggregate monitoring — real, platform-wide numbers */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(139,92,246,0.15)] p-6 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">{studentsFunded}</p>
            <p className="text-xs text-purple-300/50 mt-1">Students funded</p>
          </div>
          <div>
            <p className="text-2xl font-bold bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
              ${totalDistributed.toFixed(0)}
            </p>
            <p className="text-xs text-purple-300/50 mt-1">Total distributed</p>
          </div>
          <div>
            <p className="text-2xl font-bold bg-gradient-to-r from-fuchsia-300 to-pink-300 bg-clip-text text-transparent">{completionRate}%</p>
            <p className="text-xs text-purple-300/50 mt-1">Goals fully funded</p>
          </div>
        </div>

        {/* Create scholarship program */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(139,92,246,0.15)] p-6">
          <h2 className="font-semibold text-white mb-4">Create a scholarship program</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-purple-100 mb-1 block">Program name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Emerging Tech Talent Fund"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-purple-300/40 focus:border-cyan-400/50 outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-purple-100 mb-1 block">Eligibility criteria</label>
              <input
                value={criteria}
                onChange={(e) => setCriteria(e.target.value)}
                placeholder="e.g., AI or Data interest, any country"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-purple-300/40 focus:border-cyan-400/50 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-purple-100 mb-1 block">Total pool ($)</label>
                <input
                  type="number"
                  value={totalPool}
                  onChange={(e) => setTotalPool(e.target.value)}
                  placeholder="2000"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-purple-300/40 focus:border-cyan-400/50 outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-purple-100 mb-1 block">Number of slots</label>
                <input
                  type="number"
                  value={slots}
                  onChange={(e) => setSlots(e.target.value)}
                  placeholder="15"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-purple-300/40 focus:border-cyan-400/50 outline-none"
                />
              </div>
            </div>
            <button
              onClick={handleCreate}
              disabled={!canSubmit || isSubmitting}
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 disabled:from-white/10 disabled:to-white/10 disabled:text-purple-300/40 text-white font-medium rounded-lg py-2.5 transition-all hover:from-indigo-400 hover:to-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] disabled:shadow-none"
            >
              {isSubmitting ? "Creating..." : "Create program"}
            </button>
            {submitError && <p className="text-sm text-red-300">{submitError}</p>}
          </div>
        </div>

        {/* Existing programs */}
        <div>
          <h2 className="font-semibold text-white mb-3">Your scholarship programs</h2>
          {programs.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-sm text-purple-300/40">
              No programs yet — create one above.
            </div>
          ) : (
            <div className="space-y-3">
              {programs.map((p) => (
                <div
                  key={p.id}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(139,92,246,0.15)] p-5"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-white">{p.name}</p>
                      <p className="text-xs text-purple-300/50 mt-1">{p.criteria}</p>
                    </div>
                    <span className="text-xs bg-fuchsia-500/10 border border-fuchsia-400/20 text-fuchsia-200 font-semibold px-2 py-1 rounded-full flex-shrink-0">
                      {p.slots} slots
                    </span>
                  </div>
                  <p className="text-sm text-purple-200/70 mt-3">${p.total_pool} total pool</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-purple-300/40">
          This is a simplified view for the MVP — in a full build, programs created here would feed directly
          into the AI opportunity matching engine as opportunities students can be matched against.
        </p>
      </div>
    </main>
  );
}
