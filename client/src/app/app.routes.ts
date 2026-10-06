import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { ProveedoresList } from './pages/proveedores-list/proveedores-list';
import { ProveedorDetail } from './pages/proveedor-detail/proveedor-detail';
export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'proveedores', component: ProveedoresList },
  { path: 'proveedores/:id', component: ProveedorDetail },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
];
