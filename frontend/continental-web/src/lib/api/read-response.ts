export type ApiErrorResponse = {
  message?: string;
  title?: string;
  errors?: Record<string, string[]>;
};

export async function readApiResponse<T>(
  response: Response,
  fallbackMessage: string
): Promise<T> {
  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new Error(fallbackMessage);
  }

  if (!response.ok) {
    const errorBody =
      body as ApiErrorResponse;

    const validationMessage =
      errorBody.errors
        ? Object.values(errorBody.errors)
            .flat()
            .join(" ")
        : null;

    throw new Error(
      errorBody.message ??
        validationMessage ??
        errorBody.title ??
        fallbackMessage
    );
  }

  return body as T;
}
