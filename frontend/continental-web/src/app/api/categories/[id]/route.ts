import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { API_URL } from "@/lib/api-url";
import type {
  CategoryFormData,
} from "@/types/categories";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function getToken() {
  const cookieStore = await cookies();

  return cookieStore.get(
    "continental_token"
  )?.value;
}

export async function PUT(
  request: Request,
  context: RouteContext
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

  const { id } = await context.params;

  const body =
    (await request.json()) as CategoryFormData;

  const response = await fetch(
    `${API_URL}/api/categorias/${id}`,
    {
      method: "PUT",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nombre: body.nombre.trim(),
        descripcion:
          body.descripcion?.trim() || null,
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
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
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

  const { id } = await context.params;

  const active =
    request.nextUrl.searchParams.get(
      "active"
    );

  if (
    active !== "true" &&
    active !== "false"
  ) {
    return NextResponse.json(
      {
        message:
          "El estado solicitado no es válido.",
      },
      {
        status: 400,
      }
    );
  }

  const response = await fetch(
    `${API_URL}/api/categorias/${id}/estado?activo=${active}`,
    {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
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
}