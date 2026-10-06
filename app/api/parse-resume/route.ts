import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL = "gemini-3.5-flash-lite"; 

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.type !== "application/pdf") {
      return NextResponse.json({ error: "Please upload a PDF." }, { status: 400 });
    }

    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        { inlineData: { mimeType: "application/pdf", data: base64 } },
        {
          text:
            "Extract info from this resume. Return JSON with exactly these string fields: " +
            '"name", "email", "phone", "location", "linkedin" (URL), ' +
            '"experience" (each job as: Title at Company, dates, then a short summary; separate jobs with a blank line), ' +
            '"education" (each entry as: Degree, School, dates; one per line), ' +
            '"skills" (comma-separated). ' +
            "If something is not on the resume, use an empty string. Do not invent anything.",
        },
      ],
      config: { responseMimeType: "application/json" },
    });

    const parsed = JSON.parse(response.text ?? "{}");

    return NextResponse.json({
        name: parsed.name ?? "",
        email: parsed.email ?? "",
        phone: parsed.phone ?? "",
        location: parsed.location ?? "",
        linkedin: parsed.linkedin ?? "",
        experience: parsed.experience ?? "",
        education: parsed.education ?? "",
        skills: parsed.skills ?? "",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to parse resume." }, { status: 500 });
  }
}

