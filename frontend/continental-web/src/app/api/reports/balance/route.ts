import { cookies } from "next/headers";
import {
  NextRequest,
  NextResponse,
} from "next/server";

import { API_URL } from "@/lib/api-url";

export async function GET(
  request: NextRequest
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

  const fechaInicio =
    request.nextUrl.searchParams.get(
      "fechaInicio"
    );
  const fechaFin =
    request.nextUrl.searchParams.get(
      "fechaFin"
    );

  if (!fechaInicio || !fechaFin) {
    return NextResponse.json(
      {
        message:
          "Las fechas de inicio y fin son obligatorias.",
      },
      { status: 400 }
    );
  }

  try {
    const query = new URLSearchParams({
      fechaInicio,
      fechaFin,
    });

    const response = await fetch(
      `${API_URL}/api/reportes/balance?${query.toString()}`,
      {
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
          "No fue posible consultar el balance.",
      },
      { status: 500 }
    );
  }
}
