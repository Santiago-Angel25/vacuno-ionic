export interface InventoryProduct {
  id: number;
  nombre: string;
  categoria: string;
  unidad: string;
  fotoUrl: string | null;
  stockMinimo: number;
  stockActual: number;
}

export interface ProductRequest {
  fincaId: number;
  nombre: string;
  categoria: string;
  unidad: string;
  stockMinimo: number;
}
