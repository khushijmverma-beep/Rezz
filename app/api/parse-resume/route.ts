import { NextResponse } from "next/server";

const MODEL = "gemini-3.5-flash-lite";
const MAX_PDF_BYTES = 5 * 1024 * 1024;
const BACKOFFS_MS = [1000, 2000, 4000];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function logGeminiNonOkResponse(model: string, status: number, body: unknown): void {
  console.error(`Gemini non-OK response from ${model} (status ${status}):`, body);
}

function stripCodeFences(text: string): string {
  return text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
}

function parseResumeJson(text: string): Record<string, unknown> | null {
  const candidates = [text.trim(), stripCodeFences(text)];
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    candidates.push(objectMatch[0]);
  }

  for (const candidate of candidates) {
    try {
      const parsed: unknown = JSON.parse(candidate);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      continue;
    }
  }

  return null;
}

type GeminiCallResult =
  | { kind: "success"; data: any }
  | { kind: "http_error"; status: number; data: any }
  | { kind: "unreachable" }
  | { kind: "invalid_response"; status: number };

async function callGeminiWithRetries(
  apiKey: string,
  base64: string,
  prompt: string
): Promise<GeminiCallResult> {
  const requestInit: RequestInit = {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { inlineData: { mimeType: "application/pdf", data: base64 } },
            { text: prompt },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    }),
  };

  for (let attempt = 0; attempt <= BACKOFFS_MS.length; attempt++) {
    let res: Response;
    try {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
        requestInit
      );
    } catch (err) {
      console.error(err);
      return { kind: "unreachable" };
    }

    let data: any;
    try {
      data = await res.json();
    } catch {
      console.error("Gemini returned a non-JSON response, status:", res.status);
      return { kind: "invalid_response", status: res.status };
    }

    const temporary = res.status === 503 || res.status === 429;
    if (temporary && attempt < BACKOFFS_MS.length) {
      logGeminiNonOkResponse(MODEL, res.status, data);
      await sleep(BACKOFFS_MS[attempt]!);
      continue;
    }

    if (!res.ok) {
      logGeminiNonOkResponse(MODEL, res.status, data);
      return { kind: "http_error", status: res.status, data };
    }

    return { kind: "success", data };
  }

  return { kind: "unreachable" };
}

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Server is missing GEMINI_API_KEY" }, { status: 500 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Request body must be form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.type !== "application/pdf") {
    return NextResponse.json({ error: "Please upload a PDF." }, { status: 400 });
  }

  if (file.size > MAX_PDF_BYTES) {
    return NextResponse.json(
      { error: "PDF must be 5 MB or smaller." },
      { status: 400 }
    );
  }

  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  const prompt =
    "Extract info from this resume. Return JSON with exactly these string fields: " +
    '"name", "email", "phone", "location", "linkedin" (URL), ' +
    '"experience" (each job as: Title at Company, dates, then a short summary; separate jobs with a blank line), ' +
    '"education" (each entry as: Degree, School, dates; one per line), ' +
    '"skills" (comma-separated). ' +
    "If something is not on the resume, use an empty string. Do not invent anything.";

  const outcome = await callGeminiWithRetries(apiKey, base64, prompt);

  if (outcome.kind === "unreachable") {
    return NextResponse.json({ error: "Could not reach gemini" }, { status: 502 });
  }

  if (outcome.kind === "invalid_response") {
    return NextResponse.json(
      { error: "Gemini returned an invalid response" },
      { status: 502 }
    );
  }

  if (outcome.kind === "http_error") {
    return NextResponse.json(
      { error: "Gemini call failed" },
      { status: outcome.status }
    );
  }

  const text = outcome.data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string") {
    console.error(outcome.data);
    return NextResponse.json({ error: "Gemini returned no text" }, { status: 502 });
  }

  const parsed = parseResumeJson(text);
  if (!parsed) {
    console.error(text);
    return NextResponse.json(
      { error: "Gemini did not return valid JSON" },
      { status: 502 }
    );
  }

  const asString = (value: unknown) => (typeof value === "string" ? value : "");

  return NextResponse.json({
    name: asString(parsed.name),
    email: asString(parsed.email),
    phone: asString(parsed.phone),
    location: asString(parsed.location),
    linkedin: asString(parsed.linkedin),
    experience: asString(parsed.experience),
    education: asString(parsed.education),
    skills: asString(parsed.skills),
  });
}
