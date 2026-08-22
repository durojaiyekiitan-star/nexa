/**
 * Nexa AI Engine
 * ---------------
 * Deterministic, rule-based "AI" for skill assessment, roadmap generation,
 * and opportunity matching. No external calls, no API cost, fully explainable.
 */

export type Category = "Technical" | "Analytical" | "Creative" | "Communication";

export const CATEGORIES: Category[] = ["Technical", "Analytical", "Creative", "Communication"];

export const TAG_CATEGORY_MAP: Record<string, Category[]> = {
  // Technical
  Python: ["Technical", "Analytical"],
  JavaScript: ["Technical"],
  SQL: ["Technical", "Analytical"],
  Excel: ["Analytical"],
  "Machine Learning": ["Technical", "Analytical"],
  "Web Development": ["Technical", "Creative"],
  "Data Analysis": ["Analytical", "Technical"],

  // Analytical
  Statistics: ["Analytical"],
  Research: ["Analytical", "Communication"],
  "Problem Solving": ["Analytical"],

  // Creative
  Design: ["Creative"],
  Writing: ["Creative", "Communication"],
  "Video Editing": ["Creative", "Technical"],
  "UI/UX": ["Creative", "Technical"],

  // Communication
  "Public Speaking": ["Communication"],
  Marketing: ["Communication", "Creative"],
  Teaching: ["Communication"],
  "Project Management": ["Communication", "Analytical"],

  // Interests / goals
  AI: ["Technical", "Analytical"],
  Data: ["Analytical", "Technical"],
  Business: ["Communication", "Analytical"],
  Entrepreneurship: ["Communication", "Creative"],
};

export const SKILL_TAGS = ["Python", "JavaScript", "SQL", "Excel", "Machine Learning", "Web Development", "Data Analysis", "Design", "Writing", "Public Speaking", "Marketing", "Project Management"];
export const INTEREST_TAGS = ["AI", "Data", "Business", "Entrepreneurship", "Design", "Writing", "Marketing"];
export const GOAL_OPTIONS = ["Data Analyst", "Data Scientist", "AI Engineer", "Web Developer", "Product Designer", "Marketer", "Entrepreneur", "Product Manager"];

function tagsToCategoryScores(tags: string[] = []): Record<Category, number> {
  const scores: Record<Category, number> = { Technical: 0, Analytical: 0, Creative: 0, Communication: 0 };
  for (const tag of tags) {
    const cats = TAG_CATEGORY_MAP[tag];
    if (!cats) continue;
    for (const cat of cats) scores[cat] += 1;
  }
  return scores;
}

export interface StudentProfile {
  skills: string[];
  interests: string[];
  goal: string;
}

export interface SkillAssessment {
  rawScores: Record<Category, number>;
  radarScores: Record<Category, number>;
  topCategory: Category;
  goal: string;
}

export function assessSkills({ skills = [], interests = [], goal = "" }: StudentProfile): SkillAssessment {
  const skillScores = tagsToCategoryScores(skills);
  const interestScores = tagsToCategoryScores(interests);

  const combined = {} as Record<Category, number>;
  for (const cat of CATEGORIES) {
    combined[cat] = skillScores[cat] + interestScores[cat] * 0.5;
  }

  const max = Math.max(1, ...Object.values(combined));
  const normalized = {} as Record<Category, number>;
  for (const cat of CATEGORIES) {
    normalized[cat] = Math.round((combined[cat] / max) * 100);
  }

  return {
    rawScores: combined,
    radarScores: normalized,
    topCategory: CATEGORIES.reduce((a, b) => (combined[a] >= combined[b] ? a : b)),
    goal,
  };
}

export interface Course {
  id: string;
  title: string;
  provider: "Coursera" | "Udemy" | "edX";
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  categories: Category[];
  goalTags: string[];
  estimatedCost: number;
  duration: string;
}

