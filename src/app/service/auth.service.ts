import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { switchMap, tap } from 'rxjs';
import type { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

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
  telefono?: string;
  email: string;
  password: string;
  finca: { nombre: string; direccion?: string };
  aceptaTerminos: boolean;
}

export interface WorkerActivationResponse {
  email: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  accessToken: string | null = null;
  currentUser: LoginResponse['usuario'] | null = null;

  constructor() {
    const saved = localStorage.getItem('vacuno-session');
    if (!saved) return;
    try {
      const session = JSON.parse(saved) as {
        accessToken: string;
        currentUser: LoginResponse['usuario'];
        expiresAt: number;
      };
      if (session.expiresAt > Date.now()) {
        this.accessToken = session.accessToken;
        this.currentUser = session.currentUser;
      } else {
        localStorage.removeItem('vacuno-session');
      }
    } catch {
      localStorage.removeItem('vacuno-session');
    }
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(tap((response) => this.saveSession(response)));
  }

  register(request: RegisterRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/auth/registro-propietario`, request)
      .pipe(tap((response) => this.saveSession(response)));
  }

  activateWorker(codigo: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<WorkerActivationResponse>(`${this.apiUrl}/auth/activar-trabajador`, { codigo, password })
      .pipe(switchMap(({ email }) => this.login(email, password)));
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/auth/me`).pipe(tap((profile) => (this.currentUser = profile)));
  }

  logout(): void {
    this.accessToken = null;
    this.currentUser = null;
    localStorage.removeItem('vacuno-session');
  }

  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }

  private saveSession(response: LoginResponse): void {
    this.accessToken = response.accessToken;
    this.currentUser = response.usuario;
    localStorage.setItem(
      'vacuno-session',
      JSON.stringify({
        accessToken: response.accessToken,
        currentUser: response.usuario,
        expiresAt: Date.now() + response.expiresIn * 1000,
      }),
    );
  }
}
