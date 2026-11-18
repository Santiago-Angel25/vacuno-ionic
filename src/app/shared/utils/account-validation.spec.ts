import { FincaService } from '../../service/finca.service';
import { TrabajadoresService } from '../../service/trabajadores.service';
import { FormControl } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { throwError } from 'rxjs';

import { birthDateValidator, passwordPattern, phoneDigits, phonePattern } from './account-validation';
import { localDate } from './task-due-date';
import { RegistroPage } from '../../pages/registro/registro.page';
import { TrabajadoresPage } from '../../pages/trabajadores/trabajadores.page';
import { AuthService } from '../../service/auth.service';
describe('Account validation', () => {
  it('accepts exactly ten ASCII digits and preserves leading zeroes', () => {
    expect(phonePattern.test('0123456789')).toBe(true);
    for (const value of ['123', '12345678901', '123456789a', '+573001234567'])
      expect(phonePattern.test(value)).toBe(false);
    expect(phoneDigits('012-345 abc 678901')).toBe('0123456789');
    expect(phoneDigits(null)).toBe('');
  });
  it('requires a number and a special character, not a space or accented letter', () => {
    expect(passwordPattern.test('Vacuno123!')).toBe(true);
    for (const value of ['Vacuno123', 'Vacuno!!!', 'Vacuno12 ', 'Vacuno12ñ'])
      expect(passwordPattern.test(value)).toBe(false);
  });
  it('rejects future and invalid dates, but accepts today and an optional empty value', () => {
    expect(birthDateValidator(new FormControl(localDate()))).toBeNull();
    expect(birthDateValidator(new FormControl(''))).toBeNull();
    const future = new Date();
    future.setDate(future.getDate() + 1);
    expect(birthDateValidator(new FormControl(localDate(future)))).toEqual({ birthDate: true });
    expect(birthDateValidator(new FormControl('2025-02-30'))).toEqual({ birthDate: true });
  });
});

describe('Registration and worker forms', () => {
  let auth: { register: ReturnType<typeof vi.fn> };
  let farms: { inviteWorker: ReturnType<typeof vi.fn> };
  beforeEach(() => {
    const conflict = () => throwError(() => ({ status: 409, error: { detail: 'El correo ya existe.' } }));
    auth = { register: vi.fn(conflict) };
    farms = { inviteWorker: vi.fn(conflict) };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: FincaService, useValue: farms },
        { provide: TrabajadoresService, useValue: farms },
        { provide: ToastController, useValue: {} },
      ],
    });
  });
  it('enforces the registration policy and displays an existing email error', () => {
    const page = TestBed.createComponent(RegistroPage).componentInstance;
    page.form.patchValue({
      nombres: 'Ana',
      apellidos: 'Prueba',
      email: 'ana@example.com',
      telefono: '3001234567',
      password: 'Vacuno123!',
      finca: 'Finca',
      aceptaTerminos: true,
    });
    expect(page.form.valid).toBe(true);
    page.form.controls.password.setValue('password123');
    page.submit();
    expect(auth.register).not.toHaveBeenCalled();
    page.form.controls.password.setValue('Vacuno123!');
    page.submit();
    expect(page.form.controls.email.hasError('exists')).toBe(true);
    expect(page.form.controls.email.touched).toBe(true);
    page.form.controls.email.setValue('otra@example.com');
    expect(page.form.controls.email.valid).toBe(true);
  });
  it('blocks invalid worker phone and birth date, and displays duplicate emails', () => {
    const page = TestBed.createComponent(TrabajadoresPage).componentInstance;
    page.farmId = 1;
    page.form.patchValue({
      nombres: 'Juan',
      apellidos: 'Prueba',
      email: 'juan@example.com',
      telefono: '123',
      fechaNacimiento: '2999-01-01',
    });
    page.submit();
    expect(farms.inviteWorker).not.toHaveBeenCalled();
    page.form.patchValue({ telefono: '3001234567', fechaNacimiento: '2000-01-01' });
    page.submit();
    expect(page.form.controls.email.hasError('exists')).toBe(true);
    expect(page.form.controls.email.touched).toBe(true);
  });
});
