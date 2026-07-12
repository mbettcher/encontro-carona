import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';
import { PerfilUsuario } from './auth.models';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  const perfis = route.data?.['perfis'] as PerfilUsuario[] | undefined;

  if (perfis && !auth.hasAnyPerfil(perfis)) {
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};
