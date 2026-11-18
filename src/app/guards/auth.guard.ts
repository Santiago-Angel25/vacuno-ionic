import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../service/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (!auth.isAuthenticated()) return inject(Router).parseUrl('/login');
  if (auth.currentUser?.fotoUrl !== undefined) return true;
  return auth.getProfile().pipe(
    map(() => true),
    catchError(() => of(true)),
  );
};
