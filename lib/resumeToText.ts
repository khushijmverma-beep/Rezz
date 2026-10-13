import type { ResumeData } from "@/lib/types/resume";

function linesFor(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function pushSection(lines: string[], title: string, bullets: string[]) {
  if (bullets.length === 0) return;
  lines.push("", title, ...bullets.map((bullet) => `- ${bullet}`));
}

export function resumeToText(data: ResumeData): string {
  const lines: string[] = [];
  const name = [data.firstName, data.lastName].filter(Boolean).join(" ").trim();

  if (name) {
    lines.push(name);
  }

  const contact: Array<[string, string]> = [
    ["Email", data.email],
    ["Phone", data.phone],
    ["Location", data.location],
    ["LinkedIn", data.linkedin],
    ["GitHub", data.github],
    ["Website", data.website],
  ];

  for (const [label, value] of contact) {
    const text = value.trim();
    if (text) lines.push(`${label}: ${text}`);
  }

  pushSection(lines, "Summary", linesFor(data.summary));

  const experience = data.experience.flatMap((item) => {
    const heading = [item.title, item.company, item.location].filter(Boolean).join(", ");
    const dates = [item.startDate, item.endDate].filter(Boolean).join(" - ");
    return [
      ...linesFor(heading),
      ...linesFor(dates),
      ...item.bullets.flatMap((bullet) => linesFor(bullet)),
    ];
  });
  pushSection(lines, "Experience", experience);

  const education = data.education.flatMap((item) => {
    const degree = [item.degree, item.field].filter(Boolean).join(" in ");
    const dates = [item.startDate, item.endDate].filter(Boolean).join(" - ");
    return [
      ...linesFor(item.school),
      ...linesFor(degree),
      ...linesFor(dates),
      ...(item.gpa.trim() ? [`GPA: ${item.gpa.trim()}`] : []),
    ];
  });
  pushSection(lines, "Education", education);

  pushSection(
    lines,
    "Skills",
    data.skills.flatMap((skill) => linesFor(skill)),
  );

  const projects = data.projects.flatMap((item) => [
    ...linesFor([item.name, item.link].filter(Boolean).join(" ")),
    ...linesFor(item.description),
  ]);
  pushSection(lines, "Projects", projects);

  pushSection(
    lines,
    "Awards",
    data.awards.flatMap((award) => linesFor(award)),
  );

  return lines.join("\n");
}
