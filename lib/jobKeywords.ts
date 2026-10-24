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

type Span = { name: string; start: number; end: number };

export function findSpans(text: string): Span[] {
  let left = text;
  const spans: Span[] = [];

  for (const { name, all } of COMPILED) {
    for (const m of left.matchAll(all)) {
      const start = m.index ?? 0;
      spans.push({ name, start, end: start + m[0].length });
    }
    left = left.replace(all, (m) => " ".repeat(m.length));
  }

  return spans.sort((a, b) => a.start - b.start);
}

type Connector = "or" | "comma" | "break";

function connector(between: string): Connector {
  if (/^\s*,?\s*(?:or|\/)\s*$/i.test(between)) return "or";
  if (/^\s*,\s*$/.test(between)) return "comma";
  return "break";
}

export function groupSentence(sentence: string): string[][] {
  const spans = findSpans(sentence);
  const groups: string[][] = [];
  let run: string[] = [];
  let hasOr = false;

  const flush = () => {
    const unique = [...new Set(run)];
    if (hasOr && unique.length > 1) groups.push(unique);
    else unique.forEach((name) => groups.push([name]));
    run = [];
    hasOr = false;
  };

  spans.forEach((span, i) => {
    if (i > 0) {
      const kind = connector(sentence.slice(spans[i - 1].end, span.start));
      if (kind === "break") flush();
      else if (kind === "or") hasOr = true;
    }
    run.push(span.name);
  });
  if (run.length > 0) flush();

  return groups;
}

export type Requirement = {
  skills: string[]; 
  label: string; 
  met: boolean;
  matchedSkill: string | null;
};

export type KeywordComparison = {
  requirements: Requirement[];
  matched: string[]; 
  missing: string[]; 
};

const BY_NAME = new Map(COMPILED.map((c) => [c.name, c]));
function labelFor(skills: string[]): string {
  if (skills.length === 1) return skills[0];
  if (skills.length === 2) return `${skills[0]} or ${skills[1]}`;
  return `${skills.slice(0, -1).join(", ")}, or ${skills[skills.length - 1]}`;
}

export function extractRequirements(jobDescription: string): string[][] {
  const seen = new Set<string>();
  const result: string[][] = [];
  for (const sentence of splitSentences(jobDescription)) {
    for (const group of groupSentence(sentence)) {
      const key = [...group].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(group);
    }
  }
  return result;
}

export function compareKeywords(
  resumeText: string,
  jobDescription: string,
): KeywordComparison {
  const resume = normalize(resumeText);

  const requirements: Requirement[] = extractRequirements(jobDescription).map(
    (skills) => {
      const matchedSkill =
        skills.find((s) => BY_NAME.get(s)!.regex.test(resume)) ?? null;
      return {
        skills,
        label: labelFor(skills),
        met: matchedSkill !== null,
        matchedSkill,
      };
    },
  );

  return {
    requirements,
    matched: [
      ...new Set(
        requirements.flatMap((r) => (r.matchedSkill ? [r.matchedSkill] : [])),
      ),
    ],
    missing: requirements.filter((r) => !r.met).map((r) => r.label),
  };
}


export function findSkills(text: string): string[] {
  return [...new Set(findSpans(normalize(text)).map((s) => s.name))];
}

export function hasSkill(text: string, skill: string): boolean {
  const entry = BY_NAME.get(skill);
  return !!entry && entry.regex.test(normalize(text));
}


export type Evidence = {
  phrase: string;
  section: "required" | "preferred" | null;
};

const REQUIRED_HEADER = /required|requirements|minimum|must|basic/i;
const PREFERRED_HEADER = /preferred|nice to have|bonus|plus/i;


function headerSection(line: string): Evidence["section"] | undefined {
  if (line.length >= 60 || findSpans(line).length > 0) return undefined;
  const preferred = PREFERRED_HEADER.test(line);
  const required = REQUIRED_HEADER.test(line);
  if (line.endsWith(":")) {
    return preferred ? "preferred" : required ? "required" : null;
  }
  if (/[.!?]$/.test(line)) return undefined;
  if (preferred) return "preferred";
  if (required) return "required";
  return undefined;
}


export function findEvidence(skills: string[], text: string): Evidence {
  const regexes = skills
    .map((s) => BY_NAME.get(s)?.regex)
    .filter((r): r is RegExp => r !== undefined);
  if (regexes.length === 0) return { phrase: "", section: null };

  let section: Evidence["section"] = null;
  let best: { phrase: string; section: Evidence["section"]; hits: number } | null = null;

  for (const raw of text.split(/\r?\n/)) {
    const line = normalize(raw).replace(BULLET, "");
    if (!line) continue;

    const header = headerSection(line);
    if (header !== undefined) {
      section = header;
      continue;
    }

    for (const sentence of splitSentences(line)) {
      const hits = regexes.filter((r) => r.test(sentence)).length;
      if (hits === 0) continue;
      const better =
        !best ||
        hits > best.hits ||
        (hits === best.hits && sentence.length < best.phrase.length);
      if (better) best = { phrase: sentence, section, hits };
    }
  }

  return best ? { phrase: best.phrase, section: best.section } : { phrase: "", section: null };
}