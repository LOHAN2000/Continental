import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { API_URL } from "@/lib/api-url";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  const token = (await cookies()).get(
    "continental_token"
  )?.value;

  if (!token) {
    return NextResponse.json(
      { message: "La sesión ha expirado." },
      { status: 401 }
    );
  }

  const { id } = await context.params;

  try {
    const body = (await request.json()) as {
      nuevaPassword: string;
    };
    const response = await fetch(
      `${API_URL}/api/usuarios/${id}/password`,
      {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nuevaPassword: body.nuevaPassword,
        }),
        cache: "no-store",
      }
    );
    const responseBody = await response.json();

    return NextResponse.json(responseBody, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      {
        message:
          "No fue posible restablecer la contraseña.",
      },
      { status: 500 }
    );
  }
}
