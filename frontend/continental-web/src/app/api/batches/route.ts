import { cookies } from "next/headers";
import {
  NextRequest,
  NextResponse,
} from "next/server";

import { API_URL } from "@/lib/api-url";

export async function GET(
  request: NextRequest
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

  const query = new URLSearchParams();

  const idProducto =
    request.nextUrl.searchParams.get(
      "idProducto"
    );

  const onlyAvailable =
    request.nextUrl.searchParams.get(
      "onlyAvailable"
    ) ?? "false";

  if (idProducto) {
    query.set(
      "idProducto",
      idProducto
    );
  }

  query.set(
    "onlyAvailable",
    onlyAvailable
  );

  try {
    const response = await fetch(
      `${API_URL}/api/lotes?${query.toString()}`,
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
          "No fue posible consultar los lotes.",
      },
      {
        status: 500,
      }
    );
  }
}
