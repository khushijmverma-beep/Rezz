import { SKILLS, type SkillTerm } from "./skillsDictionary";

const SENTENCE_END = /(?<!\b(?:e\.g|i\.e|etc|vs|Sr|Jr|U\.S)\.)(?<=[.!?])\s+/i;
const BULLET = /^[-•*]\s*/;


function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
}

function buildRegex(term: SkillTerm): RegExp {
  const variants = [term.name, ...(term.aliases ?? [])].map(escapeRegex);
  return new RegExp(
    `(?<![A-Za-z0-9])(?:${variants.join("|")})(?![A-Za-z0-9])`,
    term.caseSensitive ? "" : "i",
  );
}

const longest = (t: SkillTerm) =>
  Math.max(...[t.name, ...(t.aliases ?? [])].map((v) => v.length));

const COMPILED = SKILLS.map((term, order) => ({ term, order }))
  .sort((a, b) => longest(b.term) - longest(a.term))
  .map(({ term, order }) => {
    const regex = buildRegex(term);
    return {
      name: term.name,
      order,
      regex,
      all: new RegExp(regex.source, regex.flags + "g"),
    };
  });

export function normalize(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

export function splitSentences(text: string): string[] {
  const lines = text.split(/\r?\n/);
  const cleaned = lines.map((line) => normalize(line).replace(BULLET, ""));
  const nonEmpty = cleaned.filter((line) => line.length > 0);
  const sentences = nonEmpty.flatMap((line => line.split(SENTENCE_END)));
  return sentences;
}

export type KeywordComparison = {
  matched: string[];
  missing: string[];
};

export function compareKeywords(
  resumeText: string,
  jobDescription: string,
): KeywordComparison {
  const resume = normalize(resumeText);
  const jd = normalize(jobDescription);

  const matched: string[] = [];
  const missing: string[] = [];

  let jdLeft = jd;

  for (const { name, regex, all } of COMPILED) {
    if (!regex.test(jdLeft)) continue;
    jdLeft = jdLeft.replace(all, " ");
    if (regex.test(resume)) {
      matched.push(name);
    } else {
      missing.push(name);
    }
  }

  const byOrder = (a: string, b: string) =>
    COMPILED.find((c) => c.name === a)!.order -
    COMPILED.find((c) => c.name === b)!.order;
  return { matched: matched.sort(byOrder), missing: missing.sort(byOrder) };
}


export type Evidence = { phrase: string; section: "required" | "preferred" | null };

export function findEvidence(skillName: string, text: string): Evidence {
  const result: Evidence = { phrase: "", section: null };
  const entry = COMPILED.find((c) => c.name === skillName);
  if (!entry) return result;

  let section: "required" | "preferred" | null = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = normalize(raw).replace(BULLET, "");
    if (!line) continue;

    if (line.length < 60 && line.endsWith(":")) {
      if (/required|minimum|must|basic/i.test(line)) section = "required";
      else if (/preferred|nice to have|bonus|plus/i.test(line)) section = "preferred";
      else section = null;
      continue;
    }

    if (!entry.regex.test(line)) continue;
    if (!result.phrase) result.phrase = line;
    if (section) {
      result.section = section;
      break;
    }
  }
  return result;
}