import { redirect } from "next/navigation";

import { API_URL } from "@/lib/api-url";
import { getToken } from "@/lib/auth/session";

type ServerApiOptions = RequestInit & {
  redirectOnUnauthorized?: boolean;
};

export async function serverApiFetch(
  path: string,
  options: ServerApiOptions = {}
): Promise<Response> {
  const token = await getToken();

  if (!token) {
    redirect("/login");
  }

  const {
    redirectOnUnauthorized = true,
    headers,
    ...requestOptions
  } = options;

  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...requestOptions,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...headers,
      },
      cache: options.cache ?? "no-store",
    }
  );

  if (
    response.status === 401 &&
    redirectOnUnauthorized
  ) {
    redirect("/login");
  }

  return response;
}