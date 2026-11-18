import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type { PurchaseRequest, Purchase } from '../interfaces/compras.interfaces';

@Injectable({ providedIn: 'root' })
export class ComprasService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

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
}
