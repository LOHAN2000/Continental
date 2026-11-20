import type { UserRole } from "@/types/auth";

export type AppUser = {
  idUsuario: number;
  idRol: number;
  rol: UserRole;
  nombres: string;
  correo: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string | null;
};

export type AppRole = {
  idRol: number;
  nombre: UserRole;
  descripcion: string | null;
  activo: boolean;
};

export type UserFormData = {
  idRol: number;
  nombres: string;
  correo: string;
  password: string;
};

export type UpdateUserData = {
  idRol: number;
  nombres: string;
  correo: string;
};

export type UsersResponse = {
  data: AppUser[];
};

export type RolesResponse = {
  data: AppRole[];
};

export type UserResponse = {
  message: string;
  data: AppUser;
};

export type UserActionResponse = {
  message: string;
  data?: AppUser;
};
