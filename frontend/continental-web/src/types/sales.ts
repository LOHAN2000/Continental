export type SaleCartItem = {
  idProducto: number;
  codigoBarras: string;
  nombre: string;
  precioUnitario: number;
  stockDisponible: number;
  cantidad: number;
};

export type CreateSaleData = {
  observacion: string;
  detalles: Array<{
    idProducto: number;
    cantidad: number;
  }>;
};

export type SaleDetail = {
  idVentaDetalle: number;
  idProducto: number;
  producto: string;
  codigoBarras: string;
  idLote: number | null;
  codigoLote: string | null;
  cantidad: number;
  precioUnitario: number;
  costoHistoricoUnitario: number;
  subtotal: number;
  costoHistoricoTotal: number;
  margenBrutoEstimado: number;
};

export type Sale = {
  idVenta: number;
  idUsuario: number;
  usuario: string;
  fecha: string;
  total: number;
  costoHistoricoTotal: number;
  margenBrutoEstimado: number;
  estado: string;
  observacion: string | null;
  detalles: SaleDetail[];
};

export type SalesResponse = {
  data: Sale[];
};

export type SaleResponse = {
  message: string;
  data: Sale;
};
