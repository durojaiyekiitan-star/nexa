"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RevealOnScroll from "@/components/RevealOnScroll";

interface HeroVariant {
  line1: string;
  line2: string;
  subtext: string;
}

const HERO_VARIANTS: HeroVariant[] = [
  { line1: "Talent isn't the problem.", line2: "Access is.", subtext: "Nexa connects ambitious students with sponsors anywhere in the world — matched by AI, funded across borders in seconds, no matter the amount." },
  { line1: "Your zip code", line2: "shouldn't cap your potential.", subtext: "AI finds the right sponsor for your goals. Interledger moves the money — instantly, anywhere, any amount." },
  { line1: "Great ideas are everywhere.", line2: "Funding isn't.", subtext: "Nexa closes the gap between ambition and opportunity with AI-matched sponsorship and borderless payments." },
  { line1: "One dollar.", line2: "Infinite reach.", subtext: "Interledger makes micro-sponsorship possible — so a single sponsor's small gift can change a student's entire trajectory." },
  { line1: "Opportunity shouldn't need", line2: "a passport.", subtext: "Nexa connects talent and capital across any border, any currency, any amount — powered by AI matching and the Interledger Protocol." },
];

const STEPS = [
  { title: "Get assessed", description: "A quick AI skill assessment turns your skills and goals into a personalized learning roadmap." },
  { title: "Get matched", description: "AI matches you to scholarships, sponsors, and courses — ranked by how well they fit you." },
  { title: "Get funded", description: "Sponsors anywhere fund your goal in any amount, moved instantly across borders by Interledger." },
];

const ROLE_CARDS = [
  {
    label: "Students",
    headline: "Get discovered for what you can do — not where you're from.",
    points: ["AI-built learning roadmap from your skills and goals", "Matched to sponsors and scholarships automatically", "Track every course, every milestone, every dollar raised"],
    cta: "Join as a student",
    role: "student",
  },
  {
    label: "Sponsors",
    headline: "Fund a real person's real goal — and watch it happen.",
    points: ["Browse students ranked by fit to your interests", "Fund in any amount, from $5 to full tuition", "See exactly what your money went toward"],
    cta: "Join as a sponsor",
    role: "sponsor",
  },
  {
    label: "Organizations",
    headline: "Run scholarship programs at a scale one person can't.",
    points: ["Create programs with your own eligibility criteria", "Track completion rates across every student funded", "One dashboard for your entire portfolio"],
    cta: "Join as an organization",
    role: "organization",
  },
];

const FAQS = [
  { q: "Is this real money?", a: "Real payments move on the Interledger test network — genuine protocol, genuine cross-wallet transfers, using test-network value rather than production funds." },
  { q: "What does the AI actually do?", a: "It scores your skills and interests against a real course catalog (Coursera, Udemy, edX) to build your roadmap, and ranks sponsor/student matches using a skill-adjacency algorithm — no black box, fully explainable." },
  { q: "Why Interledger instead of a normal payment processor?", a: "Interledger is protocol-level, not one company's network — it lets a sponsor's bank card in one country reach a student's mobile money account in another, in any amount, without either side needing to be on the same payment rail." },
  { q: "Do I need to link a real wallet?", a: "Students and sponsors link an Interledger test wallet at signup — it takes about a minute, and we walk you through it." },
];

