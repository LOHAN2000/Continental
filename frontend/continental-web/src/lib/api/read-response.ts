import { NextResponse } from "next/server";

export type ApiErrorResponse = {
  message?: string;
  title?: string;
  errors?: Record<string, string[]>;
};

export async function readApiResponse<T>(
  response: Response,
  fallbackMessage: string
): Promise<T> {
  if (!response.ok) {
    let message = fallbackMessage;

    try {
      const errorBody = (await response.json()) as {
        message?: string;
      };

      if (errorBody.message) {
        message = errorBody.message;
      }
    } catch {
      // Ignorar error de parsing
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}