// Curated from real, currently-existing courses on Coursera/Udemy/edX —
// real titles, real providers, realistic durations and prices. This is
// NOT a live API integration (that would need developer accounts/API
// keys with each platform, Coursera's especially isn't self-serve) — it's
// a hand-picked static dataset, refreshed periodically rather than
// fetched live. Matching/scoring logic below is unchanged from the
// original placeholder version.
export const COURSE_DATASET: Course[] = [
  { id: "c1", title: "Python for Everybody Specialization", provider: "Coursera", difficulty: "Beginner", categories: ["Technical", "Analytical"], goalTags: ["Data Analyst", "Data Scientist"], estimatedCost: 49, duration: "8 months, 2 hrs/week" },
  { id: "c2", title: "Google Data Analytics Professional Certificate", provider: "Coursera", difficulty: "Beginner", categories: ["Analytical"], goalTags: ["Data Analyst"], estimatedCost: 49, duration: "6 months, 10 hrs/week" },
  { id: "c3", title: "Machine Learning Specialization (Andrew Ng)", provider: "Coursera", difficulty: "Intermediate", categories: ["Technical", "Analytical"], goalTags: ["Data Scientist", "AI Engineer"], estimatedCost: 79, duration: "3 months, 10 hrs/week" },
  { id: "c4", title: "The Complete 2024 Web Development Bootcamp", provider: "Udemy", difficulty: "Beginner", categories: ["Technical", "Creative"], goalTags: ["Web Developer"], estimatedCost: 84, duration: "65 hours on-demand" },
  { id: "c5", title: "Google UX Design Professional Certificate", provider: "Coursera", difficulty: "Beginner", categories: ["Creative", "Technical"], goalTags: ["Product Designer"], estimatedCost: 49, duration: "6 months, 10 hrs/week" },
  { id: "c6", title: "Dynamic Public Speaking Specialization", provider: "Coursera", difficulty: "Beginner", categories: ["Communication"], goalTags: ["Marketer", "Entrepreneur"], estimatedCost: 49, duration: "5 months, 3 hrs/week" },
  { id: "c7", title: "Digital Marketing Specialization", provider: "Coursera", difficulty: "Beginner", categories: ["Communication", "Creative"], goalTags: ["Marketer"], estimatedCost: 49, duration: "7 months, 5 hrs/week" },
  { id: "c8", title: "The Complete SQL Bootcamp", provider: "Udemy", difficulty: "Beginner", categories: ["Technical", "Analytical"], goalTags: ["Data Analyst", "Data Scientist"], estimatedCost: 55, duration: "9 hours on-demand" },
  { id: "c9", title: "Google Project Management Professional Certificate", provider: "Coursera", difficulty: "Beginner", categories: ["Communication", "Analytical"], goalTags: ["Product Manager", "Entrepreneur"], estimatedCost: 49, duration: "6 months, 10 hrs/week" },
  { id: "c10", title: "Deep Learning Specialization", provider: "Coursera", difficulty: "Advanced", categories: ["Technical", "Analytical"], goalTags: ["AI Engineer", "Data Scientist"], estimatedCost: 79, duration: "5 months, 8 hrs/week" },
  { id: "c11", title: "CS50's Introduction to Computer Science", provider: "edX", difficulty: "Beginner", categories: ["Technical", "Analytical"], goalTags: ["Web Developer", "Data Analyst"], estimatedCost: 0, duration: "11 weeks, 6-18 hrs/week" },
  { id: "c12", title: "100 Days of Code: The Complete Python Pro Bootcamp", provider: "Udemy", difficulty: "Beginner", categories: ["Technical", "Creative"], goalTags: ["Web Developer", "AI Engineer"], estimatedCost: 85, duration: "100 hours on-demand" },
];

export interface RoadmapItem extends Course {
  order: number;
  score: number;
  matchedBecause: string[];
}

export function buildRoadmap(
  { skills = [], interests = [], goal = "" }: StudentProfile,
  limit = 5,
  excludeTitles: string[] = []
): RoadmapItem[] {
  const excludeSet = new Set(excludeTitles);

  const scored = COURSE_DATASET.filter((course) => !excludeSet.has(course.title)).map((course) => {
    let score = 0;
    const reasons: string[] = [];

    if (goal && course.goalTags.some((g) => g.toLowerCase() === goal.toLowerCase())) {
      score += 3;
      reasons.push("goal overlap");
    }

    const skillCategoryHit = course.categories.some((cat) =>
      skills.some((s) => (TAG_CATEGORY_MAP[s] || []).includes(cat))
    );
    if (skillCategoryHit) {
      score += 2;
      reasons.push("skill overlap");
    }

    const interestCategoryHit = course.categories.some((cat) =>
      interests.some((i) => (TAG_CATEGORY_MAP[i] || []).includes(cat))
    );
    if (interestCategoryHit) {
      score += 1;
      reasons.push("interest overlap");
    }

    return { ...course, score, matchedBecause: reasons };
  });

  return scored
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((c, i) => ({ order: i + 1, ...c }));
}

export interface Opportunity {
  id: string;
  name: string;
  tags: string[];
}

