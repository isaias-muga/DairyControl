import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Resumen } from './resumen';
import { ResumenRecepciones } from '../../models/resumen';
import { hoyEnPlanta, rangoDePeriodo } from '../../utils/periodos';

const resumenVacio = (desde: string, hasta: string): ResumenRecepciones => ({
  desde,
  hasta,
  totales: {
    litros: 0,
    cantidadRecepciones: 0,
    temperaturaPromedio: 0,
    acidezPromedio: 0,
    grasaPromedio: null,
    cantidadAcidezAlta: 0,
  },
  proveedores: [],
  dias: [],
});

describe('Resumen', () => {
  let fixture: ComponentFixture<Resumen>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Resumen],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Resumen);
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  it('loads the last 30 days (plant time) by default', () => {
    const { desde, hasta } = rangoDePeriodo('ultimos-30', hoyEnPlanta());

    const req = http.expectOne((r) => r.url.endsWith('/Recepciones/resumen'));
    expect(req.request.params.get('desde')).toBe(desde);
    expect(req.request.params.get('hasta')).toBe(hasta);
    req.flush(resumenVacio(desde, hasta));
  });

  it('shows the empty state when the period has no deliveries', async () => {
    const { desde, hasta } = rangoDePeriodo('ultimos-30', hoyEnPlanta());
    http.expectOne((r) => r.url.endsWith('/Recepciones/resumen')).flush(resumenVacio(desde, hasta));
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('No hay recepciones en este período.');
  });

  it('shows the API error message on a 400', async () => {
    http
      .expectOne((r) => r.url.endsWith('/Recepciones/resumen'))
      .flush({ error: 'El período no puede superar los 366 días.' }, { status: 400, statusText: 'Bad Request' });
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('El período no puede superar los 366 días.');
  });

  it('renders the totals, ranking and daily rows when there are deliveries', async () => {
    const { desde, hasta } = rangoDePeriodo('ultimos-30', hoyEnPlanta());
    http.expectOne((r) => r.url.endsWith('/Recepciones/resumen')).flush({
      ...resumenVacio(desde, hasta),
      totales: {
        litros: 1500,
        cantidadRecepciones: 2,
        temperaturaPromedio: 4.5,
        acidezPromedio: 16.2,
        grasaPromedio: null,
        cantidadAcidezAlta: 1,
      },
      proveedores: [
        { proveedorId: 'a', nombre: 'Tambo Norte', litros: 1500, cantidadRecepciones: 2, acidezPromedio: 16.2 },
      ],
      dias: [{ fecha: desde, litros: 1500, cantidadRecepciones: 2 }],
    });
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Tambo Norte');
    expect(text).toContain('—'); // no fat data
    expect(text).not.toContain('No hay recepciones');
  });

  it('requests the new period when a preset is selected', () => {
    http.expectOne((r) => r.url.endsWith('/Recepciones/resumen')).flush(resumenVacio('', ''));

    fixture.componentInstance['seleccionar']('hoy');

    const hoy = hoyEnPlanta();
    const req = http.expectOne((r) => r.url.endsWith('/Recepciones/resumen'));
    expect(req.request.params.get('desde')).toBe(hoy);
    expect(req.request.params.get('hasta')).toBe(hoy);
    req.flush(resumenVacio(hoy, hoy));
  });

  it('does not call the API for an invalid custom range', () => {
    http.expectOne((r) => r.url.endsWith('/Recepciones/resumen')).flush(resumenVacio('', ''));
    const component = fixture.componentInstance;

    component['seleccionar']('personalizado');
    component['form'].setValue({ desde: '2026-10-14', hasta: '2026-10-01' });
    component['aplicarPersonalizado']();

    expect(component['errorRango']()).toContain('desde');
    http.expectNone((r) => r.url.endsWith('/Recepciones/resumen'));
  });
});
