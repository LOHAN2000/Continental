import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { API_URL } from "@/lib/api-url";
import type {
  CategoryErrorResponse,
  CategoryFormData,
} from "@/types/categories";

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

  const includeInactive =
    request.nextUrl.searchParams.get(
      "includeInactive"
    ) ?? "true";

  const response = await fetch(
    `${API_URL}/api/categorias?includeInactive=${includeInactive}`,
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
      (await request.json()) as CategoryFormData;

    const nombre = body.nombre?.trim();
    const descripcion =
      body.descripcion?.trim() || null;

    if (!nombre) {
      return NextResponse.json(
        {
          message:
            "El nombre de la categoría es obligatorio.",
        },
        {
          status: 400,
        }
      );
    }

    const response = await fetch(
      `${API_URL}/api/categorias`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre,
          descripcion,
        }),
        cache: "no-store",
      }
    );

    const responseBody =
      (await response.json()) as CategoryErrorResponse;

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
          "No fue posible procesar la categoría.",
      },
      {
        status: 500,
      }
    );
  }
}