import { cookies } from "next/headers";
import {
  NextRequest,
  NextResponse,
} from "next/server";

import { API_URL } from "@/lib/api-url";
import type {
  CreateAdjustmentData,
} from "@/types/adjustments";

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
  const idProducto =
    request.nextUrl.searchParams.get(
      "idProducto"
    );
  const limit =
    request.nextUrl.searchParams.get(
      "limit"
    ) ?? "50";

  if (idProducto) {
    query.set("idProducto", idProducto);
  }

  query.set("limit", limit);

  try {
    const response = await fetch(
      `${API_URL}/api/ajustes-inventario?${query.toString()}`,
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
          "No fue posible consultar los ajustes.",
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
      (await request.json()) as CreateAdjustmentData;

    const response = await fetch(
      `${API_URL}/api/ajustes-inventario`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idProducto: Number(body.idProducto),
          tipo: body.tipo,
          cantidad: Number(body.cantidad),
          motivo: body.motivo.trim(),
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
          "No fue posible procesar el ajuste.",
      },
      {
        status: 500,
      }
    );
  }
}
