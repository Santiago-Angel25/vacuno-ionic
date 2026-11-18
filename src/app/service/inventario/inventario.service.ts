import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { InventoryProduct, ProductRequest } from './inventario.models';

@Injectable({ providedIn: 'root' })
export class InventarioService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  inventory(farmId: number): Observable<InventoryProduct[]> {
    return this.http.get<InventoryProduct[]>(`${this.apiUrl}/inventario`, {
      params: { fincaId: farmId },
    });
  }

  createProduct(product: ProductRequest): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.apiUrl}/inventario/productos`, product);
  }
}
