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
