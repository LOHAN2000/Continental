"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import { readApiResponse } from "@/lib/api/read-response";
import type {
  Provider,
  ProviderFormData,
  ProviderResponse,
  ProvidersResponse,
} from "@/types/providers";

const initialForm: ProviderFormData = {
  documento: "",
  razonSocial: "",
  telefono: "",
  correo: "",
  direccion: "",
};

function MessageBanner({
  text,
  type,
}: {
  text: string;
  type: "success" | "error";
}) {
  return (
    <div
      role="alert"
      className={[
        "mb-6 rounded-xl border px-4 py-3 text-sm font-semibold",
        type === "success"
          ? "border-green-200 bg-green-50 text-green-800"
          : "border-red-200 bg-red-50 text-red-800",
      ].join(" ")}
    >
      {text}
    </div>
  );
}

function LoadingMessage() {
  return (
    <div className="mt-6 rounded-2xl bg-slate-50 py-12 text-center text-sm font-semibold text-slate-500">
      Cargando proveedores…
    </div>
  );
}

function EmptyMessage() {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center text-sm font-semibold text-slate-500">
      No se encontraron proveedores.
    </div>
  );
}

export function ProviderManager() {
  const [providers, setProviders] = useState<Provider[]>([]);

  const [form, setForm] = useState<ProviderFormData>({
    documento: "",
    razonSocial: "",
    telefono: "",
    correo: "",
    direccion: "",
  });

  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);

  const [search, setSearch] = useState("");

  const [message, setMessage] = useState("");

  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  async function loadProviders() {
    setIsLoading(true);

    try {
      const response = await fetch(
        "/api/providers?includeInactive=true",
        {
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      const body =
        await readApiResponse<ProvidersResponse>(
          response,
          "No fue posible cargar los proveedores."
        );

      setProviders(body.data);
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "No fue posible cargar los proveedores.",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadProviders();
  }, []);

  const filteredProviders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return providers;
    }

    return providers.filter(
      (provider) =>
        provider.razonSocial
          .toLowerCase()
          .includes(normalizedSearch) ||
        provider.documento
          .toLowerCase()
          .includes(normalizedSearch)
    );
  }, [providers, search]);

  function showMessage(
    value: string,
    type: "success" | "error"
  ) {
    setMessage(value);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
    }, 5000);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.documento.trim()) {
      showMessage(
        "El documento es obligatorio.",
        "error"
      );
      return;
    }

    if (!form.razonSocial.trim()) {
      showMessage(
        "La razón social es obligatoria.",
        "error"
      );
      return;
    }

    void saveProvider();
  }

  async function saveProvider() {
    setIsSaving(true);

    try {
      if (editingProvider) {
        const response = await fetch(
          `/api/providers/${editingProvider.idProveedor}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              documento: form.documento.trim(),
              razonSocial: form.razonSocial.trim(),
              telefono: form.telefono.trim() || null,
              correo: form.correo.trim().toLowerCase() || null,
              direccion: form.direccion.trim() || null,
            }),
          }
        );

        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        const body =
          await readApiResponse<ProviderResponse>(
            response,
            "No fue posible actualizar el proveedor."
          );

        showMessage(
          body.message ??
            "Proveedor actualizado correctamente.",
          "success"
        );
      } else {
        const response = await fetch(
          "/api/providers",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              documento: form.documento.trim(),
              razonSocial: form.razonSocial.trim(),
              telefono: form.telefono.trim() || null,
              correo: form.correo.trim().toLowerCase() || null,
              direccion: form.direccion.trim() || null,
            }),
          }
        );

        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        const body =
          await readApiResponse<ProviderResponse>(
            response,
            "No fue posible crear el proveedor."
          );

        showMessage(
          body.message ??
            "Proveedor registrado correctamente.",
          "success"
        );
      }

      resetForm();
      await loadProviders();
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "No fue posible guardar el proveedor.",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleEdit(provider: Provider) {
    setEditingProvider(provider);
    setForm({
      documento: provider.documento,
      razonSocial: provider.razonSocial,
      telefono: provider.telefono ?? "",
      correo: provider.correo ?? "",
      direccion: provider.direccion ?? "",
    });
  }

  async function handleToggleActive(provider: Provider) {
    try {
      const response = await fetch(
        `/api/providers/${provider.idProveedor}/estado?activo=${!provider.activo}`,
        {
          method: "PATCH",
        }
      );

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      await readApiResponse<unknown>(
        response,
        "No fue posible cambiar el estado."
      );

      showMessage(
        provider.activo
          ? "Proveedor desactivado correctamente."
          : "Proveedor activado correctamente.",
        "success"
      );

      await loadProviders();
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "No fue posible cambiar el estado.",
        "error"
      );
    }
  }

  function resetForm() {
    setForm({
      documento: "",
      razonSocial: "",
      telefono: "",
      correo: "",
      direccion: "",
    });
    setEditingProvider(null);
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#d90016]">
            Continental
          </p>

          <h2 className="mt-2 text-2xl font-bold text-[#24272a]">
            Gestión de proveedores
          </h2>
        </div>

        <button
          type="button"
          onClick={() => {
            setForm({
              documento: "",
              razonSocial: "",
              telefono: "",
              correo: "",
              direccion: "",
            });
            setEditingProvider(null);
          }}
          className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-red-100"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M12 5v14M5 12h14"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Nuevo proveedor</span>
        </button>
      </div>

      {message && (
        <div
          role="alert"
          aria-live="polite"
          className={[
            "mb-6 rounded-xl border px-4 py-3 text-sm font-semibold",
            messageType === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800",
          ].join(" ")}
        >
          {message}
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <div className="lg:col-span-2">
              <label
                htmlFor="razonSocial"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Razón social <span className="text-red-500">*</span>
              </label>

              <input
                id="razonSocial"
                name="razonSocial"
                type="text"
                required
                value={form.razonSocial}
                onChange={(event) =>
                  setForm({
                    ...form,
                    razonSocial: event.target.value,
                  })
                }
                placeholder="Razón social del proveedor"
                disabled={isSaving}
                className="input-style"
              />
            </div>

            <div>
              <label
                htmlFor="documento"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Documento <span className="text-red-500">*</span>
              </label>

              <input
                id="documento"
                name="documento"
                type="text"
                required
                value={form.documento}
                onChange={(event) =>
                  setForm({
                    ...form,
                    documento: event.target.value,
                  })
                }
                placeholder="Documento (RUC, DNI, etc.)"
                disabled={isSaving}
                className="input-style"
              />
            </div>

            <div>
              <label
                htmlFor="telefono"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Teléfono
              </label>

              <input
                id="telefono"
                name="telefono"
                type="text"
                value={form.telefono}
                onChange={(event) =>
                  setForm({
                    ...form,
                    telefono: event.target.value,
                  })
                }
                placeholder="Teléfono de contacto"
                disabled={isSaving}
                className="input-style"
              />
            </div>

            <div>
              <label
                htmlFor="correo"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Correo
              </label>

              <input
                id="correo"
                name="correo"
                type="email"
                value={form.correo}
                onChange={(event) =>
                  setForm({
                    ...form,
                    correo: event.target.value,
                  })
                }
                placeholder="correo@proveedor.com"
                disabled={isSaving}
                className="input-style"
              />
            </div>

            <div>
              <label
                htmlFor="direccion"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Dirección
              </label>

              <input
                id="direccion"
                name="direccion"
                type="text"
                value={form.direccion}
                onChange={(event) =>
                  setForm({
                    ...form,
                    direccion: event.target.value,
                  })
                }
                placeholder="Dirección del proveedor"
                disabled={isSaving}
                className="input-style"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            {editingProvider && (
              <button
                type="button"
                onClick={() => {
                  setForm({
                    documento: "",
                    razonSocial: "",
                    telefono: "",
                    correo: "",
                    direccion: "",
                  });
                  setEditingProvider(null);
                }}
                disabled={isSaving}
                className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="flex h-10 items-center gap-2 rounded-xl bg-[#d90016] px-4 font-bold text-white transition hover:bg-[#a90012] focus:outline-none focus:ring-4 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving
                ? "Guardando…"
                : editingProvider
                ? "Actualizar proveedor"
                : "Registrar proveedor"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label
                htmlFor="search"
                className="text-sm font-semibold text-slate-800"
              >
                Buscar
              </label>

              <input
                id="search"
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Razón social o documento..."
                className="w-72 rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#d90016] focus:ring-4 focus:ring-red-100"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2.5 px-5 font-bold">
                  Documento
                </th>
                <th className="py-2.5 px-5 font-bold">
                  Razón social
                </th>
                <th className="py-2.5 px-5 font-bold">
                  Teléfono
                </th>
                <th className="py-2.5 px-5 font-bold">
                  Correo
                </th>
                <th className="py-2.5 px-5 font-bold">
                  Dirección
                </th>
                <th className="py-2.5 px-5 font-bold text-center">
                  Estado
                </th>
                <th className="py-2.5 px-5 font-bold text-right">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredProviders.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-10 text-center text-sm text-slate-500"
                  >
                    {search
                      ? "No se encontraron proveedores."
                      : "No existen proveedores registrados."}
                  </td>
                </tr>
              ) : (
                filteredProviders.map((provider) => (
                  <tr
                    key={provider.idProveedor}
                    className="border-b border-slate-100"
                  >
                    <td className="py-4 px-5 font-mono text-sm text-slate-600">
                      {provider.documento}
                    </td>

                    <td className="py-4 px-5">
                      <p className="font-semibold text-slate-800">
                        {provider.razonSocial}
                      </p>
                    </td>

                    <td className="py-4 px-5 text-slate-600">
                      {provider.telefono ?? "—"}
                    </td>

                    <td className="py-4 px-5 text-slate-600">
                      {provider.correo ?? "—"}
                    </td>

                    <td className="py-4 px-5 text-slate-600">
                      {provider.direccion ?? "—"}
                    </td>

                    <td className="py-4 px-5 text-center">
                      <span
                        className={[
                          "inline-flex rounded-full px-3 py-1 text-xs font-bold",
                          provider.activo
                            ? "bg-green-50 text-green-800"
                            : "bg-red-50 text-red-800",
                        ].join(" ")}
                      >
                        {provider.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(provider)}
                          disabled={isSaving}
                          className="h-9 w-9 rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-red-50 hover:border-red-200 hover:text-[#a90012] focus:outline-none focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                          aria-label="Editar proveedor"
                        >
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            fill="none"
                            className="h-5 w-5"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5a2.121 2.121 0 013 3z"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleActive(provider)}
                          disabled={isSaving}
                          className="h-9 w-9 rounded-xl border border-slate-200 bg-white p-2 transition focus:outline-none focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                          aria-label={
                            provider.activo
                              ? "Desactivar proveedor"
                              : "Activar proveedor"
                          }
                        >
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            fill="none"
                            className={[
                              "h-5 w-5",
                              provider.activo
                                ? "text-green-600"
                                : "text-red-600",
                            ].join(" ")}
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            {provider.activo ? (
                              <>
                                <path
                                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M12 16V12M12 8H12.01"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </>
                            ) : (
                              <>
                                <path
                                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M8 12H16"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </>
                            )}
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {isLoading && (
          <div className="flex justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#d90016] border-t-transparent" />
          </div>
        )}
      </div>
    </section>
  );
}