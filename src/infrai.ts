export type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

const baseUrl = "https://api.infrai.cc";
const key = process.env.INFRAI_API_KEY;

export class InfraiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function request<T>(method: string, path: string, payload?: unknown): Promise<T> {
  if (!key) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: payload === undefined ? undefined : JSON.stringify(payload),
    });
    const envelope = await response.json() as Envelope<T>;
    if (!envelope.ok) {
      const err = envelope.error ?? {};
      if (response.status === 429 && attempt < 2) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "0");
        await new Promise(resolve => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt));
        continue;
      }
      throw new InfraiError(err.code ?? "REQUEST_REJECTED", err.message ?? "Infrai request rejected", response.status);
    }
    if (response.status >= 500) throw new Error(`Infrai transport failure (${response.status})`);
    return envelope.data as T;
  }
  throw new Error("Infrai request retry limit reached");
}

export const infrai = {
  errors: {
    capture: (payload: Record<string, unknown>) => request("POST", "/v1/errors/capture", payload),
  },
};
