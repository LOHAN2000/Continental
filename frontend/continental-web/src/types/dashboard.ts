export type ProductoCritico = {
  idProducto: number;
  codigoBarras: string;
  producto: string;
  stockActual: number;
  stockMinimo: number;
  estado: "SIN_STOCK" | "STOCK_MINIMO";
};

export type VentaReciente = {
  idVenta: number;
  fecha: string;
  usuario: string;
  total: number;
  margenBrutoEstimado: number;
};

export type DashboardData = {
  fechaInicio: string;
  fechaFin: string;
  productosActivos: number;
  productosSinStock: number;
  productosConStockMinimo: number;
  lotesProximosAVencer: number;
  alertasNoLeidas: number;
  cantidadVentas: number;
  ingresosPorVentas: number;
  costoHistoricoVendido: number;
  margenBrutoEstimado: number;
  valorInventarioCosto: number;
  valorInventarioVenta: number;
  productosCriticos: ProductoCritico[];
  ventasRecientes: VentaReciente[];
};

export type DashboardResponse = {
  data: DashboardData;
};

export type ResumenInventario = {
  totalProductosActivos: number;
  productosSinStock: number;
  productosConStockMinimo: number;
  productosDisponibles: number;
  unidadesDisponibles: number;
  valorInventarioCosto: number;
  valorInventarioVenta: number;
};

export type ResumenInventarioResponse = {
  data: ResumenInventario;
};

export type ResumenAlertas = {
  totalActivas: number;
  stockMinimo: number;
  proximosVencimientos: number;
  noLeidas: number;
};

export type ResumenAlertasResponse = {
  data: ResumenAlertas;
};