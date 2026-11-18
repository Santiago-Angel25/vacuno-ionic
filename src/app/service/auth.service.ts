import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { switchMap, tap } from 'rxjs';
import type { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

import type {
  LoginResponse,
  UserProfile,
  RegisterRequest,
  WorkerActivationResponse,
  ProfileUpdate,
} from '../interfaces/auth.interfaces';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  accessToken: string | null = null;
  private expiresAt = 0;
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
        this.expiresAt = session.expiresAt;
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

  requestPasswordReset(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/recuperar-password`, { email });
  }

  resetPassword(token: string, password: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/restablecer-password`, { token, password });
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/auth/me`).pipe(tap((profile) => (this.currentUser = profile)));
  }

  updateProfile(request: ProfileUpdate): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/auth/me`, request).pipe(
      tap((profile) => {
        this.currentUser = profile;
        this.persistSession();
      }),
    );
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
    this.expiresAt = Date.now() + response.expiresIn * 1000;
    this.persistSession();
  }

  private persistSession(): void {
    localStorage.setItem(
      'vacuno-session',
      JSON.stringify({
        accessToken: this.accessToken,
        currentUser: { ...this.currentUser, fotoUrl: undefined },
        expiresAt: this.expiresAt,
      }),
    );
  }
}
