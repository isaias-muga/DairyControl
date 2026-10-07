import { HttpClient } from '@angular/common/http';
import { Proveedor } from '../models/proveedor';
import { environment } from '../../environments/environment';
import { inject, Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ProveedoresService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/Proveedores`;

  getAll() {
    return this.http.get<Proveedor[]>(this.baseUrl);
  }

  getById(id: string) {
    return this.http.get<Proveedor>(`${this.baseUrl}/${id}`);
  }
}
