import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { API_URL } from "@/lib/api-url";
import type {
  PurchaseFormData,
} from "@/types/purchases";

async function getToken() {
  const cookieStore = await cookies();

  return cookieStore.get(
    "continental_token"
  )?.value;
}

export async function GET() {
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
    const response = await fetch(
      `${API_URL}/api/compras`,
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
          "No fue posible consultar las compras.",
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
      (await request.json()) as PurchaseFormData;

    const response = await fetch(
      `${API_URL}/api/compras`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idProveedor:
            Number(body.idProveedor),
          observacion:
            body.observacion.trim() || null,
          detalles: body.detalles.map(
            (detail) => ({
              idProducto:
                Number(detail.idProducto),
              cantidad:
                Number(detail.cantidad),
              costoUnitario:
                Number(detail.costoUnitario),
              codigoLote:
                detail.codigoLote.trim() || null,
              fechaVencimiento:
                detail.fechaVencimiento || null,
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
          "No fue posible procesar la compra.",
      },
      {
        status: 500,
      }
    );
  }
}
