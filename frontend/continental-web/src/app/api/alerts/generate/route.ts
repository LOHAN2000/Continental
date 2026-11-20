import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { API_URL } from "@/lib/api-url";

export async function POST() {
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

  try {
    const response = await fetch(
      `${API_URL}/api/alertas/generar`,
      {
        method: "POST",
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
          "No fue posible generar las alertas.",
      },
      {
        status: 500,
      }
    );
  }
}
