import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type { Animal, AnimalRequest, AnimalHistoryItem } from '../interfaces/animales.interfaces';

@Injectable({ providedIn: 'root' })
export class AnimalesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  animals(farmId: number, sexo?: string, buscar?: string): Observable<Animal[]> {
    return this.http.get<Animal[]>(`${this.apiUrl}/animales`, {
      params: { fincaId: farmId, ...(sexo ? { sexo } : {}), ...(buscar ? { buscar } : {}) },
    });
  }

  createAnimal(animal: AnimalRequest): Observable<Animal> {
    return this.http.post<Animal>(`${this.apiUrl}/animales`, animal);
  }

  deleteAnimal(farmId: number, animalId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/animales/${animalId}`, { params: { fincaId: farmId } });
  }

  animal(farmId: number, animalId: number): Observable<Animal> {
    return this.http.get<Animal>(`${this.apiUrl}/animales/${animalId}`, { params: { fincaId: farmId } });
  }

  animalHistory(farmId: number, animalId: number): Observable<AnimalHistoryItem[]> {
    return this.http.get<AnimalHistoryItem[]>(`${this.apiUrl}/animales/${animalId}/historial`, {
      params: { fincaId: farmId },
    });
  }

  updateAnimalFollowUp(
    farmId: number,
    animalId: number,
    pesoActual: number,
    estado: string,
    motivoEstado?: string,
  ): Observable<Animal> {
    return this.http.put<Animal>(
      `${this.apiUrl}/animales/${animalId}/seguimiento`,
      { pesoActual, estado, motivoEstado },
      { params: { fincaId: farmId } },
    );
  }
}
