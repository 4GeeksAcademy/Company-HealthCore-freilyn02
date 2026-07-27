// Base URL for the Talent Pipeline Tracker API, read from the environment.
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Custom error class so components can distinguish "API responded with
// an error" from other kinds of failures (like a network drop).
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

// Wraps fetch with consistent error handling.
// Every service function below calls this instead of fetch() directly.
export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    // The API's validation errors come back as { detail: [...] }.
    // We try to read that, but fall back to a generic message if parsing fails.
    let message = `Request failed with status ${response.status}`;
    try {
      const errorBody = await response.json();
      message = JSON.stringify(errorBody.detail ?? errorBody);
    } catch {
      // response body wasn't valid JSON, keep the generic message
    }
    throw new ApiError(message, response.status);
  }

  // DELETE requests often return no body (204 No Content).
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}