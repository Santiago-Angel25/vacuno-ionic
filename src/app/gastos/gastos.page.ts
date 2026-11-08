import { DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';
import { finalize, of, switchMap } from 'rxjs';

import { AuthService } from '../service/auth.service';
import { FarmService } from '../service/farm.service';
import type { FarmExpense } from '../service/farm.service';

const COLORS = ['#2c7b3e', '#3989a4', '#e67852', '#e6b544', '#8c9f48', '#8976bd'];

@Component({
  selector: 'app-gastos',
  templateUrl: './gastos.page.html',
  styleUrl: './gastos.page.scss',
  imports: [DecimalPipe, RouterLink, IonButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar],
})
export class GastosPage {
  private readonly farms = inject(FarmService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly auth = inject(AuthService);
  farmId: number | null = null;
  expenses: FarmExpense[] = [];
  month = new Date().toISOString().slice(0, 7);
  loading = true;
  errorMessage = '';

  ionViewWillEnter(): void {
    if (this.auth.currentUser?.rol !== 'PROPIETARIO') {
      this.loading = false;
      return;
    }
    this.farms
      .myFarms()
      .pipe(
        switchMap((farms) => {
          this.farmId = farms[0]?.id ?? null;
          return this.farmId ? this.farms.expenses(this.farmId) : of([] as FarmExpense[]);
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (items) => {
          this.expenses = items;
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'No fue posible cargar los gastos.';
          this.cdr.markForCheck();
        },
      });
  }

  monthChanged(event: Event): void {
    this.month = (event.target as HTMLInputElement).value;
  }

  get monthExpenses(): FarmExpense[] {
    return this.expenses.filter((expense) => expense.fecha?.startsWith(this.month));
  }
  get total(): number {
    return this.monthExpenses.reduce((sum, expense) => sum + Number(expense.monto), 0);
  }
  get categories(): { name: string; total: number; percent: number; color: string }[] {
    const totals = new Map<string, number>();
    this.monthExpenses.forEach((expense) =>
      totals.set(expense.categoria, (totals.get(expense.categoria) ?? 0) + Number(expense.monto)),
    );
    return [...totals]
      .map(([name, total], index) => ({
        name,
        total,
        percent: this.total ? (total * 100) / this.total : 0,
        color: COLORS[index % COLORS.length],
      }))
      .sort((a, b) => b.total - a.total);
  }
  get donut(): string {
    let start = 0;
    const slices = this.categories.map((category) => {
      const end = start + category.percent;
      const slice = `${category.color} ${start}% ${end}%`;
      start = end;
      return slice;
    });
    return `conic-gradient(${slices.join(', ') || '#e8eee7 0 100%'})`;
  }
  money(value: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
      value,
    );
  }
}
