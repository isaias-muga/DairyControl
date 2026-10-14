import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ResumenRecepciones } from '../models/resumen';

@Injectable({ providedIn: 'root' })
export class RecepcionesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Recepciones`;

  getResumen(desde: string, hasta: string): Observable<ResumenRecepciones> {
    const params = new HttpParams().set('desde', desde).set('hasta', hasta);
    return this.http.get<ResumenRecepciones>(`${this.apiUrl}/resumen`, { params });
  }
}
