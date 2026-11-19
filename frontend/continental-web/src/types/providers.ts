export type Provider = {
  idProveedor: number;
  documento: string;
  razonSocial: string;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string | null;
};

export type ProviderFormData = {
  documento: string;
  razonSocial: string;
  telefono: string;
  correo: string;
  direccion: string;
};

export type ProvidersResponse = {
  data: Provider[];
};

export type ProviderResponse = {
  message: string;
  data: Provider;
};

export type ProviderErrorResponse = {
  message?: string;
  title?: string;
  errors?: Record<string, string[]>;
};