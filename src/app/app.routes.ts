import { Routes } from '@angular/router';
import { Principal } from './features/principal/principal';
import { DetallePelicula } from './features/detalle-pelicula/detalle-pelicula';
import { DatosCompra } from './features/compra/datos-compra/datos-compra';
import { CandyCompra } from './features/compra/candy-compra/candy-compra';
import { ButacasCompra } from './features/compra/butacas-compra/butacas-compra';
import { LoginComponent } from './features/auth/login/login';
import { RegisterComponent } from './features/auth/register/register';
import { PagoCompra } from './features/compra/pago-compra/pago-compra';
import { PdfCompra } from './features/compra/pdf-compra/pdf-compra';
import { AdminPeliculas } from './features/admin/admin-peliculas/admin-peliculas';
import { authAdminGuard } from './core/guards/auth-admin-guard';
import { AdminCandy } from './features/admin/admin-candy/admin-candy';
import { AdminRoles } from './features/admin/admin-roles/admin-roles';
import { AdminCupones } from './features/admin/admin-cupones/admin-cupones';

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/principal',
        pathMatch: 'full'
    },
    {
        path: 'principal',
        component: Principal
    },
    {
        path: 'pelicula/:id',
        component: DetallePelicula
    },
    {
        path: 'comprar/datos',
        component: DatosCompra
    },
    {
        path: 'comprar/candy',
        component: CandyCompra
    },
    {
        path: 'comprar/butacas',
        component: ButacasCompra
    },
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'register',
        component: RegisterComponent
    },
    {
        path: 'comprar/pago',
        component: PagoCompra
    },
    {
        path: 'comprar/pdf',
        component: PdfCompra
    },
    {
        path: 'admin/peliculas',
        component: AdminPeliculas,
        canActivate: [authAdminGuard]
    },
    {
        path: 'admin/candy',
        component: AdminCandy,
        canActivate: [authAdminGuard]
    },
    {
        path: 'admin/roles',
        component: AdminRoles,
        canActivate: [authAdminGuard]
    },
    {
        path: 'admin/cupones',
        component: AdminCupones,
        canActivate: [authAdminGuard]
    }







];
