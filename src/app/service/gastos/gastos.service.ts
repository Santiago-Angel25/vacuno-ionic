import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { FarmExpense } from './gastos.models';

@Injectable({ providedIn: 'root' })
export class GastosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  expenses(farmId: number): Observable<FarmExpense[]> {
    return this.http.get<FarmExpense[]>(`${this.apiUrl}/gastos`, { params: { fincaId: farmId } });
  }
}
