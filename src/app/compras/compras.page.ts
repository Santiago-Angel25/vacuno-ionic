import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, checkmarkCircleOutline, receiptOutline } from 'ionicons/icons';
import { finalize, of, switchMap } from 'rxjs';

import { AuthService } from '../service/auth.service';
import { FarmService } from '../service/farm.service';
import type { Purchase } from '../service/farm.service';

@Component({
  selector: 'app-compras',
  templateUrl: './compras.page.html',
  styleUrl: './compras.page.scss',
  imports: [RouterLink, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonSpinner, IonTitle, IonToolbar],
})
export class ComprasPage {
  private readonly farms = inject(FarmService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly auth = inject(AuthService);
  farmId: number | null = null;
  purchases: Purchase[] = [];
  loading = true;
  busyId: number | null = null;
  evidenceId: number | null = null;
  evidenceLoadingId: number | null = null;
  evidenceError = '';
  evidenceErrorId: number | null = null;
  errorMessage = '';

  constructor() {
    addIcons({ add, checkmarkCircleOutline, receiptOutline });
  }

  ionViewWillEnter(): void {
    this.farms
      .myFarms()
      .pipe(
        switchMap((farms) => {
          this.farmId = farms[0]?.id ?? null;
          return this.farmId ? this.farms.purchases(this.farmId) : of([] as Purchase[]);
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (items) => {
          this.purchases = items;
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'No fue posible cargar las compras.';
          this.cdr.markForCheck();
        },
      });
  }

  review(item: Purchase, approve: boolean): void {
    if (!this.farmId || this.busyId) return;
    this.busyId = item.id;
    this.errorMessage = '';
    this.farms
      .reviewPurchase(this.farmId, item.id, approve)
      .pipe(
        finalize(() => {
          this.busyId = null;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (updated) => {
          this.purchases = this.purchases.map((purchase) => (purchase.id === updated.id ? updated : purchase));
          this.cdr.markForCheck();
        },
        error: (error: { error?: { detail?: string } }) => {
          this.errorMessage = error.error?.detail ?? 'No fue posible revisar la compra.';
          this.cdr.markForCheck();
        },
      });
  }

  viewEvidence(item: Purchase): void {
    if (!this.farmId || this.evidenceLoadingId) return;
    if (this.evidenceId === item.id) {
      this.evidenceId = null;
      return;
    }
    this.evidenceLoadingId = item.id;
    this.evidenceError = '';
    this.evidenceErrorId = item.id;
    this.farms
      .purchase(this.farmId, item.id)
      .pipe(
        finalize(() => {
          this.evidenceLoadingId = null;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (detail) => {
          this.purchases = this.purchases.map((purchase) => (purchase.id === detail.id ? detail : purchase));
          this.evidenceId = detail.id;
          this.evidenceErrorId = null;
          this.cdr.markForCheck();
        },
        error: () => {
          this.evidenceError = 'No fue posible cargar las fotos de soporte.';
          this.cdr.markForCheck();
        },
      });
  }

  money(value: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
      value,
    );
  }
}
