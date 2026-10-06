import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";

export const runtime = "nodejs";

export async function POST(request: Request) {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
        return NextResponse.json({ error: "No file uploaded. "}, {status: 400})

    }

    if (file.type !== "application/pdf") {
        return NextResponse.json({ error: "File must be a PDF. "}, {status: 400})
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new PDFParse({ data: buffer }); 

    try {
        const result = await parser.getText();
        return NextResponse.json({ text: result.text, pages: result.total });

    } catch (err) {
        console.error("PDF parse error:", err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Could not read this PDF." },
            { status: 500 }
  );
    } finally {
        await parser.destroy();
    }


}