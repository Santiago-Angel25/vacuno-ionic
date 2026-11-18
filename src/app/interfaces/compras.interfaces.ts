export interface PurchaseItemRequest {
  productoId?: number;
  nombre?: string;
  categoria?: string;
  unidad?: string;
  cantidad: number;
  precioUnitario: number;
}

export interface PurchaseRequest {
  fincaId: number;
  proveedor: string;
  fecha: string;
  observaciones: string;
  facturaFotoUrl: string | null;
  productoFotoUrl: string | null;
  productos: PurchaseItemRequest[];
}

export interface Purchase {
  id: number;
  proveedor: string;
  fecha: string;
  estado: 'PENDIENTE' | 'RECIBIDA' | 'CANCELADA';
  total: number;
  observaciones: string;
  facturaFotoUrl: string;
  productoFotoUrl: string;
  creadaPorId: number;
  productos: { productoId: number; nombre: string; unidad: string; cantidad: number; precioUnitario: number }[];
}
