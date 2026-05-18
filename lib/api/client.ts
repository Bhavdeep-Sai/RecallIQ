import { AppError } from "@/lib/errors";

export async function apiRequest<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new AppError(`Request failed with status ${response.status}`, {
      code: "API_REQUEST_FAILED",
      status: response.status,
    });
  }

  return (await response.json()) as T;
}