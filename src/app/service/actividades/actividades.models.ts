export interface FarmActivity {
  id: number;
  tipo: string;
  descripcion: string;
  realizadaEn: string;
  animalId: number | null;
  realizadaPorId: number;
  realizadaPorNombre?: string;
  productoId?: number | null;
  productoNombre?: string | null;
  cantidadPorDosis?: number | null;
  numeroDosis?: number | null;
  fotoUrl?: string | null;
}

export interface ActivityRequest {
  fincaId: number;
  animalId?: number;
  productoId?: number;
  cantidadPorDosis?: number;
  numeroDosis?: number;
  tipo: string;
  descripcion: string;
  fotoUrl?: string | null;
}

export interface FarmTask {
  id: number;
  titulo: string;
  descripcion: string | null;
  fechaLimite: string | null;
  prioridad: string;
  estado: string;
  asignadaAId?: number | null;
}

export interface TaskRequest {
  fincaId: number;
  titulo: string;
  descripcion: string;
  asignadaA: number;
  fechaLimite?: string;
  prioridad: string;
}
