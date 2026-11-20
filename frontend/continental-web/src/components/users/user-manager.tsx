"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { readApiResponse } from "@/lib/api/read-response";
import { formatDateTime } from "@/lib/formatters";
import type { UserRole } from "@/types/auth";
import type {
  AppRole,
  AppUser,
  UserActionResponse,
  UserFormData,
  UserResponse,
  UsersResponse,
  RolesResponse,
} from "@/types/users";

const initialForm: UserFormData = {
  idRol: 0,
  nombres: "",
  correo: "",
  password: "",
};

function Message({
  text,
  type,
}: {
  text: string;
  type: "success" | "error";
}) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className={[
        "rounded-xl border px-4 py-3 text-sm font-semibold",
        type === "success"
          ? "border-green-200 bg-green-50 text-green-800"
          : "border-red-200 bg-red-50 text-red-900",
      ].join(" ")}
    >
      {text}
    </div>
  );
}

function StateMessage({
  text,
}: {
  text: string;
}) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center text-sm font-semibold text-slate-700">
      {text}
    </div>
  );
}

function UserRoleBadge({
  role,
}: {
  role: UserRole;
}) {
  return (
    <span
      className={[
        "inline-flex rounded-full px-3 py-1 text-xs font-bold",
        role === "PROPIETARIO"
          ? "bg-red-100 text-red-900"
          : "bg-amber-100 text-amber-900",
      ].join(" ")}
    >
      {role}
    </span>
  );
}

