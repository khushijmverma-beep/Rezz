import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { extractResumeFields, MOCK_RESUME_FIELDS } from "@/lib/ai/extractResumeFields";
import { GeminiError } from "@/lib/gemini";

export const runtime = "nodejs";

// set max limit
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const NOT_RESUME_MESSAGE = "Please try again with more specific info";

// check what file is being passed
function getFileKind(file: File): "pdf" | "txt" | null {
    const name = file.name.toLowerCase();
    if (file.type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
    if (file.type === "text/plain" || name.endsWith(".txt")) return "txt";
    return null;
}

// read pdf file
async function readPdfText(file: File): Promise<string> {
    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new PDFParse({ data: buffer });
    try {
        const result = await parser.getText();
        return result.text;
    } finally {
        await parser.destroy();
    }
}


export async function POST(req: Request) {
    // read the form data
    let formData: FormData;
    try {
        formData = await req.formData();
    } catch {
        return NextResponse.json({ error: "Request body must be form data" }, { status: 400 });
    }

    // validate the file
    const file = formData.get("file");
    if (!(file instanceof File)) {
        return NextResponse.json({ error: "Please upload a file." }, { status: 400 });
    }

    const kind = getFileKind(file);
    if (!kind) {
        return NextResponse.json({ error: "Please upload a PDF or .txt file." }, { status: 400 });
    }

    if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json({ error: "File must be 5 MB or smaller." }, { status: 400 });
    }

    // Mock mode: no Gemini
    if (process.env.AI_MOCK === "true") {
        return NextResponse.json({ fields: MOCK_RESUME_FIELDS });
    }

    // Real mode needs the key
    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({ error: "Server is missing GEMINI_API_KEY" }, { status: 500 });
    }

    // Turn the file into text
    let text: string;
    try {
        text = kind === "pdf" ? await readPdfText(file) : await file.text();
    } catch (err) {
        console.error("Could not read uploaded file:", err);
        return NextResponse.json({ error: "Could not read that file." }, { status: 400 });
    }

    // Scanned PDFs (images only) have no text to extract
    if (text.trim() === "") {
        return NextResponse.json({ error: NOT_RESUME_MESSAGE }, { status: 422 });
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