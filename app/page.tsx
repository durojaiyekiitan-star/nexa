"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RevealOnScroll from "@/components/RevealOnScroll";

const STEPS = [
  {
    title: "Get assessed",
    description: "A quick AI skill assessment turns your skills and goals into a personalized learning roadmap.",
  },
  {
    title: "Get matched",
    description: "AI matches you to scholarships, sponsors, and courses — ranked by how well they fit you.",
  },
  {
    title: "Get funded",
    description: "Sponsors anywhere fund your goal in any amount, moved instantly across borders by Interledger.",
  },
];

interface HeroVariant {
  line1: string;
  line2: string;
  subtext: string;
}

const HERO_VARIANTS: HeroVariant[] = [
  {
    line1: "Talent isn't the problem.",
    line2: "Access is.",
    subtext:
      "Nexa connects ambitious students with sponsors anywhere in the world — matched by AI, funded across borders in seconds, no matter the amount.",
  },
  {
    line1: "Your zip code",
    line2: "shouldn't cap your potential.",
    subtext: "AI finds the right sponsor for your goals. Interledger moves the money — instantly, anywhere, any amount.",
  },
  {
    line1: "Great ideas are everywhere.",
    line2: "Funding isn't.",
    subtext:
      "Nexa closes the gap between ambition and opportunity with AI-matched sponsorship and borderless payments.",
  },
  {
    line1: "One dollar.",
    line2: "Infinite reach.",
    subtext:
      "Interledger makes micro-sponsorship possible — so a single sponsor's small gift can change a student's entire trajectory.",
  },
  {
    line1: "Opportunity shouldn't need",
    line2: "a passport.",
    subtext:
      "Nexa connects talent and capital across any border, any currency, any amount — powered by AI matching and the Interledger Protocol.",
  },
];

export default function LandingPage() {
  const [hero, setHero] = useState<HeroVariant>(HERO_VARIANTS[0]);
  const [heroVisible, setHeroVisible] = useState(true);

  // Picks a different value proposition each time someone lands on the
  // page, rather than always showing the same headline. Runs client-side
  // (after mount) so every real visit gets its own random pick, rather
  // than baking one choice in at build time.
  useEffect(() => {
    const random = HERO_VARIANTS[Math.floor(Math.random() * HERO_VARIANTS.length)];
    setHeroVisible(false);
    const t = setTimeout(() => {
      setHero(random);
      setHeroVisible(true);
    }, 120);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className="min-h-screen relative z-10">
      {/* Hero */}
      <section className="px-6 pt-24 pb-20 max-w-4xl mx-auto text-center">
        <p className="inline-block text-xs font-semibold tracking-wide text-cyan-300 bg-white/5 backdrop-blur-md border border-cyan-400/20 px-3 py-1 rounded-full mb-6">
          AI + Interledger Protocol
        </p>
        <div className={`transition-opacity duration-500 ${heroVisible ? "opacity-100" : "opacity-0"}`}>
          <h1 className="text-4xl sm:text-6xl font-bold text-white leading-tight tracking-tight">
            {hero.line1}
            <br />
            <span className="bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
              {hero.line2}
            </span>
          </h1>
          <p className="text-purple-200/70 text-lg mt-6 max-w-xl mx-auto">{hero.subtext}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-9">
          <Link
            href="/assessment"
            className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white font-medium rounded-lg px-6 py-3 transition-all shadow-[0_0_25px_rgba(139,92,246,0.4)] hover:shadow-[0_0_35px_rgba(139,92,246,0.65)]"
          >
            I&apos;m a Student
          </Link>
          <Link
            href="/sponsor/dashboard"
            className="bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg px-6 py-3 border border-white/15 backdrop-blur-md transition-colors"
          >
            I&apos;m a Sponsor
          </Link>
        </div>

        <p className="text-sm text-purple-300/50 mt-10">
          251M+ young people worldwide are out of school — not for lack of talent, but for lack of access.
        </p>

        <p className="text-sm text-purple-300/40 mt-4">
          Representing an organization?{" "}
          <Link href="/organization" className="text-cyan-300/80 hover:text-cyan-300 underline transition-colors">
            Manage scholarship programs →
          </Link>
        </p>
      </section>

      {/* How it works */}
      <section className="px-6 py-16">
        <RevealOnScroll className="max-w-4xl mx-auto">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_8px_40px_rgba(139,92,246,0.15)] p-10">
            <h2 className="text-2xl font-bold text-white text-center mb-12">How Nexa works</h2>
            <div className="grid sm:grid-cols-3 gap-8">
              {STEPS.map((step, i) => (
                <RevealOnScroll key={step.title} delay={i * 120}>
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 text-white flex items-center justify-center font-semibold mx-auto mb-4 shadow-[0_0_20px_rgba(34,211,238,0.4)]">
                      {i + 1}
                    </div>
                    <h3 className="font-semibold text-white mb-2">{step.title}</h3>
                    <p className="text-sm text-purple-200/60">{step.description}</p>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* Impact stats */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <div className="grid sm:grid-cols-3 gap-4 text-center">
          <RevealOnScroll delay={0}>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-cyan-400/30 transition-colors">
              <p className="text-2xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                Borderless
              </p>
              <p className="text-sm text-purple-200/60 mt-1">Any sponsor, any student, anywhere</p>
            </div>
          </RevealOnScroll>
          <RevealOnScroll delay={120}>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-violet-400/30 transition-colors">
              <p className="text-2xl font-bold bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                Any amount
              </p>
              <p className="text-sm text-purple-200/60 mt-1">Interledger makes micropayments efficient</p>
            </div>
          </RevealOnScroll>
          <RevealOnScroll delay={240}>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-fuchsia-400/30 transition-colors">
              <p className="text-2xl font-bold bg-gradient-to-r from-fuchsia-300 to-pink-300 bg-clip-text text-transparent">
                Fully tracked
              </p>
              <p className="text-sm text-purple-200/60 mt-1">Every dollar visible, milestone by milestone</p>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* Closing CTA */}
      <RevealOnScroll className="block">
        <section className="px-6 py-20 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">See it in action</h2>
          <p className="text-purple-200/60 mb-6">Try the AI assessment or watch a cross-border payment move in real time.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/assessment"
              className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white font-medium rounded-lg px-6 py-3 transition-all shadow-[0_0_25px_rgba(139,92,246,0.4)] hover:shadow-[0_0_35px_rgba(139,92,246,0.65)]"
            >
              Try the AI Assessment
            </Link>
            <Link
              href="/funding"
              className="bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg px-6 py-3 border border-white/15 backdrop-blur-md transition-colors"
            >
              See a Live Payment Flow
            </Link>
          </div>
        </section>
      </RevealOnScroll>
    </main>
  );
}
