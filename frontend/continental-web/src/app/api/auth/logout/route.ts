import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();

  cookieStore.delete("continental_token");
  cookieStore.delete("continental_user");

  return NextResponse.json(
    {
      message: "Sesión cerrada correctamente.",
    },
    {
      status: 200,
    }
  );
}