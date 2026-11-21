import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { API_URL } from "@/lib/api-url";
import type {
  ProductFormData,
} from "@/types/products";

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

  const idCategoria =
    request.nextUrl.searchParams.get(
      "idCategoria"
    );

  const includeInactive =
    request.nextUrl.searchParams.get(
      "includeInactive"
    ) ?? "true";

  const query = new URLSearchParams();

  if (search) {
    query.set("search", search);
  }

  if (idCategoria) {
    query.set(
      "idCategoria",
      idCategoria
    );
  }

  query.set(
    "includeInactive",
    includeInactive
  );

  try {
    const response = await fetch(
      `${API_URL}/api/productos?${query.toString()}`,
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
          "No fue posible consultar los productos.",
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
      (await request.json()) as ProductFormData;

    const payload = {
      idCategoria: Number(body.idCategoria),
      codigoBarras: body.codigoBarras?.trim() ?? "",
      nombre: body.nombre?.trim() ?? "",
      descripcion: body.descripcion?.trim() || null,
      precioCompra: Number(body.precioCompra),
      precioVenta: Number(body.precioVenta),
      stockMinimo: Number(body.stockMinimo),
      controlaVencimiento: Boolean(
        body.controlaVencimiento
      ),
    };

    console.log("Registrando producto:", payload);

    const response = await fetch(
      `${API_URL}/api/productos`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      }
    );

    const responseText = await response.text();

    let responseBody: unknown;

    try {
      responseBody = responseText
        ? JSON.parse(responseText)
        : {
            message: response.ok
              ? "Producto procesado correctamente."
              : "El backend no devolvió detalles del error.",
          };
    } catch {
      responseBody = {
        message: response.ok
          ? "Producto procesado correctamente."
          : responseText ||
            "El backend devolvió una respuesta no válida.",
      };
    }

    if (!response.ok) {
      console.error(
        "Error del backend al registrar producto:",
        {
          status: response.status,
          body: responseBody,
        }
      );
    }

    return NextResponse.json(
      responseBody,
      {
        status: response.status,
      }
    );
  } catch (error) {
    console.error(
      "Excepción en POST /api/products:",
      error
    );

    return NextResponse.json(
      {
        message: error instanceof Error
          ? error.message
          : "No fue posible procesar el producto.",
      },
      {
        status: 500,
      }
    );
  }
}