import { cookies } from "next/headers";
import {
  NextRequest,
  NextResponse,
} from "next/server";

import { API_URL } from "@/lib/api-url";
import type {
  CreateSaleData,
} from "@/types/sales";

async function getToken() {
  const cookieStore = await cookies();

  return cookieStore.get(
    "continental_token"
  )?.value;
}

export async function GET(
  request: NextRequest
) {
  const token = await getToken();

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

  const fechaInicio =
    request.nextUrl.searchParams.get(
      "fechaInicio"
    );

  const fechaFin =
    request.nextUrl.searchParams.get(
      "fechaFin"
    );

  if (fechaInicio) {
    query.set("fechaInicio", fechaInicio);
  }

  if (fechaFin) {
    query.set("fechaFin", fechaFin);
  }

  const queryString = query.toString();

  try {
    const response = await fetch(
      `${API_URL}/api/ventas${
        queryString ? `?${queryString}` : ""
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

    return NextResponse.json(body, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      {
        message:
          "No fue posible consultar las ventas.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: Request
) {
  const token = await getToken();

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
    const body =
      (await request.json()) as CreateSaleData;

    const response = await fetch(
      `${API_URL}/api/ventas`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          observacion:
            body.observacion.trim() || null,
          detalles: body.detalles.map(
            (detail) => ({
              idProducto: Number(
                detail.idProducto
              ),
              cantidad: Number(
                detail.cantidad
              ),
            })
          ),
        }),
        cache: "no-store",
      }
    );

    const responseBody =
      await response.json();

    return NextResponse.json(
      responseBody,
      {
        status: response.status,
      }
    );
  } catch {
    return NextResponse.json(
      {
        message:
          "No fue posible procesar la venta.",
      },
      {
        status: 500,
      }
    );
  }
}
