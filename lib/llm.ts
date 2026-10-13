import { callGemini, GeminiError } from "./gemini";

const TOTAL_BUDGET_MS = 20_000;
const BACKOFFS_MS = [1000, 2000, 4000];
const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";

// Current general-purpose instruction model from GET /openai/v1/models.
// Override with GROQ_MODEL. JSON object mode is supported on this model.
export const DEFAULT_GROQ_MODEL = "openai/gpt-oss-20b";

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function remainingMs(deadline: number): number {
    return Math.max(0, deadline - Date.now());
}

function providerOrder(): string[] {
    const raw = process.env.AI_PROVIDER?.trim() || "groq,gemini";
    const providers = raw
        .split(",")
        .map((provider) => provider.trim().toLowerCase())
        .filter(Boolean);
    return providers.length > 0 ? providers : ["groq", "gemini"];
}

const PROVIDER_ENV_KEYS: Record<string, string> = {
    groq: "GROQ_API_KEY",
    gemini: "GEMINI_API_KEY",
};

export function hasConfiguredAIProvider(): boolean {
    return providerOrder().some((provider) => {
        const envKey = PROVIDER_ENV_KEYS[provider];
        return Boolean(envKey && process.env[envKey]);
    });
}

function groqModel(): string {
    const configured = process.env.GROQ_MODEL?.trim();
    return configured || DEFAULT_GROQ_MODEL;
}

function logNonOk(provider: string, model: string, status: number): void {
    console.error(`LLM non-OK response provider=${provider} model=${model} status=${status}`);
}

async function callGroq(prompt: string, deadline: number): Promise<string> {
    const model = groqModel();
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        logNonOk("groq", model, 500);
        throw new GeminiError(500, "Server is missing GROQ_API_KEY", true);
    }

    const requestInit: RequestInit = {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model,
            messages: [{ role: "user", content: prompt }],
            temperature: 0,
            response_format: { type: "json_object" },
        }),
    };

    let lastStatus: number | undefined;

    for (let attempt = 0; attempt <= BACKOFFS_MS.length; attempt++) {
        const budget = remainingMs(deadline);
        if (budget <= 0) {
            const status = lastStatus ?? 503;
            logNonOk("groq", model, status);
            throw new GeminiError(status, "Gemini timed out", status === 429 || status === 503);
        }

        let res: Response;
        try {
            res = await fetch(GROQ_CHAT_URL, {
                ...requestInit,
                signal: AbortSignal.timeout(budget),
            });
        } catch {
            console.error(`LLM network error provider=groq model=${model}`);
            if (remainingMs(deadline) <= 0) {
                const status = lastStatus ?? 503;
                throw new GeminiError(status, "Gemini timed out", status === 429 || status === 503);
            }
            throw new GeminiError(502, "Could not reach Gemini", true);
        }

        let data: any;
        try {
            data = await res.json();
        } catch {
            logNonOk("groq", model, res.status);
            throw new GeminiError(502, "Gemini returned a non-JSON response");
        }

        lastStatus = res.status;
        const temporary = res.status === 503 || res.status === 429;
        if (temporary && attempt < BACKOFFS_MS.length) {
            logNonOk("groq", model, res.status);
            const wait = Math.min(BACKOFFS_MS[attempt] ?? 0, remainingMs(deadline));
            if (wait <= 0) {
                throw new GeminiError(res.status, "Gemini timed out", true);
            }
            await sleep(wait);
            continue;
        }

        if (!res.ok) {
            logNonOk("groq", model, res.status);
            throw new GeminiError(
                res.status,
                "Gemini call failed",
                res.status === 429 || res.status === 503
            );
        }

        const text = data?.choices?.[0]?.message?.content;
        if (typeof text !== "string") {
            logNonOk("groq", model, 502);
            throw new GeminiError(502, "Gemini returned no text");
        }

        console.log(`callLLM answered by provider=groq model=${model}`);
        return text;
    }

    const status = lastStatus ?? 503;
    logNonOk("groq", model, status);
    throw new GeminiError(status, "Gemini timed out", status === 429 || status === 503);
}

export async function callLLM(prompt: string): Promise<string> {
    const deadline = Date.now() + TOTAL_BUDGET_MS;
    const providers = providerOrder();
    let lastError: GeminiError | null = null;

    for (let index = 0; index < providers.length; index++) {
        const provider = providers[index];
        const hasNext = index < providers.length - 1;

        try {
            if (provider === "groq") {
                return await callGroq(prompt, deadline);
            }
            if (provider === "gemini") {
                const text = await callGemini(prompt, deadline);
                console.log("callLLM answered by provider=gemini");
                return text;
            }
            logNonOk(provider, "unknown", 500);
            lastError = new GeminiError(500, "Gemini call failed", true);
        } catch (err) {
            if (err instanceof GeminiError && err.fallback) {
                lastError = err;
            } else if (err instanceof Error && err.message === "Server is missing GEMINI_API_KEY") {
                logNonOk("gemini", "gemini", 500);
                lastError = new GeminiError(500, err.message, true);
            } else {
                throw err;
            }
        }

        if (!hasNext || remainingMs(deadline) <= 0) {
            break;
        }
        console.error(
            `LLM provider=${provider} failed status=${lastError?.status ?? "unknown"}; trying next provider`
        );
    }

    if (lastError) {
        throw lastError;
    }
    throw new GeminiError(500, "Gemini call failed");
}
