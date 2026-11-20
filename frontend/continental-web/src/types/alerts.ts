export type AlertType =
  | "STOCK_MINIMO"
  | "PROXIMO_VENCIMIENTO";

export type Alert = {
  idAlerta: number;
  idProducto: number;
  producto: string;
  codigoBarras: string;
  idLote: number | null;
  codigoLote: string | null;
  tipo: AlertType;
  mensaje: string;
  stockActual: number;
  stockMinimo: number;
  fechaVencimiento: string | null;
  leida: boolean;
  activa: boolean;
  createdAt: string;
};

export type AlertsSummary = {
  totalActivas: number;
  stockMinimo: number;
  proximosVencimientos: number;
  noLeidas: number;
};

export type AlertsResponse = {
  data: Alert[];
};

export type AlertResponse = {
  data: Alert;
};

export type AlertsSummaryResponse = {
  data: AlertsSummary;
};

export type AlertActionResponse = {
  message: string;
};
