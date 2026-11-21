import { NextResponse } from "next/server";

import { API_URL } from "@/lib/api-url";

export async function GET() {
  try {
    const response = await fetch(`${API_URL}/health`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          application: "Continental Web",
          status: "Degraded",
          backend: "Unavailable",
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        application: "Continental Web",
        status: "Healthy",
        backend: "Connected",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        application: "Continental Web",
        status: "Degraded",
        backend: "Unavailable",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
