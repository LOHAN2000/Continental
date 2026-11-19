import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { API_URL } from "@/lib/api-url";
import type {
  ApiErrorResponse,
  LoginRequest,
  LoginResponse,
} from "@/types/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginRequest;

    const correo = body.correo?.trim().toLowerCase();
    const password = body.password;

    if (!correo || !password) {
      return NextResponse.json(
        {
          message:
            "El correo y la contraseña son obligatorios.",
        },
        {
          status: 400,
        }
      );
    }

    const apiResponse = await fetch(
      `${API_URL}/api/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          correo,
          password,
        }),
        cache: "no-store",
      }
    );

    const responseBody = (await apiResponse.json()) as
      | LoginResponse
      | ApiErrorResponse;

    if (!apiResponse.ok) {
      const errorResponse =
        responseBody as ApiErrorResponse;

      return NextResponse.json(
        {
          message:
            errorResponse.message ??
            "No fue posible iniciar sesión.",
        },
        {
          status: apiResponse.status,
        }
      );
    }

    const loginResponse =
      responseBody as LoginResponse;

    const expiration = new Date(
      loginResponse.data.expiration
    );

    const cookieStore = await cookies();

    cookieStore.set(
      "continental_token",
      loginResponse.data.token,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: expiration,
      }
    );

    cookieStore.set(
      "continental_user",
      JSON.stringify(
        loginResponse.data.usuario
      ),
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: expiration,
      }
    );

    return NextResponse.json(
      {
        message: loginResponse.message,
        usuario: loginResponse.data.usuario,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Error al iniciar sesión:",
      error
    );

    return NextResponse.json(
      {
        message:
          "No fue posible conectar con el servidor. Inténtalo nuevamente.",
      },
      {
        status: 500,
      }
    );
  }
}