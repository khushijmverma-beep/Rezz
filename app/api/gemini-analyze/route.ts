import { SAMPLE_RESUME } from "./sample-resume";

type GrammarIssue = { text: string; suggestion: string };
type Gap = { description: string };
type Redundancy = { text: string; reason: string };

type ResumeAnalysis = {
    grammarIssues: GrammarIssue[];
    gaps: Gap[];
    redundancies: Redundancy[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function isGrammarIssue(value: unknown): value is GrammarIssue {
    return (
        isRecord(value) &&
        typeof value.text === "string" &&
        typeof value.suggestion === "string"
    );
}

function isGap(value: unknown): value is Gap {
    return isRecord(value) && typeof value.description === "string";
}

function isRedundancy(value: unknown): value is Redundancy {
    return (
        isRecord(value) &&
        typeof value.text === "string" &&
        typeof value.reason === "string"
    );
}

function isResumeAnalysis(value: unknown): value is ResumeAnalysis {
    return (
        isRecord(value) &&
        Array.isArray(value.grammarIssues) &&
        value.grammarIssues.every(isGrammarIssue) &&
        Array.isArray(value.gaps) &&
        value.gaps.every(isGap) &&
        Array.isArray(value.redundancies) &&
        value.redundancies.every(isRedundancy)
    );
}

function parseResumeAnalysis(text: string): ResumeAnalysis | null {
    const candidates = [
        text.trim(),
        text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""),
    ];
    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) {
        candidates.push(objectMatch[0]);
    }

    for (const candidate of candidates) {
        try {
            const parsed: unknown = JSON.parse(candidate);
            if (isResumeAnalysis(parsed)) {
                return parsed;
            }
        } catch {
            continue;
        }
    }

    return null;
}

export async function GET() {
    const prompt = `Analyze the resume below. Return ONLY valid JSON, with no prose and no markdown code fences. Use exactly this shape:
{
  "grammarIssues": [{ "text": string, "suggestion": string }],
  "gaps": [{ "description": string }],
  "redundancies": [{ "text": string, "reason": string }]
}

grammarIssues lists grammar or phrasing problems and a suggested rewrite.
gaps lists missing or underdeveloped information.
redundancies lists repeated content and why it overlaps.
Use empty arrays when a category has no findings.

Resume:
${SAMPLE_RESUME}`;

    const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
        {
            method: "POST",
            headers: {
                "x-goog-api-key": process.env.GEMINI_API_KEY!,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
            }),
        }
    );

    const data = await res.json();
    if (!res.ok) {
        console.error(data);
        return Response.json(
            { error: "Gemini call failed", details: data },
            { status: res.status }
        );
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string") {
        console.error(data);
        return Response.json(
            { error: "Gemini did not return valid JSON", details: data },
            { status: 502 }
        );
    }

    const analysis = parseResumeAnalysis(text);
    if (!analysis) {
        console.error(text);
        return Response.json(
            { error: "Gemini did not return valid JSON", details: text },
            { status: 502 }
        );
    }

    return Response.json(analysis);
}
