export type UserRole =
  | "PROPIETARIO"
  | "CAJERO";

export type LoginRequest = {
  correo: string;
  password: string;
};

export type SessionUser = {
  idUsuario: number | string;
  nombres: string;
  correo: string;
  rol: UserRole;
};

export type LoginData = {
  token: string;
  expiration: string;
  usuario: SessionUser;
};

export type LoginResponse = {
  message: string;
  data: LoginData;
};

export type SessionResponse = {
  idUsuario: number | string;
  nombres: string;
  correo: string;
  rol: UserRole;
};

export type {
  ApiErrorResponse,
} from "@/lib/api/read-response";