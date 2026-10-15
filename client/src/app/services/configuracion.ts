import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ActualizarLimitesCalidad, LimitesCalidad } from '../models/configuracion';

@Injectable({ providedIn: 'root' })
export class ConfiguracionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Configuracion`;

  getCalidad(): Observable<LimitesCalidad> {
    return this.http.get<LimitesCalidad>(`${this.apiUrl}/calidad`);
  }

  actualizarCalidad(limites: ActualizarLimitesCalidad): Observable<LimitesCalidad> {
    return this.http.put<LimitesCalidad>(`${this.apiUrl}/calidad`, limites);
  }
}
