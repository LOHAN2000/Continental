export type ProductStockStatus =
  | "SIN_STOCK"
  | "STOCK_MINIMO"
  | "DISPONIBLE";

export type Product = {
  idProducto: number;
  idCategoria: number;
  categoria: string;
  codigoBarras: string;
  nombre: string;
  descripcion: string | null;
  precioCompra: number;
  precioVenta: number;
  stockActual: number;
  stockMinimo: number;
  controlaVencimiento: boolean;
  activo: boolean;
  estadoStock: ProductStockStatus;
  createdAt: string;
  updatedAt: string | null;
};

export type ProductFormData = {
  idCategoria: number;
  codigoBarras: string;
  nombre: string;
  descripcion: string;
  precioCompra: number;
  precioVenta: number;
  stockMinimo: number;
  controlaVencimiento: boolean;
};

export type ProductsResponse = {
  data: Product[];
};

export type ProductResponse = {
  message: string;
  data: Product;
};

export type ProductErrorResponse = {
  message?: string;
  title?: string;
  errors?: Record<string, string[]>;
};