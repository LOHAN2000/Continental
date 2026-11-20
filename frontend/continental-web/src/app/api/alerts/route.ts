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
  const tipo =
    request.nextUrl.searchParams.get("tipo");
  const leida =
    request.nextUrl.searchParams.get("leida");
  const includeInactive =
    request.nextUrl.searchParams.get(
      "includeInactive"
    ) ?? "false";

  if (tipo) {
    query.set("tipo", tipo);
  }

  if (leida) {
    query.set("leida", leida);
  }

  query.set("includeInactive", includeInactive);

  try {
    const response = await fetch(
      `${API_URL}/api/alertas?${query.toString()}`,
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
          "No fue posible consultar las alertas.",
      },
      {
        status: 500,
      }
    );
  }
}
