export type BalanceProduct = {
  idProducto: number;
  producto: string;
  cantidadVendida: number;
  ingresos: number;
  costoHistorico: number;
  margenBrutoEstimado: number;
};

export type FinancialBalance = {
  fechaInicio: string;
  fechaFin: string;
  cantidadVentas: number;
  ingresosPorVentas: number;
  costoHistoricoVendido: number;
  margenBrutoEstimado: number;
  porcentajeMargenBruto: number;
  productos: BalanceProduct[];
};

export type TopSellingProduct = {
  idProducto: number;
  producto: string;
  codigoBarras: string;
  cantidadVendida: number;
  importeVendido: number;
};

export type BalanceResponse = {
  data: FinancialBalance;
};

export type TopProductsResponse = {
  data: TopSellingProduct[];
};
