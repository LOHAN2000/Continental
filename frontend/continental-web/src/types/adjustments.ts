export type AdjustmentType =
  | "ENTRADA"
  | "SALIDA";

export type AdjustmentMovementType =
  | "AJUSTE_ENTRADA"
  | "AJUSTE_SALIDA";

export type CreateAdjustmentData = {
  idProducto: number;
  tipo: AdjustmentType;
  cantidad: number;
  motivo: string;
};

export type Adjustment = {
  idMovimiento: number;
  idProducto: number;
  producto: string;
  codigoBarras: string;
  idUsuario: number;
  usuario: string;
  tipo: AdjustmentMovementType;
  cantidad: number;
  stockAnterior: number;
  stockActual: number;
  motivo: string;
  fecha: string;
};

export type AdjustmentsResponse = {
  data: Adjustment[];
};

export type AdjustmentResponse = {
  message: string;
  data: Adjustment;
};
