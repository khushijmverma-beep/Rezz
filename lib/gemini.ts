const PRIMARY_GEMINI_MODEL = "gemini-3.6-flash";
const FALLBACK_GEMINI_MODEL = "gemini-3.5-flash";
const TOTAL_BUDGET_MS = 20_000;
const FALLBACK_RESERVE_MS = 7_000;
const BACKOFFS_MS = [1000, 2000, 4000];

export class GeminiError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.name = "GeminiError";
        this.status = status;
    }
}


function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function remainingMs(deadline: number): number {
    return Math.max(0, deadline - Date.now());
}

function logGeminiNonOkResponse(model: string, status: number, body: unknown): void {
    console.error(`Gemini non-OK response from ${model} (status ${status}):`, body);
}

type GeminiAttemptResult =
    | { kind: "success"; model: string; data: any }
    | { kind: "http_error"; model: string; status: number; data: any }
    | { kind: "unreachable" }
    | { kind: "invalid_response"; status: number }
    | { kind: "budget_exhausted"; model: string; status?: number; data?: any };

async function callGeminiWithRetries(
    model: string,
    apiKey: string,
    prompt: string,
    deadline: number,
    maxRetries: number
): Promise<GeminiAttemptResult> {
    const requestInit: RequestInit = {
        method: "POST",
        headers: {
            "x-goog-api-key": apiKey,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0,
            },
        }),
    };

    let lastStatus: number | undefined;
    let lastData: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const budget = remainingMs(deadline);
        if (budget <= 0) {
            return { kind: "budget_exhausted", model, status: lastStatus, data: lastData };
        }

        let res: Response;
        try {
            res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
                { ...requestInit, signal: AbortSignal.timeout(budget) }
            );
        } catch (err) {
            console.error(err);
            if (remainingMs(deadline) <= 0) {
                return { kind: "budget_exhausted", model, status: lastStatus, data: lastData };
            }
            return { kind: "unreachable" };
        }

        let data: any;
        try {
            data = await res.json();
        } catch {
            console.error("Gemini returned a non-JSON response, status:", res.status);
            return { kind: "invalid_response", status: res.status };
        }

        lastStatus = res.status;
        lastData = data;

        const temporary = res.status === 503 || res.status === 429;
        if (temporary && attempt < maxRetries) {
            logGeminiNonOkResponse(model, res.status, data);
            const wait = Math.min(BACKOFFS_MS[attempt] ?? 0, remainingMs(deadline));
            if (wait <= 0) {
                return { kind: "budget_exhausted", model, status: res.status, data };
            }
            await sleep(wait);
            continue;
        }

        if (!res.ok) {
            logGeminiNonOkResponse(model, res.status, data);
            return { kind: "http_error", model, status: res.status, data };
        }

        return { kind: "success", model, data };
    }

    return { kind: "budget_exhausted", model, status: lastStatus, data: lastData };
}


export async function callGemini(prompt: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("Server is missing GEMINI_API_KEY");
    }

    const deadline = Date.now() + TOTAL_BUDGET_MS;
    const primaryDeadline = Date.now() + (TOTAL_BUDGET_MS - FALLBACK_RESERVE_MS);

    let outcome = await callGeminiWithRetries(
        PRIMARY_GEMINI_MODEL,
        apiKey,
        prompt,
        primaryDeadline,
        BACKOFFS_MS.length
    );

    const primaryUnavailable =
        (outcome.kind === "http_error" || outcome.kind === "budget_exhausted") &&
        (outcome.status === 503 || outcome.status === 429);

    if (primaryUnavailable && remainingMs(deadline) > 0) {
        console.error(
            `Primary model ${PRIMARY_GEMINI_MODEL} unavailable; trying fallback ${FALLBACK_GEMINI_MODEL}`
        );
        outcome = await callGeminiWithRetries(FALLBACK_GEMINI_MODEL, apiKey, prompt, deadline, 0);
    }

    switch (outcome.kind) {
        case "unreachable":
            throw new GeminiError(502, "Could not reach Gemini");
        case "invalid_response":
            throw new GeminiError(502, "Gemini returned a non-JSON response");
        case "budget_exhausted":
            console.error(`Gemini budget exhausted on ${outcome.model}, last status:`, outcome.status);
            throw new GeminiError(outcome.status ?? 503, "Gemini timed out");
        case "http_error":
            throw new GeminiError(outcome.status, "Gemini call failed");
    }

    console.log(`Gemini answered by model: ${outcome.model}`);

    const text = outcome.data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string") {
        console.error(outcome.data);
        throw new GeminiError(502, "Gemini returned no text");
    }

    return text;
}