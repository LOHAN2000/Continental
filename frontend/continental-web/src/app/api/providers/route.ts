import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { API_URL } from "@/lib/api-url";
import type {
  ProviderFormData,
} from "@/types/providers";

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

  const search =
    request.nextUrl.searchParams.get(
      "search"
    );

  const includeInactive =
    request.nextUrl.searchParams.get(
      "includeInactive"
    ) ?? "true";

  const query = new URLSearchParams({
    includeInactive,
  });

  if (search) {
    query.set("search", search);
  }

  try {
    const response = await fetch(
      `${API_URL}/api/proveedores?${query.toString()}`,
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
          "No fue posible consultar los proveedores.",
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
      (await request.json()) as ProviderFormData;

    const response = await fetch(
      `${API_URL}/api/proveedores`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          documento:
            body.documento.trim(),

          razonSocial:
            body.razonSocial.trim(),

          telefono:
            body.telefono.trim() || null,

          correo:
            body.correo
              .trim()
              .toLowerCase() || null,

          direccion:
            body.direccion.trim() || null,
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
          "No fue posible procesar el proveedor.",
      },
      {
        status: 500,
      }
    );
  }
}