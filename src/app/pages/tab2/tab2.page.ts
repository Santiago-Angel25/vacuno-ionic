import type { Animal } from '../../service/animales/animales.models';
import { FincaService } from '../../service/finca/finca.service';
import { AnimalesService } from '../../service/animales/animales.service';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon,
  IonInput,
  IonItem,
  IonSpinner,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  add,
  alertCircleOutline,
  femaleOutline,
  heartOutline,
  informationCircleOutline,
  maleOutline,
  pawOutline,
  scaleOutline,
  searchOutline,
} from 'ionicons/icons';
import { finalize, of, switchMap } from 'rxjs';

import { AuthService } from '../../service/auth/auth.service';
import { VacunoHeaderComponent } from '../../shared/vacuno-header/vacuno-header.component';

type AnimalFilter = 'TODOS' | 'HEMBRA' | 'MACHO' | 'JOVEN';

@Component({
  selector: 'app-tab2',
  templateUrl: './tab2.page.html',
  styleUrls: ['./tab2.page.scss'],
  imports: [
    IonGrid,
    IonRow,
    IonCol,
    VacunoHeaderComponent,
    RouterLink,
    IonButton,
    IonContent,
    IonFab,
    IonFabButton,
    IonIcon,
    IonInput,
    IonItem,
    IonSpinner,
  ],
})
export class Tab2Page {
  private readonly fincaService = inject(FincaService);
  private readonly animalesService = inject(AnimalesService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  readonly auth = inject(AuthService);
  animals: Animal[] = [];
  farmId: number | null = null;
  search = '';
  filter: AnimalFilter = 'TODOS';
  loading = true;
  errorMessage = '';
  private searchTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    addIcons({
      add,
      alertCircleOutline,
      femaleOutline,
      heartOutline,
      informationCircleOutline,
      maleOutline,
      pawOutline,
      scaleOutline,
      searchOutline,
    });
  }

  ionViewWillEnter(): void {
    if (this.farmId) {
      this.loadAnimals();
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    this.fincaService
      .myFarms()
      .pipe(
        switchMap((farms) => {
          this.farmId = farms[0]?.id ?? null;
          return this.farmId
            ? this.animalesService.animals(this.farmId, this.selectedSex, this.search)
            : of<Animal[]>([]);
        }),
        finalize(() => {
          this.loading = false;
          this.changeDetector.markForCheck();
        }),
      )
      .subscribe({
        next: (animals) => {
          this.animals = animals;
          this.changeDetector.markForCheck();
        },
        error: () => {
          this.errorMessage = 'No fue posible cargar el ganado.';
          this.changeDetector.markForCheck();
        },
      });
  }

  get visibleAnimals(): Animal[] {
    if (this.filter !== 'JOVEN') return this.animals;
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 2);
    return this.animals.filter((animal) => animal.fechaNacimiento && new Date(animal.fechaNacimiento) >= cutoff);
  }

  displayId(id: number): string {
    return id.toString().padStart(4, '0');
  }

  onSearch(event: CustomEvent<{ value?: string | null }>): void {
    this.search = event.detail.value?.trim() ?? '';
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.loadAnimals(), 300);
  }

  setFilter(filter: AnimalFilter): void {
    this.filter = filter;
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.loadAnimals();
  }

  loadAnimals(): void {
    if (!this.farmId) return;
    this.loading = true;
    this.errorMessage = '';
    this.changeDetector.markForCheck();
    this.animalesService
      .animals(this.farmId, this.selectedSex, this.search)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.changeDetector.markForCheck();
        }),
      )
      .subscribe({
        next: (animals) => {
          this.animals = animals;
          this.changeDetector.markForCheck();
        },
        error: () => {
          this.errorMessage = 'No fue posible cargar el ganado.';
          this.changeDetector.markForCheck();
        },
      });
  }

  private get selectedSex(): string | undefined {
    return this.filter === 'HEMBRA' || this.filter === 'MACHO' ? this.filter : undefined;
  }
}
