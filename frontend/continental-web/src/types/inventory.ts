export type InventoryStatus =
  | "SIN_STOCK"
  | "STOCK_MINIMO"
  | "DISPONIBLE";

export type InventoryItem = {
  idProducto: number;
  codigoBarras: string;
  producto: string;
  idCategoria: number;
  categoria: string;
  stockActual: number;
  stockMinimo: number;
  estadoStock: InventoryStatus;
  controlaVencimiento: boolean;
  cantidadEnLotes: number;
  proximoVencimiento: string | null;
  activo: boolean;
};

export type InventorySummary = {
  totalProductosActivos: number;
  productosSinStock: number;
  productosConStockMinimo: number;
  productosDisponibles: number;
  unidadesDisponibles: number;
  valorInventarioCosto: number;
  valorInventarioVenta: number;
};

export type InventoryMovement = {
  idMovimiento: number;
  idProducto: number;
  producto: string;
  codigoBarras: string;
  idUsuario: number;
  usuario: string;
  tipo: string;
  referenciaId: number | null;
  entrada: number;
  salida: number;
  saldo: number;
  motivo: string | null;
  fecha: string;
};

export type ProductKardex = {
  idProducto: number;
  codigoBarras: string;
  producto: string;
  stockActual: number;
  movimientos: InventoryMovement[];
};

export type InventoryResponse = {
  data: InventoryItem[];
};

export type InventorySummaryResponse = {
  data: InventorySummary;
};

export type KardexResponse = {
  data: ProductKardex;
};
