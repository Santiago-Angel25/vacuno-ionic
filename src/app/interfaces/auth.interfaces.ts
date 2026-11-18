export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  usuario: UserProfile;
}

export interface UserProfile {
  id: number;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string | null;
  fotoUrl?: string | null;
  rol: string;
}

export interface RegisterRequest {
  nombres: string;
  apellidos: string;
  fechaNacimiento?: string;
  telefono: string;
  fotoUrl?: string;
  email: string;
  password: string;
  finca: { nombre: string; direccion?: string; latitud?: number; longitud?: number };
  aceptaTerminos: boolean;
}

export interface WorkerActivationResponse {
  email: string;
  message: string;
}

export interface ProfileUpdate {
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  fotoUrl?: string;
}
