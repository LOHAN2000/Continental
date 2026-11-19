import { cookies } from "next/headers";
import {
  NextRequest,
  NextResponse,
} from "next/server";

import { API_URL } from "@/lib/api-url";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: NextRequest,
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
  const query = new URLSearchParams();

  const fechaInicio =
    request.nextUrl.searchParams.get(
      "fechaInicio"
    );

  const fechaFin =
    request.nextUrl.searchParams.get(
      "fechaFin"
    );

  if (fechaInicio) {
    query.set(
      "fechaInicio",
      fechaInicio
    );
  }

  if (fechaFin) {
    query.set("fechaFin", fechaFin);
  }

  const queryString = query.toString();

  try {
    const response = await fetch(
      `${API_URL}/api/inventario/${id}/kardex${
        queryString
          ? `?${queryString}`
          : ""
      }`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    const body = await response.json();

    return NextResponse.json(
      body,
      {
        status: response.status,
      }
    );
  } catch {
    return NextResponse.json(
      {
        message:
          "No fue posible consultar el Kardex.",
      },
      {
        status: 500,
      }
    );
  }
}
