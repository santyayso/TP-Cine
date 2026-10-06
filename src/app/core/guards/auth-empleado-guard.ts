import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const authEmpleadoGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.currentUserData();

  if (user?.rol === "empleado" || user?.rol === "admin") {
    return true;
  }
  console.log("Debes tener rol empleado para acceder a esta ruta")

  return router.createUrlTree(['/principal']);
};