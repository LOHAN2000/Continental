import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { API_URL } from "@/lib/api-url";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  _request: Request,
  context: RouteContext
) {
  const cookieStore = await cookies();

  const token = cookieStore.get(
    "continental_token"
  )?.value;

  if (!token) {
    return NextResponse.json(
      {
        message: "La sesión ha expirado.",
      },
      {
        status: 401,
      }
    );
  }

  const { id } = await context.params;

  try {
    const response = await fetch(
      `${API_URL}/api/alertas/${id}/leer`,
      {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    const body = await response.json();

    return NextResponse.json(body, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      {
        message:
          "No fue posible actualizar la alerta.",
      },
      {
        status: 500,
      }
    );
  }
}