function UserStatusBadge({
  active,
}: {
  active: boolean;
}) {
  return (
    <span
      className={[
        "inline-flex rounded-full px-3 py-1 text-xs font-bold",
        active
          ? "bg-green-100 text-green-900"
          : "bg-slate-200 text-slate-800",
      ].join(" ")}
    >
      {active ? "Activo" : "Inactivo"}
    </span>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-sm font-semibold text-slate-800"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClassName =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-[#d90016] focus:ring-4 focus:ring-red-100 disabled:bg-slate-100";

export function UserManager() {
  const router = useRouter();

  const [users, setUsers] = useState<AppUser[]>([]);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [form, setForm] =
    useState<UserFormData>(initialForm);
  const [editingUser, setEditingUser] =
    useState<AppUser | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] =
    useState<UserRole | "TODOS">("TODOS");
  const [statusFilter, setStatusFilter] =
    useState<"TODOS" | "ACTIVO" | "INACTIVO">(
      "TODOS"
    );
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState<"success" | "error">("success");
  const [isLoading, setIsLoading] =
    useState(true);
  const [isSaving, setIsSaving] =
    useState(false);
  const [processingUserId, setProcessingUserId] =
    useState<number | null>(null);

  function showMessage(
    text: string,
    type: "success" | "error"
  ) {
    setMessage(text);
    setMessageType(type);
  }

  async function loadData() {
    setIsLoading(true);

    try {
      const [
        usersResponse,
        rolesResponse,
      ] = await Promise.all([
        fetch(
          "/api/users?includeInactive=true",
          { cache: "no-store" }
        ),
        fetch("/api/users/roles", {
          cache: "no-store",
        }),
      ]);

      if (
        usersResponse.status === 401 ||
        rolesResponse.status === 401
      ) {
        router.replace("/login");
        return;
      }

      const [usersBody, rolesBody] =
        await Promise.all([
          readApiResponse<UsersResponse>(
            usersResponse,
            "No fue posible cargar los usuarios."
          ),
          readApiResponse<RolesResponse>(
            rolesResponse,
            "No fue posible cargar los roles."
          ),
        ]);

      setUsers(usersBody.data);
      setRoles(rolesBody.data);
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "No fue posible cargar los usuarios y roles.",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !normalizedSearch ||
        user.nombres
          .toLowerCase()
          .includes(normalizedSearch) ||
        user.correo
          .toLowerCase()
          .includes(normalizedSearch);
      const matchesRole =
        roleFilter === "TODOS" ||
        user.rol === roleFilter;
      const matchesStatus =
        statusFilter === "TODOS" ||
        (statusFilter === "ACTIVO" &&
          user.activo) ||
        (statusFilter === "INACTIVO" &&
          !user.activo);

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      );
    });
  }, [users, search, roleFilter, statusFilter]);

  function resetForm() {
    setForm(initialForm);
    setEditingUser(null);
  }

  function startEditing(user: AppUser) {
    setEditingUser(user);
    setForm({
      idRol: user.idRol,
      nombres: user.nombres,
      correo: user.correo,
      password: "",
    });
    setMessage("");
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function validateForm(): string | null {
    if (form.idRol <= 0) {
      return "Selecciona un rol.";
    }

    if (!form.nombres.trim()) {
      return "Los nombres son obligatorios.";
    }

    if (!form.correo.trim()) {
      return "El correo es obligatorio.";
    }

    const validEmail =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.correo.trim()
      );

    if (!validEmail) {
      return "El correo no tiene un formato válido.";
    }

    if (
      !editingUser &&
      form.password.length < 8
    ) {
      return "La contraseña debe tener al menos 8 caracteres.";
    }

    return null;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      showMessage(
        validationError,
        "error"
      );
      return;
    }

    await saveUser();
  }

  async function saveUser() {
    setIsSaving(true);

    try {
      const endpoint = editingUser
        ? `/api/users/${editingUser.idUsuario}`
        : "/api/users";
      const response = await fetch(endpoint, {
        method: editingUser ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          editingUser
            ? {
                idRol: form.idRol,
                nombres: form.nombres.trim(),
                correo: form.correo.trim(),
              }
            : {
                ...form,
                nombres: form.nombres.trim(),
                correo: form.correo.trim(),
              }
        ),
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const body =
        await readApiResponse<UserResponse>(
          response,
          editingUser
            ? "No fue posible actualizar el usuario."
            : "No fue posible registrar el usuario."
        );

      resetForm();
      showMessage(
        body.message ??
          (editingUser
            ? "Usuario actualizado correctamente."
            : "Usuario registrado correctamente."),
        "success"
      );
      await loadData();
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "No fue posible guardar el usuario.",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleActive(user: AppUser) {
    const nextActive = !user.activo;
    const action = nextActive
      ? "activar"
      : "desactivar";

    if (
      !window.confirm(
        `¿Confirmas ${action} a ${user.nombres}?`
      )
    ) {
      return;
    }

    setProcessingUserId(user.idUsuario);

    try {
      const response = await fetch(
        `/api/users/${user.idUsuario}?active=${nextActive}`,
        { method: "PATCH" }
      );

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const body =
        await readApiResponse<UserActionResponse>(
          response,
          `No fue posible ${action} el usuario.`
        );

      showMessage(
        body.message ??
          `Usuario ${nextActive ? "activado" : "desactivado"} correctamente.`,
        "success"
      );
      await loadData();
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : `No fue posible ${action} el usuario.`,
        "error"
      );
    } finally {
      setProcessingUserId(null);
    }
  }

  async function changePassword(user: AppUser) {
    const nuevaPassword = window.prompt(
      "Ingresa la nueva contraseña. Debe tener al menos 8 caracteres."
    );

    if (!nuevaPassword) {
      return;
    }

    if (nuevaPassword.length < 8) {
      showMessage(
        "La contraseña debe tener al menos 8 caracteres.",
        "error"
      );
      return;
    }

    setProcessingUserId(user.idUsuario);

    try {
      const response = await fetch(
        `/api/users/${user.idUsuario}/password`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ nuevaPassword }),
        }
      );

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const body =
        await readApiResponse<UserActionResponse>(
          response,
          "No fue posible restablecer la contraseña."
        );

      showMessage(
        body.message ??
          "Contraseña restablecida correctamente.",
        "success"
      );
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "No fue posible restablecer la contraseña.",
        "error"
      );
    } finally {
      setProcessingUserId(null);
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#d90016]">
          Continental
        </p>
        <h2 className="mt-2 text-2xl font-bold text-[#24272a]">
          Gestión de usuarios
        </h2>
        <p className="mt-2 text-sm text-slate-700">
          Administra las cuentas, roles y accesos del personal.
        </p>
      </div>

      {message && (
        <Message
          text={message}
          type={messageType}
        />
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h3 className="text-lg font-bold text-slate-900">
          {editingUser
            ? "Editar usuario"
            : "Registrar usuario"}
        </h3>

        <form
          onSubmit={handleSubmit}
          className="mt-5 grid gap-4 md:grid-cols-2"
        >
          <Field label="Rol" htmlFor="user-role">
            <select
              id="user-role"
              required
              value={form.idRol}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  idRol: Number(event.target.value),
                }))
              }
              disabled={isLoading || isSaving}
              className={inputClassName}
            >
              <option value={0} disabled>
                Selecciona un rol
              </option>
              {roles
                .filter((role) => role.activo)
                .map((role) => (
                  <option
                    key={role.idRol}
                    value={role.idRol}
                  >
                    {role.nombre}
                  </option>
                ))}
            </select>
          </Field>

          <Field
            label="Nombres"
            htmlFor="user-names"
          >
            <input
              id="user-names"
              type="text"
              required
              value={form.nombres}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  nombres: event.target.value,
                }))
              }
              disabled={isSaving}
              autoComplete="name"
              className={inputClassName}
            />
          </Field>

          <Field
            label="Correo"
            htmlFor="user-email"
          >
            <input
              id="user-email"
              type="email"
              required
              value={form.correo}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  correo: event.target.value,
                }))
              }
              disabled={isSaving}
              autoComplete="email"
              className={inputClassName}
            />
          </Field>

          {!editingUser && (
            <Field
              label="Contraseña"
              htmlFor="user-password"
            >
              <input
                id="user-password"
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                disabled={isSaving}
                autoComplete="new-password"
                className={inputClassName}
              />
            </Field>
          )}

          <div className="flex flex-wrap gap-3 md:col-span-2">
            <button
              type="submit"
              disabled={isSaving || isLoading}
              className="h-11 rounded-xl bg-[#d90016] px-5 font-bold text-white transition hover:bg-[#a90012] focus:outline-none focus:ring-4 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving
                ? "Guardando…"
                : editingUser
                  ? "Guardar cambios"
                  : "Registrar usuario"}
            </button>
            {editingUser && (
              <button
                type="button"
                onClick={resetForm}
                disabled={isSaving}
                className="h-11 rounded-xl border border-slate-300 px-5 font-bold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar edición
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Usuarios registrados
          </h3>
          <p className="mt-1 text-sm text-slate-700">
            Busca y filtra las cuentas del sistema.
          </p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <Field
            label="Buscar por nombre o correo"
            htmlFor="user-search"
          >
            <input
              id="user-search"
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Nombre o correo..."
              className={inputClassName}
            />
          </Field>

          <Field
            label="Filtrar por rol"
            htmlFor="user-role-filter"
          >
            <select
              id="user-role-filter"
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(
                  event.target.value as
                    | UserRole
                    | "TODOS"
                )
              }
              className={inputClassName}
            >
              <option value="TODOS">
                Todos los roles
              </option>
              {roles.map((role) => (
                <option
                  key={role.idRol}
                  value={role.nombre}
                >
                  {role.nombre}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Filtrar por estado"
            htmlFor="user-status-filter"
          >
            <select
              id="user-status-filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | "TODOS"
                    | "ACTIVO"
                    | "INACTIVO"
                )
              }
              className={inputClassName}
            >
              <option value="TODOS">
                Todos los estados
              </option>
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
            </select>
          </Field>
        </div>

        {isLoading ? (
          <StateMessage text="Cargando usuarios…" />
        ) : filteredUsers.length ? (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-800">
                  <th className="px-4 py-3 font-bold">Usuario</th>
                  <th className="px-4 py-3 font-bold">Rol</th>
                  <th className="px-4 py-3 font-bold">Estado</th>
                  <th className="px-4 py-3 font-bold">Creado</th>
                  <th className="px-4 py-3 font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const processing =
                    processingUserId === user.idUsuario;

                  return (
                    <tr
                      key={user.idUsuario}
                      className="border-t border-slate-200 align-top text-slate-800"
                    >
                      <td className="px-4 py-4">
                        <p className="font-bold text-slate-900">
                          {user.nombres}
                        </p>
                        <p className="mt-1 break-all">
                          {user.correo}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <UserRoleBadge role={user.rol} />
                      </td>
                      <td className="px-4 py-4">
                        <UserStatusBadge
                          active={user.activo}
                        />
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        {formatDateTime(user.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => startEditing(user)}
                            disabled={processing || isSaving}
                            className="rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              void changePassword(user)
                            }
                            disabled={processing}
                            className="rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Cambiar contraseña
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              void toggleActive(user)
                            }
                            disabled={processing}
                            className={[
                              "rounded-lg px-3 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-60",
                              user.activo
                                ? "border border-red-200 bg-red-50 text-red-800 hover:bg-red-100"
                                : "border border-green-200 bg-green-50 text-green-800 hover:bg-green-100",
                            ].join(" ")}
                          >
                            {processing
                              ? "Procesando…"
                              : user.activo
                                ? "Desactivar"
                                : "Activar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <StateMessage text="No se encontraron usuarios con esos filtros." />
        )}
      </section>
    </section>
  );
}
