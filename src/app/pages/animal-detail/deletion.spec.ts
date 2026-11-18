import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../service/auth.service';
import { FincaService } from '../../service/finca.service';
import { AnimalesService } from '../../service/animales.service';
import { TrabajadoresService } from '../../service/trabajadores.service';
import { AnimalDetailPage } from './animal-detail.page';
import { TrabajadorDetallePage } from '../trabajadores/trabajador-detalle.page';

for (const kind of ['animal', 'worker']) {
  describe('Owner deletion of ' + kind, () => {
    let page: AnimalDetailPage | TrabajadorDetallePage;
    let remove: ReturnType<typeof vi.fn>;
    let createAlert: ReturnType<typeof vi.fn>;
    let createToast: ReturnType<typeof vi.fn>;
    let navigate: ReturnType<typeof vi.spyOn>;
    let role: string;
    let auth: { currentUser: { rol: string } };
    beforeEach(() => {
      role = 'confirm';
      auth = { currentUser: { rol: 'PROPIETARIO' } };
      remove = vi.fn(() => of(undefined));
      createAlert = vi.fn(async () => ({ present: vi.fn(), onDidDismiss: async () => ({ role }) }));
      createToast = vi.fn(async () => ({ present: vi.fn() }));
      TestBed.configureTestingModule({
        providers: [
          provideRouter([]),
          { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '2' } } } },
          { provide: AuthService, useValue: auth },
          { provide: FincaService, useValue: {} },
          { provide: AnimalesService, useValue: { deleteAnimal: remove } },
          { provide: TrabajadoresService, useValue: { deleteWorker: remove } },
          { provide: AlertController, useValue: { create: createAlert } },
          { provide: ToastController, useValue: { create: createToast } },
        ],
      });
      navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
      if (kind === 'animal') {
        const animalPage = TestBed.createComponent(AnimalDetailPage).componentInstance;
        animalPage.animal = { id: 2, nombre: 'Luna' } as never;
        page = animalPage;
      } else {
        const workerPage = TestBed.createComponent(TrabajadorDetallePage).componentInstance;
        workerPage.worker = { id: 2, nombres: 'Juan' } as never;
        page = workerPage;
      }
      page.farmId = 7;
    });
    it('does not allow a worker to open the confirmation or delete', async () => {
      auth.currentUser.rol = 'TRABAJADOR';
      await page.confirmDelete();
      expect(page.canDelete).toBe(false);
      expect(createAlert).not.toHaveBeenCalled();
      expect(remove).not.toHaveBeenCalled();
    });
    it('does nothing when confirmation is cancelled', async () => {
      role = 'cancel';
      await page.confirmDelete();
      expect(remove).not.toHaveBeenCalled();
      expect(createToast).not.toHaveBeenCalled();
      expect(page.deleting).toBe(false);
    });
    it('deletes only after confirmation, shows success below and returns to the list', async () => {
      await page.confirmDelete();
      expect(remove).toHaveBeenCalledWith(7, 2);
      expect(createToast).toHaveBeenCalledWith(expect.objectContaining({ position: 'bottom', color: 'success' }));
      expect(navigate).toHaveBeenCalledWith(kind === 'animal' ? '/tabs/ganado' : '/tabs/trabajadores', {
        replaceUrl: true,
      });
      expect(page.deleting).toBe(false);
    });
    it('does not show success or navigate when the server rejects deletion', async () => {
      remove.mockReturnValue(throwError(() => ({ error: { detail: 'Sin permisos' } })));
      await page.confirmDelete();
      expect(page.errorMessage).toBe('Sin permisos');
      expect(createToast).not.toHaveBeenCalled();
      expect(navigate).not.toHaveBeenCalled();
      expect(page.deleting).toBe(false);
    });
  });
}
