import { cookies } from "next/headers";
import {
  NextRequest,
  NextResponse,
} from "next/server";

import { API_URL } from "@/lib/api-url";
import type {
  UserFormData,
} from "@/types/users";

async function getToken() {
  return (await cookies()).get(
    "continental_token"
  )?.value;
}

export async function GET(
  request: NextRequest
) {
  const token = await getToken();

  if (!token) {
    return NextResponse.json(
      { message: "La sesión ha expirado." },
      { status: 401 }
    );
  }

  const search =
    request.nextUrl.searchParams.get("search");
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
      `${API_URL}/api/usuarios?${query.toString()}`,
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
          "No fue posible consultar los usuarios.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request
) {
  const token = await getToken();

  if (!token) {
    return NextResponse.json(
      { message: "La sesión ha expirado." },
      { status: 401 }
    );
  }

  try {
    const body =
      (await request.json()) as UserFormData;
    const response = await fetch(
      `${API_URL}/api/usuarios`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idRol: Number(body.idRol),
          nombres: body.nombres.trim(),
          correo: body.correo.trim().toLowerCase(),
          password: body.password,
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
          "No fue posible procesar el usuario.",
      },
      { status: 500 }
    );
  }
}
