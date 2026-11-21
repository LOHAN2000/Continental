"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { readApiResponse } from "@/lib/api/read-response";
import type { LoginResponse } from "@/types/auth";

export default function LoginPage() {
  const router = useRouter();

  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");

    if (!correo.trim() || !password) {
      setMessage(
        "Completa el correo y la contraseña."
      );

      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        "/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            correo,
            password,
          }),
        }
      );

      await readApiResponse<LoginResponse>(
        response,
        "Correo o contraseña incorrectos."
      );

      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof TypeError
          ? "No fue posible conectar con el servidor."
          : error instanceof Error
          ? error.message
          : "No fue posible conectar con el servidor."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] lg:grid lg:grid-cols-2">
      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <Image
              src="/brand/logo-continental.png"
              alt="Logo de Continental"
              width={160}
              height={160}
              className="h-40 w-40 rounded-3xl object-contain"
              priority
            />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_20px_60px_rgba(36,39,42,0.08)] sm:p-10">
            <div className="mb-8">
              <p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-[#d90016]">
                Sistema de inventario
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-[#24272a]">
                Iniciar sesión
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Ingresa tus credenciales para
                administrar productos, compras,
                ventas y alertas.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              noValidate
              className="space-y-5"
            >
              <div>
                <label
                  htmlFor="correo"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Correo electrónico
                </label>

                <input
                  id="correo"
                  name="correo"
                  type="email"
                  autoComplete="email"
                  required
                  value={correo}
                  disabled={isLoading}
                  onChange={(event) =>
                    setCorreo(
                      event.target.value
                    )
                  }
                  placeholder="admin@continental.test"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#d90016] focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Contraseña
                </label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  disabled={isLoading}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Ingresa tu contraseña"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#d90016] focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>

              {message && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
                >
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center rounded-xl bg-[#d90016] px-4 py-3.5 font-bold text-white transition hover:bg-[#a90012] focus:outline-none focus:ring-4 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading
                  ? "Verificando…"
                  : "Ingresar"}
              </button>
            </form>

            <p className="mt-7 text-center text-xs leading-5 text-slate-500">
              Acceso reservado para usuarios
              autorizados de Continental.
            </p>
          </div>
        </div>
      </section>

      <section className="relative hidden min-h-screen overflow-hidden bg-[#fff7de] lg:flex lg:items-center lg:justify-center">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#f7b500]/30" />

        <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-[#d90016]/10" />

        <div className="relative z-10 max-w-xl px-12 text-center">
          <Image
            src="/brand/logo-continental.png"
            alt="Logo de Continental"
            width={240}
            height={240}
            className="mx-auto mb-8 h-60 w-60 rounded-3xl object-contain"
            priority
          />

          <p className="mx-auto mt-6 max-w-md text-lg leading-8 text-[#24272a]">
            Controla el inventario, registra
            operaciones y consulta alertas desde
            una sola plataforma.
          </p>
        </div>
      </section>
    </main>
  );
}