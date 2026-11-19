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

  const search =
    request.nextUrl.searchParams.get(
      "search"
    );

  const idCategoria =
    request.nextUrl.searchParams.get(
      "idCategoria"
    );

  const estado =
    request.nextUrl.searchParams.get(
      "estado"
    );

  const includeInactive =
    request.nextUrl.searchParams.get(
      "includeInactive"
    ) ?? "false";

  if (search) {
    query.set("search", search);
  }

  if (idCategoria) {
    query.set(
      "idCategoria",
      idCategoria
    );
  }

  if (estado) {
    query.set("estado", estado);
  }

  query.set(
    "includeInactive",
    includeInactive
  );

  try {
    const response = await fetch(
      `${API_URL}/api/inventario?${query.toString()}`,
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
          "No fue posible consultar el inventario.",
      },
      {
        status: 500,
      }
    );
  }
}
