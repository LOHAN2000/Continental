export type Category = {
  idCategoria: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string | null;
};

export type CategoryFormData = {
  nombre: string;
  descripcion: string;
};

export type CategoriesResponse = {
  data: Category[];
};

export type CategoryResponse = {
  message: string;
  data: Category;
};

export type CategoryErrorResponse = {
  message?: string;
  title?: string;
  errors?: Record<string, string[]>;
};