export default function LandingPage() {
  const [hero, setHero] = useState<HeroVariant>(HERO_VARIANTS[0]);
  const [heroVisible, setHeroVisible] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
            <span className="bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">{hero.line2}</span>
          </h1>
          <p className="text-purple-200/70 text-lg mt-6 max-w-xl mx-auto">{hero.subtext}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-9">
          <Link href="/signup?role=student" className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white font-medium rounded-lg px-6 py-3 transition-all shadow-[0_0_25px_rgba(139,92,246,0.4)] hover:shadow-[0_0_35px_rgba(139,92,246,0.65)]">
            I&apos;m a Student
          </Link>
          <Link href="/signup?role=sponsor" className="bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg px-6 py-3 border border-white/15 backdrop-blur-md transition-colors">
            I&apos;m a Sponsor
          </Link>
        </div>
        <p className="text-sm text-purple-300/50 mt-10">251M+ young people worldwide are out of school — not for lack of talent, but for lack of access.</p>
      </section>

      {/* The Problem */}
      <section className="px-6 py-16">
        <RevealOnScroll className="max-w-4xl mx-auto">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_8px_40px_rgba(139,92,246,0.15)] p-10">
            <p className="text-xs font-semibold uppercase tracking-wide text-fuchsia-300 mb-3 text-center">The problem</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-6">Talent is everywhere. Access to it isn&apos;t.</h2>
            <div className="grid sm:grid-cols-3 gap-6 mt-8">
              <div className="text-center">
                <p className="text-3xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">251M+</p>
                <p className="text-sm text-purple-200/60 mt-1">young people worldwide are out of school</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">No bridge</p>
                <p className="text-sm text-purple-200/60 mt-1">between willing sponsors and undiscovered talent</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold bg-gradient-to-r from-fuchsia-300 to-pink-300 bg-clip-text text-transparent">Slow, costly</p>
                <p className="text-sm text-purple-200/60 mt-1">cross-border payments block the funding that does exist</p>
              </div>
            </div>
          </div>
        </RevealOnScroll>
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

      {/* Three roles, alternating layout */}
      <section className="px-6 py-16 max-w-4xl mx-auto space-y-6">
        {ROLE_CARDS.map((card, i) => (
          <RevealOnScroll key={card.role} delay={i * 100}>
            <div className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 flex flex-col md:flex-row gap-6 items-center ${i % 2 === 1 ? "md:flex-row-reverse" : ""}`}>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300 mb-2">{card.label}</p>
                <h3 className="text-xl font-bold text-white mb-3">{card.headline}</h3>
                <ul className="space-y-1.5 mb-4">
                  {card.points.map((p) => (
                    <li key={p} className="text-sm text-purple-200/70 flex gap-2">
                      <span className="text-cyan-300">•</span> {p}
                    </li>
                  ))}
                </ul>
                <Link href={`/signup?role=${card.role}`} className="inline-block text-sm text-cyan-300 font-medium hover:text-cyan-200 underline">
                  {card.cta} →
                </Link>
              </div>
              <div className="w-full md:w-40 h-24 rounded-xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-white/10 flex items-center justify-center flex-shrink-0">
                <span className="text-3xl">{card.role === "student" ? "🎓" : card.role === "sponsor" ? "🤝" : "🏛️"}</span>
              </div>
            </div>
          </RevealOnScroll>
        ))}
      </section>

      {/* Why Interledger */}
      <section className="px-6 py-16">
        <RevealOnScroll className="max-w-4xl mx-auto">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_8px_40px_rgba(139,92,246,0.15)] p-10">
            <p className="text-xs font-semibold uppercase tracking-wide text-fuchsia-300 mb-3 text-center">Under the hood</p>
            <h2 className="text-2xl font-bold text-white text-center mb-4">Why Interledger, not just a payment button</h2>
            <p className="text-purple-200/70 text-center max-w-2xl mx-auto mb-8">
              Interledger is like the internet, but for money — it lets completely different payment networks talk to each
              other. A sponsor&apos;s bank card in Canada doesn&apos;t need to know or care that a student&apos;s mobile
              money account in Nigeria exists on a totally different system.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap text-sm">
              <span className="bg-white/5 border border-white/10 rounded-full px-4 py-2 text-purple-200/70">Sponsor&apos;s Bank Card</span>
              <span className="text-cyan-300">→</span>
              <span className="bg-cyan-500/10 border border-cyan-400/30 rounded-full px-4 py-2 text-cyan-200">Interledger Protocol</span>
              <span className="text-cyan-300">→</span>
              <span className="bg-white/5 border border-white/10 rounded-full px-4 py-2 text-purple-200/70">Student&apos;s Mobile Money</span>
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-white text-center mb-8">Questions people actually ask</h2>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <RevealOnScroll key={faq.q} delay={i * 60}>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-sm font-medium text-white">{faq.q}</span>
                  <span className={`text-cyan-300 transition-transform duration-200 ${openFaq === i ? "rotate-45" : ""}`}>+</span>
                </button>
                {openFaq === i && <p className="px-5 pb-4 text-sm text-purple-200/60">{faq.a}</p>}
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <RevealOnScroll className="block">
        <section className="px-6 py-20 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to get started?</h2>
          <p className="text-purple-200/60 mb-6">It takes about two minutes — and you&apos;ll link a real payment wallet along the way.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup?role=student" className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white font-medium rounded-lg px-6 py-3 transition-all shadow-[0_0_25px_rgba(139,92,246,0.4)] hover:shadow-[0_0_35px_rgba(139,92,246,0.65)]">
              Join as a Student
            </Link>
            <Link href="/signup?role=sponsor" className="bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg px-6 py-3 border border-white/15 backdrop-blur-md transition-colors">
              Join as a Sponsor
            </Link>
            <Link href="/signup?role=organization" className="text-sm text-cyan-300/80 hover:text-cyan-300 underline self-center">
              Or manage scholarship programs →
            </Link>
          </div>
        </section>
      </RevealOnScroll>
    </main>
  );
}
