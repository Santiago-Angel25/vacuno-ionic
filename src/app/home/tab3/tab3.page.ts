import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonGrid, IonRow, IonCol, IonButton, IonContent, IonIcon, IonInput, IonItem, IonSpinner } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { leafOutline, searchOutline } from 'ionicons/icons';
import { finalize, of, switchMap } from 'rxjs';

import { AuthService } from '../../service/auth.service';
import type { InventoryProduct } from '../../service/farm.service';
import { FarmService } from '../../service/farm.service';
import { VacunoHeaderComponent } from '../../shared/vacuno-header/vacuno-header.component';
import { DetailModalComponent } from '../../shared/detail-modal/detail-modal.component';

type InventoryFilter = 'TODOS' | 'MEDICAMENTOS' | 'ALIMENTOS' | 'INSUMOS';

@Component({
  selector: 'app-tab3',
  templateUrl: './tab3.page.html',
  styleUrls: ['./tab3.page.scss'],
  imports: [
    IonGrid,
    IonRow,
    IonCol,
    VacunoHeaderComponent,
    DetailModalComponent,
    RouterLink,
    IonButton,
    IonContent,
    IonIcon,
    IonInput,
    IonItem,
    IonSpinner,
  ],
})
export class Tab3Page {
  private readonly farms = inject(FarmService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  readonly auth = inject(AuthService);
  farmId: number | null = null;
  products: InventoryProduct[] = [];
  selectedProduct: InventoryProduct | null = null;
  filter: InventoryFilter = 'TODOS';
  search = '';
  loading = true;
  errorMessage = '';

  constructor() {
    addIcons({ leafOutline, searchOutline });
  }

  ionViewWillEnter(): void {
    if (this.farmId) {
      this.loadInventory();
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    this.farms
      .myFarms()
      .pipe(
        switchMap((farms) => {
          this.farmId = farms[0]?.id ?? null;
          return this.farmId ? this.farms.inventory(this.farmId) : of([] as InventoryProduct[]);
        }),
        finalize(() => {
          this.loading = false;
          this.changeDetector.markForCheck();
        }),
      )
      .subscribe({
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
    this.farms
      .inventory(this.farmId)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.changeDetector.markForCheck();
        }),
      )
      .subscribe({
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

  setFilter(filter: InventoryFilter): void {
    this.filter = filter;
  }
  displayStock(product: InventoryProduct): number {
    return product.categoria.toUpperCase() === 'ALIMENTOS' ? Math.floor(product.stockActual) : product.stockActual;
  }
  onSearch(event: CustomEvent<{ value?: string | null }>): void {
    this.search = event.detail.value ?? '';
  }
}
