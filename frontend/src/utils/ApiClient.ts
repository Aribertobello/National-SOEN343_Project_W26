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

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: this.buildHeaders(),
      credentials: 'include',
    });
    if (!res.ok){
      console.log(res.status)
      throw new Error(`GET ${path} failed with status ${res.status}`);
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
    if (!res.ok) throw new Error(`POST ${path} failed with status ${res.status}`);
    return res.json() as Promise<T>;
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: this.buildHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`PATCH ${path} failed with status ${res.status}`);
    return res.json() as Promise<T>;
  }
}