export interface Animal {
  id: number;
  fincaId: number;
  identificador: string;
  nombre: string;
  sexo: string;
  raza: string;
  fechaNacimiento: string;
  pesoInicial: number;
  pesoActual: number | null;
  fotoUrl: string;
  observaciones: string;
  estado: string;
}

export interface AnimalRequest {
  fincaId: number;
  nombre: string;
  sexo: string;
  raza: string;
  fechaNacimiento: string;
  pesoInicial: number;
  fotoUrl: string;
  observaciones: string;
  estado: string;
}

export interface AnimalHistoryItem {
  id: number;
  tipoRegistro: string;
  tipo: string;
  descripcion: string;
  fecha: string;
}
