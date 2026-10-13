import { callGemini, GeminiError } from "./gemini";

const TOTAL_BUDGET_MS = 20_000;
const BACKOFFS_MS = [1000, 2000, 4000];
const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MAX_OUTPUT_TOKENS = 8192;
const PROVIDER_FAILURE_MESSAGE = "The AI service had a problem. Please try again.";

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

function errorDetails(body: unknown): { code: string; message: string } {
    const record =
        body && typeof body === "object" && body !== null && "error" in body
            ? (body as { error?: unknown }).error
            : undefined;
    const error =
        record && typeof record === "object" && record !== null
            ? (record as Record<string, unknown>)
            : {};
    const code = typeof error.code === "string" ? error.code : "";
    const message = typeof error.message === "string" ? error.message.slice(0, 300) : "";
    return { code, message };
}

function logNonOk(provider: string, model: string, status: number, body?: unknown): void {
    const { code, message } = errorDetails(body);
    console.error(
        `LLM non-OK response provider=${provider} model=${model} status=${status} code=${code} message=${message}`
    );
}

type GroqPostResult =
    | { kind: "success"; text: string }
    | { kind: "http"; status: number }
    | { kind: "network" }
    | { kind: "timeout"; status: number };

async function postGroq(
    prompt: string,
    model: string,
    apiKey: string,
    deadline: number,
    jsonMode: boolean
): Promise<GroqPostResult> {
    const budget = remainingMs(deadline);
    if (budget <= 0) {
        return { kind: "timeout", status: 503 };
    }

    const payload: Record<string, unknown> = {
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
        max_completion_tokens: GROQ_MAX_OUTPUT_TOKENS,
        reasoning_effort: "low",
    };
    if (jsonMode) {
        payload.response_format = { type: "json_object" };
    }

    let res: Response;
    try {
        res = await fetch(GROQ_CHAT_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(budget),
        });
    } catch {
        console.error(`LLM network error provider=groq model=${model}`);
        if (remainingMs(deadline) <= 0) {
            return { kind: "timeout", status: 503 };
        }
        return { kind: "network" };
    }

    let data: unknown;
    try {
        data = await res.json();
    } catch {
        logNonOk("groq", model, res.status);
        return { kind: "http", status: res.status || 502 };
    }

    if (!res.ok) {
        logNonOk("groq", model, res.status, data);
        return { kind: "http", status: res.status };
    }

    const text = (data as { choices?: Array<{ message?: { content?: unknown } }> })?.choices?.[0]
        ?.message?.content;
    if (typeof text !== "string") {
        logNonOk("groq", model, 502, data);
        return { kind: "http", status: 502 };
    }

    console.log(`callLLM answered by provider=groq model=${model}`);
    return { kind: "success", text };
}

function groqFailure(status: number, message: string): GeminiError {
    return new GeminiError(status, message, true);
}

async function callGroq(prompt: string, deadline: number): Promise<string> {
    const model = groqModel();
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        logNonOk("groq", model, 500);
        throw groqFailure(500, "Server is missing GROQ_API_KEY");
    }

    let lastStatus = 502;

    for (let attempt = 0; attempt <= BACKOFFS_MS.length; attempt++) {
        const outcome = await postGroq(prompt, model, apiKey, deadline, true);
        if (outcome.kind === "success") return outcome.text;
        if (outcome.kind === "network") {
            throw groqFailure(502, "Could not reach Gemini");
        }
        if (outcome.kind === "timeout") {
            throw groqFailure(outcome.status, "Gemini timed out");
        }

        lastStatus = outcome.status;
        const temporary = outcome.status === 429 || outcome.status === 503;
        if (temporary && attempt < BACKOFFS_MS.length) {
            const wait = Math.min(BACKOFFS_MS[attempt] ?? 0, remainingMs(deadline));
            if (wait <= 0) throw groqFailure(outcome.status, "Gemini timed out");
            await sleep(wait);
            continue;
        }

        if (outcome.status === 400 && remainingMs(deadline) > 0) {
            const retry = await postGroq(prompt, model, apiKey, deadline, false);
            if (retry.kind === "success") return retry.text;
            if (retry.kind === "network") throw groqFailure(502, "Could not reach Gemini");
            if (retry.kind === "timeout") throw groqFailure(retry.status, "Gemini timed out");
            throw groqFailure(retry.status, PROVIDER_FAILURE_MESSAGE);
        }

        throw groqFailure(outcome.status, PROVIDER_FAILURE_MESSAGE);
    }

    throw groqFailure(lastStatus, PROVIDER_FAILURE_MESSAGE);
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
            if (err instanceof GeminiError) {
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
        const status = lastError.status;
        const message =
            status === 429 || status === 503 ? lastError.message : PROVIDER_FAILURE_MESSAGE;
        throw new GeminiError(status, message);
    }
    throw new GeminiError(500, PROVIDER_FAILURE_MESSAGE);
}
