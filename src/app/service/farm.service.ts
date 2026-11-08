import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface FarmSummary {
  id: number;
  nombre: string;
  direccion: string;
  rol: string;
}

export interface DashboardResponse {
  ganado: { total: number; saludables: number; enAtencion: number; pesoPromedio: number };
  inventario: { stockBajo: number };
  tareas: { pendientes: number; completadas: number };
  necesidades: { abiertas: number };
  finanzas: { totalMes: number };
  proximosControles: { descripcion: string; proximoControl: string; tipo: string }[];
}

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

export interface FarmExpense {
  id: number;
  categoria: string;
  descripcion: string;
  monto: number;
  fecha: string;
}

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
}

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

export interface AnimalHistoryItem {
  id: number;
  tipoRegistro: string;
  tipo: string;
  descripcion: string;
  fecha: string;
}

@Injectable({ providedIn: 'root' })
export class FarmService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  myFarms(): Observable<FarmSummary[]> {
    return this.http.get<FarmSummary[]>(`${this.apiUrl}/fincas`);
  }

  dashboard(farmId: number): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(`${this.apiUrl}/reportes/dashboard`, {
      params: { fincaId: farmId },
    });
  }

  animals(farmId: number, sexo?: string, buscar?: string): Observable<Animal[]> {
    return this.http.get<Animal[]>(`${this.apiUrl}/animales`, {
      params: { fincaId: farmId, ...(sexo ? { sexo } : {}), ...(buscar ? { buscar } : {}) },
    });
  }

  createAnimal(animal: AnimalRequest): Observable<Animal> {
    return this.http.post<Animal>(`${this.apiUrl}/animales`, animal);
  }

  animal(farmId: number, animalId: number): Observable<Animal> {
    return this.http.get<Animal>(`${this.apiUrl}/animales/${animalId}`, { params: { fincaId: farmId } });
  }

  animalHistory(farmId: number, animalId: number): Observable<AnimalHistoryItem[]> {
    return this.http.get<AnimalHistoryItem[]>(`${this.apiUrl}/animales/${animalId}/historial`, {
      params: { fincaId: farmId },
    });
  }

  updateAnimalFollowUp(farmId: number, animalId: number, pesoActual: number, estado: string): Observable<Animal> {
    return this.http.put<Animal>(
      `${this.apiUrl}/animales/${animalId}/seguimiento`,
      { pesoActual, estado },
      { params: { fincaId: farmId } },
    );
  }

  activities(farmId: number): Observable<FarmActivity[]> {
    return this.http.get<FarmActivity[]>(`${this.apiUrl}/actividades`, { params: { fincaId: farmId } });
  }

  createActivity(activity: ActivityRequest): Observable<FarmActivity> {
    return this.http.post<FarmActivity>(`${this.apiUrl}/actividades`, activity);
  }

  myTasks(farmId: number): Observable<FarmTask[]> {
    return this.http.get<FarmTask[]>(`${this.apiUrl}/tareas/mias`, { params: { fincaId: farmId } });
  }

  workers(farmId: number): Observable<WorkerSummary[]> {
    return this.http.get<WorkerSummary[]>(`${this.apiUrl}/trabajadores`, { params: { fincaId: farmId } });
  }

  inviteWorker(worker: WorkerRequest): Observable<WorkerInvite> {
    return this.http.post<WorkerInvite>(`${this.apiUrl}/trabajadores`, worker);
  }

  workerActivities(farmId: number, workerId: number): Observable<FarmActivity[]> {
    return this.http.get<FarmActivity[]>(`${this.apiUrl}/trabajadores/${workerId}/actividades`, {
      params: { fincaId: farmId },
    });
  }

  inventory(farmId: number): Observable<InventoryProduct[]> {
    return this.http.get<InventoryProduct[]>(`${this.apiUrl}/inventario`, {
      params: { fincaId: farmId },
    });
  }

  createProduct(product: ProductRequest): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.apiUrl}/inventario/productos`, product);
  }

  purchases(farmId: number): Observable<Purchase[]> {
    return this.http.get<Purchase[]>(`${this.apiUrl}/compras`, { params: { fincaId: farmId } });
  }

  purchase(farmId: number, purchaseId: number): Observable<Purchase> {
    return this.http.get<Purchase>(`${this.apiUrl}/compras/${purchaseId}`, { params: { fincaId: farmId } });
  }

  createPurchase(purchase: PurchaseRequest): Observable<Purchase> {
    return this.http.post<Purchase>(`${this.apiUrl}/compras`, purchase);
  }

  reviewPurchase(farmId: number, purchaseId: number, approve: boolean): Observable<Purchase> {
    const action = approve ? 'aprobar' : 'rechazar';
    return this.http.put<Purchase>(`${this.apiUrl}/compras/${purchaseId}/${action}`, null, {
      params: { fincaId: farmId },
    });
  }

  expenses(farmId: number): Observable<FarmExpense[]> {
    return this.http.get<FarmExpense[]>(`${this.apiUrl}/gastos`, { params: { fincaId: farmId } });
  }
}
