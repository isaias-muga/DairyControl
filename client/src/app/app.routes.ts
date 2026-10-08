import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { ProveedoresList } from './pages/proveedores-list/proveedores-list';
import { ProveedorDetail } from './pages/proveedor-detail/proveedor-detail';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'proveedores', component: ProveedoresList, canActivate: [authGuard] },
  { path: 'proveedores/:id', component: ProveedorDetail, canActivate: [authGuard] },
  { path: '', redirectTo: '/proveedores', pathMatch: 'full' },
];
