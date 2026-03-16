/**
 * ApiClient — Singleton
 *
 * Ensures a single shared instance manages the base URL, auth headers,
 * and all outbound HTTP requests. Services never construct fetch calls
 * directly; they call ApiClient.getInstance() and use its methods.
 */
export class ApiClient {
  private static instance: ApiClient | null = null;

  private readonly baseUrl: string;
  private authToken: string | null = null;

  // Private constructor — only getInstance() can create the instance
  private constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient('http://localhost:8000/api');
    }
    return ApiClient.instance;
  }

    /**
   * Called by the auth layer after login to attach the JWT to all requests.
   * Pass null on logout to clear it.
   *
   * Usage (in your auth context after a successful login):
   *   ApiClient.getInstance().setAuthToken(token);
   */

  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    return headers;
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: this.buildHeaders(),
    });
    if (!res.ok) throw new Error(`GET ${path} failed with status ${res.status}`);
    return res.json() as Promise<T>;
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`POST ${path} failed with status ${res.status}`);
    return res.json() as Promise<T>;
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'PATCH',
      headers: this.buildHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`PATCH ${path} failed with status ${res.status}`);
    return res.json() as Promise<T>;
  }
}