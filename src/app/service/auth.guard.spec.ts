import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import type { Observable } from 'rxjs';
import { firstValueFrom, Subject } from 'rxjs';

import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';
import type { UserProfile } from './auth.service';

describe('authGuard profile restoration', () => {
  const user: UserProfile = {
    id: 1,
    nombres: 'Ana',
    apellidos: 'Prueba',
    email: 'ana@example.com',
    rol: 'PROPIETARIO',
  };
  let profile: Subject<UserProfile>;
  let auth: {
    currentUser: UserProfile;
    isAuthenticated: ReturnType<typeof vi.fn>;
    getProfile: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    profile = new Subject<UserProfile>();
    auth = { currentUser: { ...user }, isAuthenticated: vi.fn(() => true), getProfile: vi.fn(() => profile) };
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: AuthService, useValue: auth }] });
  });

  function check() {
    return TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
  }

  it('loads the profile before allowing a restored session to enter', async () => {
    const result = firstValueFrom(check() as Observable<boolean>);
    expect(auth.getProfile).toHaveBeenCalledOnce();
    profile.next({ ...user, fotoUrl: 'data:image/png;base64,photo' });
    expect(await result).toBe(true);
  });

  it('does not reload a profile whose photo is already known, including no photo', () => {
    auth.currentUser.fotoUrl = null;
    expect(check()).toBe(true);
    auth.currentUser.fotoUrl = 'data:image/png;base64,photo';
    expect(check()).toBe(true);
    expect(auth.getProfile).not.toHaveBeenCalled();
  });

  it('allows the existing session to enter if the profile request fails', async () => {
    const result = firstValueFrom(check() as Observable<boolean>);
    profile.error(new Error('Connection unavailable'));
    expect(await result).toBe(true);
  });

  it('redirects unauthenticated users without requesting a profile', () => {
    auth.isAuthenticated.mockReturnValue(false);
    expect(check()).toEqual(TestBed.inject(Router).parseUrl('/login'));
    expect(auth.getProfile).not.toHaveBeenCalled();
  });
});
