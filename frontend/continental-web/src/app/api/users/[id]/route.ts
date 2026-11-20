import { cookies } from "next/headers";
import {
  NextRequest,
  NextResponse,
} from "next/server";

import { API_URL } from "@/lib/api-url";
import type {
  UpdateUserData,
} from "@/types/users";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function getToken() {
  return (await cookies()).get(
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
      { message: "La sesión ha expirado." },
      { status: 401 }
    );
  }

  const { id } = await context.params;

  try {
    const body =
      (await request.json()) as UpdateUserData;
    const response = await fetch(
      `${API_URL}/api/usuarios/${id}`,
      {
        method: "PUT",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idRol: Number(body.idRol),
          nombres: body.nombres.trim(),
          correo: body.correo.trim().toLowerCase(),
        }),
        cache: "no-store",
      }
    );
    const responseBody = await response.json();

    return NextResponse.json(responseBody, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      {
        message:
          "No fue posible actualizar el usuario.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  const token = await getToken();

  if (!token) {
    return NextResponse.json(
      { message: "La sesión ha expirado." },
      { status: 401 }
    );
  }

  const { id } = await context.params;
  const active =
    request.nextUrl.searchParams.get("active");

  if (active !== "true" && active !== "false") {
    return NextResponse.json(
      { message: "Estado no válido." },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `${API_URL}/api/usuarios/${id}/estado?activo=${active}`,
      {
        method: "PATCH",
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
          "No fue posible cambiar el estado del usuario.",
      },
      { status: 500 }
    );
  }
}
