import { NextResponse } from "next/server";
import { extractResumeFields, MOCK_RESUME_FIELDS } from "@/lib/ai/extractResumeFields";
import { GeminiError } from "@/lib/gemini";

const MAX_CHARS = 8000;
const NOT_RESUME_MESSAGE = "Please try again with more specific info";

export async function POST(req: Request) {
    // 1. Parse the body
    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Request body must be JSON" }, { status: 400 });
    }

    // 2. Validate text
    const text = (body as { text?: unknown })?.text;
    if (typeof text !== "string" || text.trim() === "") {
        return NextResponse.json({ error: "Please enter some text." }, { status: 400 });
    }
    if (text.length > MAX_CHARS) {
        return NextResponse.json(
            { error: `Text must be ${MAX_CHARS} characters or fewer.` },
            { status: 400 }
        );
    }

    // Mock mode: no Gemini, no key needed
    if (process.env.AI_MOCK === "true") {
        return NextResponse.json({ fields: MOCK_RESUME_FIELDS });
    }

    // Real mode needs the key
    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({ error: "Server is missing GEMINI_API_KEY" }, { status: 500 });
    }

    // Run the sorter
    try {
        const fields = await extractResumeFields(text);
        if (!fields) {
            return NextResponse.json({ error: NOT_RESUME_MESSAGE }, { status: 422 });
        }
        return NextResponse.json({ fields });
    } catch (err) {
        if (err instanceof GeminiError) {
            if (err.status === 503) {
                return NextResponse.json({ error: "AI is busy, try again soon" }, { status: 503 });
            }
            if (err.status === 429) {
                return NextResponse.json({ error: "AI quota reached, try again later" }, { status: 429 });
            }
            return NextResponse.json({ error: "AI returned an invalid response" }, { status: 502 });
        }
        console.error(err);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}