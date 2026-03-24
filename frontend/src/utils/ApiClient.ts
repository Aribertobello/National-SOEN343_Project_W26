/**
 * ApiClient — Singleton
 *
 * Ensures a single shared instance manages the base URL, auth headers,
 * and all outbound HTTP requests. Services never construct fetch calls
 * directly; they call ApiClient.getInstance() and use its methods.
 */
export class ApiClient {
  private static instance: ApiClient | null = null;
  private baseUrl: string;
  // Private constructor — only getInstance() can create the instance
  private constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient('http://localhost:8000');
    }
    return ApiClient.instance;
  } 

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    return headers;
  }

  private async throwHttpError(method: string, path: string, res: Response): Promise<never> {
    let serverMessage: string | null = null;

    try {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const payload = (await res.json()) as { error?: string; detail?: string; message?: string };
        serverMessage = payload.error || payload.detail || payload.message || null;
      } else {
        const text = await res.text();
        serverMessage = text.trim() || null;
      }
    } catch {
      serverMessage = null;
    }

    const fallback = `${method} ${path} failed with status ${res.status}`;
    throw new Error(serverMessage || fallback);
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: this.buildHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      await this.throwHttpError('GET', path, res);
    }
    return res.json() as Promise<T>;
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: this.buildHeaders(),
      credentials: 'include',
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      await this.throwHttpError('POST', path, res);
    }
    return res.json() as Promise<T>;
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: this.buildHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      await this.throwHttpError('PATCH', path, res);
    }
    return res.json() as Promise<T>;
  }
}