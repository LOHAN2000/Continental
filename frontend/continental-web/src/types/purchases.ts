export type PurchaseDetailForm = {
  idProducto: number;
  cantidad: number;
  costoUnitario: number;
  codigoLote: string;
  fechaVencimiento: string;
};

export type PurchaseFormData = {
  idProveedor: number;
  observacion: string;
  detalles: PurchaseDetailForm[];
};

export type PurchaseDetail = {
  idCompraDetalle: number;
  idProducto: number;
  producto: string;
  codigoBarras: string;
  cantidad: number;
  costoUnitario: number;
  subtotal: number;
};

export type Purchase = {
  idCompra: number;
  idProveedor: number;
  proveedor: string;
  idUsuario: number;
  usuario: string;
  fecha: string;
  total: number;
  estado: string;
  observacion: string | null;
  detalles: PurchaseDetail[];
};

export type PurchasesResponse = {
  data: Purchase[];
};

export type PurchaseResponse = {
  message: string;
  data: Purchase;
};