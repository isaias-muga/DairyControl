import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Configuracion } from './configuracion';
import { LimitesCalidad } from '../../models/configuracion';

const limites: LimitesCalidad = {
  acidezMaxima: 19,
  temperaturaMaxima: 20,
  aguaMaxima: 0,
  actualizadoEn: '2026-10-01T00:00:00Z',
};

describe('Configuracion', () => {
  let fixture: ComponentFixture<Configuracion>;
  let component: Configuracion;
  let http: HttpTestingController;

  const esCalidad = (r: { url: string }) => r.url.endsWith('/Configuracion/calidad');

  async function setup(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [Configuracion],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Configuracion);
    component = fixture.componentInstance;
  }

  async function cargarLimites(): Promise<void> {
    http.expectOne(esCalidad).flush(limites);
    await fixture.whenStable();
    fixture.detectChanges();
  }

  afterEach(() => http.verify());

  it('loads the current limits into the form and shows the last modification', async () => {
    await setup();

    await cargarLimites();

    expect(component.form.getRawValue()).toEqual({
      acidezMaxima: 19,
      temperaturaMaxima: 20,
      aguaMaxima: 0,
    });
    expect(fixture.nativeElement.textContent).toContain('Última modificación:');
    expect(fixture.nativeElement.textContent).toContain(
      'Los cambios se aplican de inmediato a todos los informes.',
    );
  });

  it('shows the API error when loading fails', async () => {
    await setup();

    http
      .expectOne(esCalidad)
      .flush({ error: 'Falla' }, { status: 400, statusText: 'Bad Request' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.form-error').textContent).toContain('Falla');
  });

  it.each([
    ['acidezMaxima', 9.9],
    ['acidezMaxima', 30.1],
    ['temperaturaMaxima', -1],
    ['temperaturaMaxima', 40.1],
    ['aguaMaxima', -0.1],
    ['aguaMaxima', 10.1],
  ] as const)('does not save when %s is %s', async (campo, valor) => {
    await setup();
    await cargarLimites();
    component.form.controls[campo].setValue(valor);

    component.guardar();

    http.expectNone(esCalidad);
    expect(component.form.controls[campo].invalid).toBe(true);
  });

  it('sends the three limits with PUT and shows a success snackbar', async () => {
    await setup();
    await cargarLimites();
    const snackBar = TestBed.inject(MatSnackBar);
    const open = vi.spyOn(snackBar, 'open');
    component.form.setValue({ acidezMaxima: 18, temperaturaMaxima: 8, aguaMaxima: 1.5 });

    component.guardar();

    expect(component.saving()).toBe(true);
    const req = http.expectOne(esCalidad);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ acidezMaxima: 18, temperaturaMaxima: 8, aguaMaxima: 1.5 });
    req.flush({
      acidezMaxima: 18,
      temperaturaMaxima: 8,
      aguaMaxima: 1.5,
      actualizadoEn: '2026-10-15T12:00:00Z',
    });

    expect(component.saving()).toBe(false);
    expect(component.actualizadoEn()).toBe('2026-10-15T12:00:00Z');
    expect(open).toHaveBeenCalledWith('Configuración guardada.', 'Cerrar', { duration: 4000 });
  });

  it('shows the API error when saving fails', async () => {
    await setup();
    await cargarLimites();

    component.guardar();
    http
      .expectOne(esCalidad)
      .flush({ error: 'La acidez máxima no es válida.' }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();

    expect(component.saving()).toBe(false);
    expect(component.saveError()).toBe('La acidez máxima no es válida.');
    expect(fixture.nativeElement.querySelector('.form-error').textContent).toContain(
      'La acidez máxima no es válida.',
    );
  });

  it('treats a timestamp without offset as UTC', async () => {
    await setup();

    http.expectOne(esCalidad).flush({ ...limites, actualizadoEn: '2026-10-01T00:00:00' });

    expect(component.ultimaModificacion()).toBe('2026-10-01T00:00:00Z');
  });
});
