import { Routes } from '@angular/router';
import { authAdminGuard } from './core/guards/auth-admin-guard';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/principal',
        pathMatch: 'full'
    },
    {
        path: 'principal',
        loadComponent: () => import('./features/principal/principal').then((componente) => componente.Principal)
    },
    {
        path: 'pelicula/:id',
        loadComponent: () => import('./features/detalle-pelicula/detalle-pelicula').then((componente) => componente.DetallePelicula)
    },
    {
        path: 'comprar/datos',
        loadComponent: () => import('./features/compra/datos-compra/datos-compra').then((componente) => componente.DatosCompra)
    },
    {
        path: 'comprar/candy',
        loadComponent: () => import('./features/compra/candy-compra/candy-compra').then((componente) => componente.CandyCompra)
    },
    {
        path: 'comprar/butacas',
        loadComponent: () => import('./features/compra/butacas-compra/butacas-compra').then((componente) => componente.ButacasCompra)
    },
    {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login').then((componente) => componente.LoginComponent)
    },
    {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register').then((componente) => componente.RegisterComponent)
    },
    {
        path: 'comprar/pago',
        loadComponent: () => import('./features/compra/pago-compra/pago-compra').then((componente) => componente.PagoCompra)
    },
    {
        path: 'comprar/pdf',
        loadComponent: () => import('./features/compra/pdf-compra/pdf-compra').then((componente) => componente.PdfCompra)
    },
    {
        path: 'admin/peliculas',
        loadComponent: () => import('./features/admin/admin-peliculas/admin-peliculas').then((componente) => componente.AdminPeliculas),
        canActivate: [authAdminGuard]
    },
    {
        path: 'admin/candy',
        loadComponent: () => import('./features/admin/admin-candy/admin-candy').then((componente) => componente.AdminCandy),
        canActivate: [authAdminGuard]
    },
    {
        path: 'admin/roles',
        loadComponent: () => import('./features/admin/admin-roles/admin-roles').then((componente) => componente.AdminRoles),
        canActivate: [authAdminGuard]
    },
    {
        path: 'admin/cupones',
        loadComponent: () => import('./features/admin/admin-cupones/admin-cupones').then((componente) => componente.AdminCupones),
        canActivate: [authAdminGuard]
    },
    {
        path: 'admin/reportes',
        loadComponent: () => import('./features/admin/admin-reportes/admin-reportes').then((componente) => componente.AdminReportes),
        canActivate: [authAdminGuard]
    },
    {
        path: 'perfil',
        loadComponent: () => import('./features/perfil/perfil-layout/perfil-layout').then((componente) => componente.PerfilLayout),
        canActivate: [authGuard],
        children: [
            { path: '', redirectTo: 'compras', pathMatch: 'full' },
            {
                path: 'compras',
                loadComponent: () => import('./features/perfil/mis-compras/mis-compras').then((componente) => componente.MisCompras)
            },
            {
                path: 'cupones',
                loadComponent: () => import('./features/perfil/mis-cupones/mis-cupones').then((componente) => componente.MisCupones)
            },
        ]
    },
    { path: '**', 
      redirectTo: '/principal' 
    }


];