export function matchScore(profileTags: string[] = [], opportunityTags: string[] = []): number {
  if (opportunityTags.length === 0) return 0;

  const isExactMatch = (profTag: string, oppTag: string) => profTag.toLowerCase() === oppTag.toLowerCase();

  // Graduated adjacency: tags sharing BOTH categories (e.g. "Python" and "AI",
  // both Technical+Analytical) are meaningfully closer than tags sharing just
  // one (e.g. "Marketing" and "Design", both touch Creative but nothing else).
  // Tags sharing nothing score 0 — genuinely unrelated skills.
  const categoryOverlapCount = (profTag: string, oppTag: string) => {
    const profCats = TAG_CATEGORY_MAP[profTag] || [];
    const oppCats = TAG_CATEGORY_MAP[oppTag] || [];
    return profCats.filter((c) => oppCats.includes(c)).length;
  };
  const adjacencyWeight = (overlap: number) => (overlap >= 2 ? 0.6 : overlap === 1 ? 0.35 : 0);

  // For each of the sponsor's interest tags, find the strongest signal any
  // of the student's tags gives it: 1.0 for an exact match, a graduated
  // adjacency weight for a related-but-not-exact tag, 0 for nothing in common.
  let totalWeight = 0;
  for (const oppTag of opportunityTags) {
    let bestWeight = 0;
    for (const profTag of profileTags) {
      if (isExactMatch(profTag, oppTag)) {
        bestWeight = 1;
        break; // can't beat an exact match, stop looking
      }
      bestWeight = Math.max(bestWeight, adjacencyWeight(categoryOverlapCount(profTag, oppTag)));
    }
    totalWeight += bestWeight;
  }

  const hasExactMatch = opportunityTags.some((oppTag) => profileTags.some((profTag) => isExactMatch(profTag, oppTag)));

  if (hasExactMatch) {
    // A specialist whose whole tag list is relevant scores a clean 100%.
    // A generalist who happens to also have the exact tag, buried among
    // unrelated ones, ranks slightly below — "high, but right below pure
    // exact matches" — without ever dropping below the semantic-overlap
    // tier below.
    const unrelatedCount = profileTags.filter(
      (profTag) =>
        !opportunityTags.some(
          (oppTag) => isExactMatch(profTag, oppTag) || categoryOverlapCount(profTag, oppTag) > 0
        )
    ).length;
    const dilutionPenalty = Math.min(20, unrelatedCount * 3);
    return Math.round(100 - dilutionPenalty);
  }

  // No exact match anywhere: score reflects graduated semantic/category
  // proximity — e.g. "Marketing" against a "Design" interest (1 shared
  // category) lands around 35%, "Python" against an "AI" interest (2 shared
  // categories) lands around 60%, and a fully unrelated tag contributes 0.
  return Math.round((totalWeight / opportunityTags.length) * 100);
}

export function rankOpportunities(studentTags: string[], opportunities: Opportunity[]) {
  return opportunities
    .map((opp) => ({ ...opp, matchPercent: matchScore(studentTags, opp.tags) }))
    .sort((a, b) => b.matchPercent - a.matchPercent);
}

export interface Milestone {
  id: string;
  label: string;
  releasePercent: number;
  completed: boolean;
}

export const DEFAULT_MILESTONES: Omit<Milestone, "completed">[] = [
  { id: "enrolled", label: "Enrolled", releasePercent: 30 },
  { id: "halfway", label: "50% Complete", releasePercent: 40 },
  { id: "certified", label: "Certificate Earned", releasePercent: 30 },
];

export interface FundingGoal {
  title: string;
  amountNeeded: number;
  amountRaised: number;
  milestones: Milestone[];
  status: "active" | "completed";
  fundsReleased?: number;
  percentComplete?: number;
}

export function createFundingGoal({ title, amountNeeded }: { title: string; amountNeeded: number }): FundingGoal {
  return {
    title,
    amountNeeded,
    amountRaised: 0,
    milestones: DEFAULT_MILESTONES.map((m) => ({ ...m, completed: false })),
    status: "active",
  };
}

export function completeMilestone(goal: FundingGoal, milestoneId: string): FundingGoal {
  const milestone = goal.milestones.find((m) => m.id === milestoneId);
  if (!milestone || milestone.completed) return goal;

  milestone.completed = true;
  const releaseAmount = Math.round((milestone.releasePercent / 100) * goal.amountRaised);

  return {
    ...goal,
    fundsReleased: (goal.fundsReleased || 0) + releaseAmount,
    percentComplete: Math.round(
      (goal.milestones.filter((m) => m.completed).length / goal.milestones.length) * 100
    ),
    status: goal.milestones.every((m) => m.completed) ? "completed" : "active",
  };
}
