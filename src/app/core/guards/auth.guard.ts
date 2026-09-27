import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);


  const user = authService.currentUser();
  
  if (user) {
    return true;
  }


  return router.createUrlTree(['/login']);
};