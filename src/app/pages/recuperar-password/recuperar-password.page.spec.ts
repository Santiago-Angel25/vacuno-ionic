import { provideHttpClient } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { of, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../../service/auth.service';
import { RecuperarPasswordPage } from './recuperar-password.page';
import { RestablecerPasswordPage } from '../restablecer-password/restablecer-password.page';

describe('Password recovery API', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  });
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    localStorage.clear();
  });

  it('requests a recovery code with the email', () => {
    TestBed.inject(AuthService).requestPasswordReset('ana@example.com').subscribe();
    const request = TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/auth/recuperar-password`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'ana@example.com' });
    request.flush({ message: 'Si el correo está registrado...' });
  });

  it('sends the recovery token and new password without creating a session', () => {
    const auth = TestBed.inject(AuthService);
    auth.resetPassword('code', 'new-password').subscribe();
    const request = TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/auth/restablecer-password`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ token: 'code', password: 'new-password' });
    request.flush({ message: 'Contraseña actualizada.' });
    expect(auth.accessToken).toBeNull();
    expect(localStorage.getItem('vacuno-session')).toBeNull();
  });
});

describe('Password recovery forms', () => {
  let auth: { requestPasswordReset: ReturnType<typeof vi.fn>; resetPassword: ReturnType<typeof vi.fn> };
  let present: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    auth = {
      requestPasswordReset: vi.fn(() => of({ message: 'OK' })),
      resetPassword: vi.fn(() => of({ message: 'OK' })),
    };
    present = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: ToastController, useValue: { create: vi.fn(async () => ({ present })) } },
      ],
    });
  });

  it('requires a valid email before requesting a code', () => {
    const page = TestBed.createComponent(RecuperarPasswordPage).componentInstance;
    page.form.setValue({ email: 'incorrecto' });
    page.submit();
    expect(auth.requestPasswordReset).not.toHaveBeenCalled();
    expect(page.form.controls.email.touched).toBe(true);
  });

  it('shows the generic confirmation and prevents duplicate requests', () => {
    const page = TestBed.createComponent(RecuperarPasswordPage).componentInstance;
    page.form.setValue({ email: 'ana@example.com' });
    page.submit();
    expect(page.sent).toBe(true);
    expect(page.loading).toBe(false);
    page.submit();
    expect(auth.requestPasswordReset).toHaveBeenCalledOnce();
  });

  it('rejects short passwords and mismatched confirmation', () => {
    const page = TestBed.createComponent(RestablecerPasswordPage).componentInstance;
    page.form.setValue({ token: 'code', password: 'short', confirmar: 'short' });
    page.submit();
    expect(auth.resetPassword).not.toHaveBeenCalled();
    page.form.setValue({ token: 'code', password: 'password123', confirmar: 'different123' });
    page.submit();
    expect(page.errorMessage).toContain('no coinciden');
    expect(auth.resetPassword).not.toHaveBeenCalled();
  });

  it('keeps the form available for an expired code', () => {
    auth.resetPassword.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 400, error: { detail: 'El token no es válido o venció.' } })),
    );
    const page = TestBed.createComponent(RestablecerPasswordPage).componentInstance;
    page.form.setValue({ token: 'old-code', password: 'password123', confirmar: 'password123' });
    page.submit();
    expect(page.done).toBe(false);
    expect(page.loading).toBe(false);
    expect(page.errorMessage).toContain('venció');
  });

  it('clears the code and password after a successful reset', async () => {
    const page = TestBed.createComponent(RestablecerPasswordPage).componentInstance;
    page.form.setValue({ token: ' code ', password: 'password123', confirmar: 'password123' });
    page.submit();
    expect(auth.resetPassword).toHaveBeenCalledWith('code', 'password123');
    expect(page.done).toBe(true);
    expect(page.form.getRawValue()).toEqual({ token: '', password: '', confirmar: '' });
    await Promise.resolve();
    expect(present).toHaveBeenCalledOnce();
  });
});
