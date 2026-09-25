export async function GET() {
    const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
        {
            method: "POST",
            headers: {
                "x-goog-api-key": process.env.GEMINI_API_KEY!,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Reply with exactly: Hello world"}]}],
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
    return Response.json( {text });
}