import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODELS = [ "gemini-3.5-flash-lite"];

async function generateWithRetry(params: Omit<Parameters<typeof ai.models.generateContent>[0], "model">) {
  let lastErr: unknown;

  for (const model of MODELS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await ai.models.generateContent({ ...params, model });
      } catch (err) {
        lastErr = err;
        const status = (err as { status?: number }).status;
        if (status === 404) break;
        if (status !== 503 && status !== 429) throw err;
        await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
      }
    }
  }
  throw lastErr;
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

// keep only the expected keys, as strings, and drop empty items
const list = (v: unknown, keys: string[]) =>
  Array.isArray(v)
    ? v
        .map((it) => Object.fromEntries(keys.map((k) => [k, str((it as Record<string, unknown>)?.[k])])))
        .filter((it) => Object.values(it).some(Boolean))
    : [];

const PROMPT = `Extract info from this resume. Return JSON with exactly this shape:
{
  "name": "", "email": "", "phone": "", "location": "", "linkedin": "",
  "about": "short summary of the person, from the resume's summary section if it has one",
  "experience": [{ "title": "", "company": "", "dates": "", "description": "" }],
  "education": [{ "school": "", "degree": "", "dates": "" }],
  "skills": ["skill1", "skill2"],
  "projects": [{ "name": "", "link": "", "description": "" }],
  "awards": [{ "title": "", "issuer": "", "date": "" }]
}
Use "" or [] for anything not on the resume. Do not invent anything.`;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.type !== "application/pdf") {
      return NextResponse.json({ error: "Please upload a PDF." }, { status: 400 });
    }

    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

    const response = await generateWithRetry({
      contents: [
        { inlineData: { mimeType: "application/pdf", data: base64 } },
        { text: PROMPT },
      ],
      config: { responseMimeType: "application/json" },
    });

    const p = JSON.parse(response.text ?? "{}");

    return NextResponse.json({
      name: str(p.name),
      email: str(p.email),
      phone: str(p.phone),
      location: str(p.location),
      linkedin: str(p.linkedin),
      about: str(p.about),
      experience: list(p.experience, ["title", "company", "dates", "description"]),
      education: list(p.education, ["school", "degree", "dates"]),
      skills: Array.isArray(p.skills) ? p.skills.map(str).filter(Boolean) : [],
      projects: list(p.projects, ["name", "link", "description"]),
      awards: list(p.awards, ["title", "issuer", "date"]),
    });
  } catch (err) {
    console.error(err);
    const status = (err as { status?: number }).status;
    const busy = status === 503 || status === 429;
    return NextResponse.json(
      { error: busy ? "The AI service is busy right now. Please try again in a minute." : "Failed to parse resume." },
      { status: busy ? 503 : 500 }
    );
  }
}