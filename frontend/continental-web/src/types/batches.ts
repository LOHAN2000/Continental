export type BatchStatus =
  | "VIGENTE"
  | "PROXIMO_VENCER"
  | "VENCIDO"
  | "AGOTADO";

export type Batch = {
  idLote: number;
  idProducto: number;
  producto: string;
  codigoBarras: string;
  codigoLote: string;
  cantidadInicial: number;
  cantidadDisponible: number;
  fechaVencimiento: string;
  diasParaVencer: number;
  estado: BatchStatus;
  activo: boolean;
};

export type BatchesResponse = {
  data: Batch[];
};
