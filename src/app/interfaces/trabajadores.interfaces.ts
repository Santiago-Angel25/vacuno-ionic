export interface WorkerRequest {
  fincaId: number;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  fechaNacimiento?: string;
  fotoUrl?: string;
}

export interface WorkerInvite {
  trabajadorId: number;
  email: string;
  codigo: string;
  venceEn: string;
}

export interface WorkerSummary {
  id: number;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string | null;
  activo: boolean;
  actividadesMes: number;
  ultimaActividad: string | null;
  fechaUltimaActividad: string | null;
  fechaNacimiento: string | null;
  fotoUrl: string | null;
}
