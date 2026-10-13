import type { ResumeData } from "@/lib/types/resume";

const contactFields = [
  ["email", "Email"],
  ["phone", "Phone"],
  ["location", "Location"],
  ["linkedin", "LinkedIn"],
] as const;

const sectionOrder = ["experience", "education", "skills"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function labelFor(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function valueToLines(value: unknown, splitCommas = false): string[] {
  if (typeof value === "string") {
    const lines = value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    return splitCommas
      ? lines.flatMap((line) => line.split(",").map((part) => part.trim()).filter(Boolean))
      : lines;
  }

  if (typeof value === "number") {
    return [String(value)];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => valueToLines(item));
  }

  if (isRecord(value)) {
    return Object.entries(value).flatMap(([key, item]) => {
      const lines = valueToLines(item);
      return lines.map((line) => `${labelFor(key)}: ${line}`);
    });
  }

  return [];
}

export function resumeToText(data: ResumeData): string {
  const lines: string[] = [];
  const name = valueToLines(data.name)[0];

  if (name) {
    lines.push(name);
  }

  for (const [field, label] of contactFields) {
    const value = valueToLines(data[field]).join(", ");
    if (value) {
      lines.push(`${label}: ${value}`);
    }
  }

  const sectionKeys = Object.keys(data).filter(
    (key) =>
      key !== "name" &&
      !contactFields.some(([field]) => field === key) &&
      data[key] !== undefined &&
      data[key] !== null,
  );

  sectionKeys.sort((left, right) => {
    const leftIndex = sectionOrder.indexOf(left.toLowerCase());
    const rightIndex = sectionOrder.indexOf(right.toLowerCase());
    return (leftIndex < 0 ? sectionOrder.length : leftIndex) -
      (rightIndex < 0 ? sectionOrder.length : rightIndex);
  });

  for (const key of sectionKeys) {
    const bullets = valueToLines(data[key], key.toLowerCase() === "skills");
    if (bullets.length === 0) {
      continue;
    }

    lines.push("", labelFor(key), ...bullets.map((bullet) => `- ${bullet}`));
  }

  return lines.join("\n");
}