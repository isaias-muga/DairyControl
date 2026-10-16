import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RecepcionesService } from './recepciones';

describe('RecepcionesService', () => {
  let service: RecepcionesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(RecepcionesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('getListado', () => {
    const pedir = (filtro: Parameters<RecepcionesService['getListado']>[0]) => {
      service.getListado(filtro).subscribe();
      return http.expectOne((r) => r.url.endsWith('/Recepciones'));
    };

    it('sends only the range when no other filter is set', () => {
      const req = pedir({ desde: '2026-10-01', hasta: '2026-10-15' });

      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().sort()).toEqual(['desde', 'hasta']);
      expect(req.request.params.get('desde')).toBe('2026-10-01');
      expect(req.request.params.get('hasta')).toBe('2026-10-15');
      req.flush({});
    });

    it('sends every filter that is set', () => {
      const req = pedir({
        desde: '2026-10-01', hasta: '2026-10-15', proveedorId: 'p1', ticket: 4980, soloFueraDeRango: true, pagina: 3,
      });

      expect(req.request.params.get('proveedorId')).toBe('p1');
      expect(req.request.params.get('ticket')).toBe('4980');
      expect(req.request.params.get('soloFueraDeRango')).toBe('true');
      expect(req.request.params.get('pagina')).toBe('3');
      req.flush({});
    });

    it('omits the filters that are off, empty or the first page', () => {
      const req = pedir({
        desde: '2026-10-01', hasta: '2026-10-15', proveedorId: null, ticket: null, soloFueraDeRango: false, pagina: 1,
      });

      expect(req.request.params.keys().sort()).toEqual(['desde', 'hasta']);
      req.flush({});
    });

    it('keeps a ticket of 0 so the API can reject it', () => {
      const req = pedir({ desde: '2026-10-01', hasta: '2026-10-15', ticket: 0 });

      expect(req.request.params.get('ticket')).toBe('0');
      req.flush({});
    });
  });

  it('asks for the suggested next ticket', () => {
    let ticket: number | undefined;

    service.getSiguienteTicket().subscribe((r) => (ticket = r.ticket));
    http.expectOne((r) => r.url.endsWith('/Recepciones/siguiente-ticket')).flush({ ticket: 4981 });

    expect(ticket).toBe(4981);
  });

  it('keeps sending the resumen request', () => {
    service.getResumen('2026-10-01', '2026-10-15', 'p1').subscribe();

    const req = http.expectOne((r) => r.url.endsWith('/Recepciones/resumen'));
    expect(req.request.params.get('proveedorId')).toBe('p1');
    req.flush({});
  });
});
