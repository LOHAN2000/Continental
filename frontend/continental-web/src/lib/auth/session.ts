import { cookies } from "next/headers";

import { API_URL } from "@/lib/api-url";
import { readApiResponse } from "@/lib/api/read-response";
import type {
  SessionResponse,
  SessionUser,
} from "@/types/auth";

export async function getSession():
  Promise<SessionUser | null> {
  const cookieStore = await cookies();

  const token = cookieStore.get("continental_token")?.value;

  if (!token) {
    return null;
  }

  try {
    const response = await fetch(
      `${API_URL}/api/auth/session`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return null;
    }

    const session =
      await readApiResponse<SessionResponse>(
        response,
        "No se pudo validar la sesión."
      );

    return {
      idUsuario: session.idUsuario,
      nombres: session.nombres,
      correo: session.correo,
      rol: session.rol,
    };
  } catch (error) {
    console.error(
      "No se pudo validar la sesión:",
      error
    );

    return null;
  }
}

export async function getToken():
  Promise<string | null> {
  const cookieStore = await cookies();

  return cookieStore.get("continental_token")?.value ?? null;
}