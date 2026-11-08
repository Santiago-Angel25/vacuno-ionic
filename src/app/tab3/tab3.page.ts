import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonInput, IonItem, IonSpinner, IonTitle, IonToolbar } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, leafOutline, searchOutline } from 'ionicons/icons';
import { finalize, of, switchMap } from 'rxjs';

import { AuthService } from '../service/auth.service';
import type { InventoryProduct } from '../service/farm.service';
import { FarmService } from '../service/farm.service';

type InventoryFilter = 'TODOS' | 'MEDICAMENTOS' | 'ALIMENTOS' | 'INSUMOS';

@Component({
  selector: 'app-tab3',
  templateUrl: './tab3.page.html',
  styleUrls: ['./tab3.page.scss'],
  imports: [RouterLink, IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonInput, IonItem, IonSpinner, IonTitle, IonToolbar],
})
export class Tab3Page {
  private readonly farms = inject(FarmService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  readonly auth = inject(AuthService);
  farmId: number | null = null;
  products: InventoryProduct[] = [];
  filter: InventoryFilter = 'TODOS';
  search = '';
  loading = true;
  errorMessage = '';

  constructor() { addIcons({ add, leafOutline, searchOutline }); }

  ionViewWillEnter(): void {
    if (this.farmId) {
      this.loadInventory();
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    this.farms.myFarms().pipe(
      switchMap((farms) => {
        this.farmId = farms[0]?.id ?? null;
        return this.farmId ? this.farms.inventory(this.farmId) : of([] as InventoryProduct[]);
      }),
      finalize(() => {
        this.loading = false;
        this.changeDetector.markForCheck();
      }),
    ).subscribe({
      next: (products) => {
        this.products = products;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.errorMessage = 'No fue posible cargar el inventario.';
        this.changeDetector.markForCheck();
      },
    });
  }

  loadInventory(): void {
    if (!this.farmId) return;
    this.loading = true;
    this.errorMessage = '';
    this.farms.inventory(this.farmId).pipe(finalize(() => {
      this.loading = false;
      this.changeDetector.markForCheck();
    })).subscribe({
      next: (products) => {
        this.products = products;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.errorMessage = 'No fue posible cargar el inventario.';
        this.changeDetector.markForCheck();
      },
    });
  }

  get visibleProducts(): InventoryProduct[] {
    const search = this.search.trim().toLocaleLowerCase();
    return this.products.filter((product) => {
      const matchesSearch = product.nombre.toLocaleLowerCase().includes(search);
      const category = product.categoria.toLocaleUpperCase();
      const matchesCategory = this.filter === 'TODOS' || category.includes(this.filter.slice(0, -1));
      return matchesSearch && matchesCategory;
    });
  }

  setFilter(filter: InventoryFilter): void { this.filter = filter; }
  displayStock(product: InventoryProduct): number {
    return product.categoria.toUpperCase() === 'ALIMENTOS'
      ? Math.floor(product.stockActual)
      : product.stockActual;
  }
  onSearch(event: CustomEvent<{ value?: string | null }>): void { this.search = event.detail.value ?? ''; }
}
