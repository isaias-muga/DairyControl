import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { FiltroRecepciones, ListadoRecepciones, SiguienteTicket } from '../models/recepcion-listado';
import { ResumenRecepciones } from '../models/resumen';

@Injectable({ providedIn: 'root' })
export class RecepcionesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Recepciones`;

  getResumen(desde: string, hasta: string, proveedorId?: string | null): Observable<ResumenRecepciones> {
    let params = new HttpParams().set('desde', desde).set('hasta', hasta);
    if (proveedorId) {
      params = params.set('proveedorId', proveedorId);
    }
    return this.http.get<ResumenRecepciones>(`${this.apiUrl}/resumen`, { params });
  }

  getListado(filtro: FiltroRecepciones): Observable<ListadoRecepciones> {
    let params = new HttpParams().set('desde', filtro.desde).set('hasta', filtro.hasta);
    if (filtro.proveedorId) {
      params = params.set('proveedorId', filtro.proveedorId);
    }
    if (filtro.ticket != null) {
      params = params.set('ticket', filtro.ticket);
    }
    if (filtro.soloFueraDeRango) {
      params = params.set('soloFueraDeRango', true);
    }
    if (filtro.pagina && filtro.pagina > 1) {
      params = params.set('pagina', filtro.pagina);
    }
    return this.http.get<ListadoRecepciones>(this.apiUrl, { params });
  }

  getSiguienteTicket(): Observable<SiguienteTicket> {
    return this.http.get<SiguienteTicket>(`${this.apiUrl}/siguiente-ticket`);
  }
}
