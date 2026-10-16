import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { MatTooltip } from '@angular/material/tooltip';
import { Resumen } from './resumen';
import { ResumenRecepciones } from '../../models/resumen';
import { diasEnRango, hoyEnPlanta, rangoDePeriodo, sumarDias } from '../../utils/periodos';

registerLocaleData(localeEsAr);

const totalesVacios = {
  litros: 0,
  cantidadRecepciones: 0,
  litrosPromedioPorRecepcion: 0,
  temperaturaPromedio: 0,
  temperaturaMinima: 0,
  temperaturaMaxima: 0,
  acidezPromedio: 0,
  acidezMinima: 0,
  acidezMaxima: 0,
  grasaPromedio: null,
  cantidadConGrasa: 0,
  cantidadFueraDeRango: 0,
  litrosPeriodoAnterior: 0,
};

const resumenVacio = (desde: string, hasta: string): ResumenRecepciones => ({
  desde,
  hasta,
  desdeAnterior: '2026-08-02',
  hastaAnterior: '2026-08-31',
  totales: { ...totalesVacios },
  proveedores: [],
  dias: [],
});

const resumenConDatos = (desde: string, hasta: string, fuera = 3): ResumenRecepciones => ({
  ...resumenVacio(desde, hasta),
  totales: {
    litros: 1500,
    cantidadRecepciones: 2,
    litrosPromedioPorRecepcion: 750,
    temperaturaPromedio: 7.1,
    temperaturaMinima: 4.2,
    temperaturaMaxima: 22.1,
    acidezPromedio: 17.6,
    acidezMinima: 15,
    acidezMaxima: 21,
    grasaPromedio: null,
    cantidadConGrasa: 0,
    cantidadFueraDeRango: fuera,
    litrosPeriodoAnterior: 1000,
  },
  proveedores: [
    { proveedorId: 'a', nombre: 'Tambo Norte', litros: 1000, cantidadRecepciones: 1, acidezPromedio: 17, cantidadFueraDeRango: 2 },
    { proveedorId: 'b', nombre: 'Tambo Sur', litros: 500, cantidadRecepciones: 1, acidezPromedio: 18, cantidadFueraDeRango: 0 },
  ],
  dias: [{ fecha: desde, litros: 1500, cantidadRecepciones: 2 }],
});

describe('Resumen', () => {
  let fixture: ComponentFixture<Resumen>;
  let http: HttpTestingController;

  const esResumen = (r: TestRequest['request']) => r.url.endsWith('/Recepciones/resumen');
  const resumenPendiente = () => http.expectOne((r) => esResumen(r));
  const pendienteProveedores = () => http.expectOne((r) => r.url.endsWith('/Proveedores'));

  const el = () => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Resumen],
      providers: [
        { provide: LOCALE_ID, useValue: 'es-AR' }, // same as app.config.ts
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Resumen);
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  it('loads the current month (plant time) with no supplier filter by default', () => {
    const { desde, hasta } = rangoDePeriodo('mes', hoyEnPlanta());

    const req = resumenPendiente();
    expect(req.request.params.get('desde')).toBe(desde);
    expect(req.request.params.get('hasta')).toBe(hasta);
    expect(req.request.params.has('proveedorId')).toBe(false);
    req.flush(resumenVacio(desde, hasta));
    pendienteProveedores().flush([]);
  });

  it('shows "Todos" selected in the supplier select by default', async () => {
    const { desde, hasta } = rangoDePeriodo('mes', hoyEnPlanta());
    resumenPendiente().flush(resumenVacio(desde, hasta));
    pendienteProveedores().flush([]);
    await fixture.whenStable();

    expect(el().querySelector('mat-select')?.textContent).toContain('Todos');
  });

  it('shows the empty state when the period has no deliveries', async () => {
    const { desde, hasta } = rangoDePeriodo('mes', hoyEnPlanta());
    resumenPendiente().flush(resumenVacio(desde, hasta));
    pendienteProveedores().flush([]);
    await fixture.whenStable();

    expect(el().textContent).toContain('No hay recepciones en este período.');
  });

  it('shows the API error message on a 400', async () => {
    resumenPendiente().flush(
      { error: 'El período no puede superar los 366 días.' },
      { status: 400, statusText: 'Bad Request' },
    );
    pendienteProveedores().flush([]);
    await fixture.whenStable();

    expect(el().textContent).toContain('El período no puede superar los 366 días.');
  });

  it('requests the new range when a period is selected', () => {
    const { desde, hasta } = rangoDePeriodo('mes', hoyEnPlanta());
    resumenPendiente().flush(resumenVacio(desde, hasta));
    pendienteProveedores().flush([]);

    fixture.componentInstance['seleccionarPeriodo']('dia');

    const hoy = hoyEnPlanta();
    const req = resumenPendiente();
    expect(req.request.params.get('desde')).toBe(hoy);
    expect(req.request.params.get('hasta')).toBe(hoy);
    req.flush(resumenVacio(hoy, hoy));
    expect(fixture.componentInstance.periodo()).toBe('dia');
  });

  it('sends the proveedorId when a supplier is selected and omits it for "Todos"', () => {
    const { desde, hasta } = rangoDePeriodo('mes', hoyEnPlanta());
    resumenPendiente().flush(resumenVacio(desde, hasta));
    pendienteProveedores().flush([{ id: 'a', nombre: 'Tambo Norte', cantidadRecepciones: 3 }]);
    const component = fixture.componentInstance;

    component['proveedorControl'].setValue('a');
    component['proveedorCambiado']();
    const filtrada = resumenPendiente();
    expect(filtrada.request.params.get('proveedorId')).toBe('a');
    filtrada.flush(resumenVacio(desde, hasta));
    expect(component['subtitulo']()).toContain('Tambo Norte');

    component['proveedorControl'].setValue('todos');
    component['proveedorCambiado']();
    const todos = resumenPendiente();
    expect(todos.request.params.has('proveedorId')).toBe(false);
    todos.flush(resumenVacio(desde, hasta));
    expect(component['subtitulo']()).toContain('todos los proveedores');
  });

  it('requests a custom range from the date range field and clears the period toggle', () => {
    const { desde, hasta } = rangoDePeriodo('mes', hoyEnPlanta());
    resumenPendiente().flush(resumenVacio(desde, hasta));
    pendienteProveedores().flush([]);
    const component = fixture.componentInstance;

    component['rangoForm'].setValue({ inicio: new Date(2026, 0, 5), fin: new Date(2026, 0, 20) });
    component['rangoPersonalizadoCambiado']();

    const req = resumenPendiente();
    expect(req.request.params.get('desde')).toBe('2026-01-05');
    expect(req.request.params.get('hasta')).toBe('2026-01-20');
    req.flush(resumenVacio('2026-01-05', '2026-01-20'));
    expect(component.periodo()).toBeNull();
  });

  it('does not call the API for a custom range over 366 days', async () => {
    const { desde, hasta } = rangoDePeriodo('mes', hoyEnPlanta());
    resumenPendiente().flush(resumenVacio(desde, hasta));
    pendienteProveedores().flush([]);
    const component = fixture.componentInstance;

    component['rangoForm'].setValue({ inicio: new Date(2025, 0, 1), fin: new Date(2026, 5, 1) });
    component['rangoPersonalizadoCambiado']();
    await fixture.whenStable();

    http.expectNone((r) => esResumen(r));
    expect(el().textContent).toContain('El período no puede superar los 366 días.');
  });

  describe('with deliveries', () => {
    beforeEach(async () => {
      const { desde, hasta } = rangoDePeriodo('mes', hoyEnPlanta());
      resumenPendiente().flush(resumenConDatos(desde, hasta));
      pendienteProveedores().flush([]);
      await fixture.whenStable();
    });

    it('shows the increase against the previous period with the compared range as tooltip', () => {
      const variacion = el().querySelector('.variacion') as HTMLElement;

      expect(variacion.textContent).toContain('▲');
      expect(variacion.textContent).toContain('50,0 % vs. período anterior');
      expect(variacion.classList).toContain('sube');
      expect(variacion.getAttribute('title')).toBe('Comparado con 02/08/2026 – 31/08/2026');
    });

    it('shows min/max, a dash for missing fat and highlights out-of-range', () => {
      const text = el().textContent as string;

      expect(text).toContain('mín. 4,2 · máx. 22,1');
      expect(text).toContain('—');
      expect(el().querySelector('.fuera-de-rango')).toBeTruthy();
      expect(text).toContain('temperatura, acidez o agua sobre el límite');
    });

    it('renders the ranking with shares and out-of-range counts', () => {
      const filas = el().querySelectorAll('tr.mat-mdc-row');

      expect(filas.length).toBe(2);
      expect(filas[0].textContent).toContain('Tambo Norte');
      expect(filas[0].textContent).toContain('66,7 %');
      expect(filas[0].querySelector('.alerta')?.textContent?.trim()).toBe('2');
      expect(filas[1].querySelector('.alerta')).toBeNull();
    });

    it('renders an accessible bar chart with a tooltip on each bar', () => {
      const grafico = el().querySelector('.grafico-cuerpo') as HTMLElement;

      expect(grafico.getAttribute('role')).toBe('group');

      expect(grafico.getAttribute('aria-label')).toContain('Litros por día');
      const barras = el().querySelectorAll('.barra');
      const { desde, hasta } = rangoDePeriodo('mes', hoyEnPlanta());
      expect(barras.length).toBe(diasEnRango(desde, hasta)); // only the days elapsed so far
      expect(barras[0].getAttribute('title')).toMatch(/^\d{2}\/\d{2}\/\d{4}: /);
    });

    describe('links to the recepciones list', () => {
      const { desde, hasta } = rangoDePeriodo('mes', hoyEnPlanta());

      it('opens the list for that day when a day bar is clicked', () => {
        const barras = Array.from(el().querySelectorAll('a.barra')) as HTMLAnchorElement[];

        expect(barras).toHaveLength(diasEnRango(desde, hasta));
        expect(barras[0].getAttribute('href')).toBe(`/recepciones?desde=${desde}&hasta=${desde}`);
        if (barras.length > 1) {
          const siguiente = sumarDias(desde, 1);
          expect(barras[1].getAttribute('href')).toBe(`/recepciones?desde=${siguiente}&hasta=${siguiente}`);
        }
        expect(barras[0].getAttribute('aria-label')).toMatch(/^Ver recepciones\. /);
      });

      it('opens the list for that proveedor and the current period when a ranking row is clicked', () => {
        const enlaces = Array.from(el().querySelectorAll('tr.mat-mdc-row a.proveedor-link')) as HTMLAnchorElement[];

        expect(enlaces.map((a) => a.textContent?.trim())).toEqual(['Tambo Norte', 'Tambo Sur']);
        expect(enlaces[0].getAttribute('href')).toBe(`/recepciones?desde=${desde}&hasta=${hasta}&proveedor=a`);
        expect(enlaces[1].getAttribute('href')).toBe(`/recepciones?desde=${desde}&hasta=${hasta}&proveedor=b`);
      });

      it('uses the period selected in the page, not the default one', async () => {
        const component = fixture.componentInstance;
        component['rangoForm'].setValue({ inicio: new Date(2026, 8, 1), fin: new Date(2026, 8, 30) });
        component['rangoPersonalizadoCambiado']();
        resumenPendiente().flush(resumenConDatos('2026-09-01', '2026-09-30'));
        await fixture.whenStable();
        fixture.detectChanges();

        const enlace = el().querySelector('tr.mat-mdc-row a.proveedor-link') as HTMLAnchorElement;

        expect(enlace.getAttribute('href')).toBe('/recepciones?desde=2026-09-01&hasta=2026-09-30&proveedor=a');
      });

      it('links a month bar to the days of that month inside the period when the chart groups by month', async () => {
        const component = fixture.componentInstance;
        component['rangoForm'].setValue({ inicio: new Date(2025, 0, 15), fin: new Date(2025, 11, 31) });
        component['rangoPersonalizadoCambiado']();
        resumenPendiente().flush(resumenConDatos('2025-01-15', '2025-12-31'));
        await fixture.whenStable();
        fixture.detectChanges();

        const barras = Array.from(el().querySelectorAll('a.barra')) as HTMLAnchorElement[];

        expect(barras[0].getAttribute('href')).toBe('/recepciones?desde=2025-01-15&hasta=2025-01-31');
        expect(barras[11].getAttribute('href')).toBe('/recepciones?desde=2025-12-01&hasta=2025-12-31');
      });
    });

    describe('ranking table conventions', () => {
      it('uses a fixed layout with percentage widths inside a scrollable container', () => {
        const tabla = el().querySelector('.table-wrapper table') as HTMLElement;
        const ancho = (columna: string) =>
          getComputedStyle(el().querySelector(`th.mat-column-${columna}`) as HTMLElement).width;

        expect(getComputedStyle(tabla).tableLayout).toBe('fixed');
        expect(getComputedStyle(tabla).minWidth).toBe('860px');
        expect([ancho('litros'), ancho('participacion'), ancho('recepciones'), ancho('fueraDeRango')]).toEqual([
          '14%', '28%', '12%', '14%',
        ]);
        expect(ancho('nombre')).toBe('auto');
      });

      it('shows short headers with the full name as tooltip and aria-label', () => {
        const encabezados = fixture.debugElement.queryAll(By.css('.ranking th'));

        expect(encabezados.map((th) => th.nativeElement.textContent.trim())).toEqual([
          'Proveedor', 'Litros', 'Particip.', 'Recep.', 'Fuera rango',
        ]);
        expect(encabezados.map((th) => th.nativeElement.getAttribute('aria-label'))).toEqual([
          'Proveedor', 'Litros', 'Participación', 'Recepciones', 'Fuera de rango',
        ]);
        expect(encabezados.map((th) => th.injector.get(MatTooltip, null)?.message ?? null)).toEqual([
          null, null, 'Participación', 'Recepciones', 'Fuera de rango',
        ]);
      });

      it('right-aligns the quantities, each header like its column, and keeps the cells on one line', () => {
        for (const columna of ['litros', 'recepciones', 'fueraDeRango']) {
          for (const celda of Array.from(el().querySelectorAll(`.ranking .mat-column-${columna}`))) {
            expect(getComputedStyle(celda).textAlign).toBe('right');
          }
        }
        expect(getComputedStyle(el().querySelector('td.mat-column-nombre') as HTMLElement).whiteSpace).toBe('nowrap');
      });

      it('shows the full proveedor name as a tooltip on its link', () => {
        const enlace = fixture.debugElement.query(By.css('tr.mat-mdc-row a.proveedor-link'));

        expect(enlace.injector.get(MatTooltip).message).toBe('Ver las recepciones de Tambo Norte');
      });

      it('uses the same padding on the first and last column, header included', () => {
        const estilo = (selector: string) => getComputedStyle(el().querySelector(selector) as HTMLElement);

        for (const [primera, ultima] of [
          ['th.mat-column-nombre', 'th.mat-column-fueraDeRango'],
          ['td.mat-column-nombre', 'td.mat-column-fueraDeRango'],
        ]) {
          expect(estilo(primera).paddingLeft).toBe('16px');
          expect(estilo(ultima).paddingRight).toBe('16px');
        }
      });
    });
  });

  it('does not highlight the out-of-range card when there are none', async () => {
    const { desde, hasta } = rangoDePeriodo('mes', hoyEnPlanta());
    resumenPendiente().flush(resumenConDatos(desde, hasta, 0));
    pendienteProveedores().flush([]);
    await fixture.whenStable();

    expect(el().querySelector('.fuera-de-rango')).toBeNull();
  });

  it('titles the chart "Litros por mes" for ranges over 62 days', async () => {
    const component = fixture.componentInstance;
    const { desde, hasta } = rangoDePeriodo('mes', hoyEnPlanta());
    resumenPendiente().flush(resumenVacio(desde, hasta));
    pendienteProveedores().flush([]);

    component['rangoForm'].setValue({ inicio: new Date(2025, 0, 1), fin: new Date(2025, 11, 31) });
    component['rangoPersonalizadoCambiado']();
    resumenPendiente().flush(resumenConDatos('2025-01-01', '2025-12-31'));
    await fixture.whenStable();

    expect(el().textContent).toContain('Litros por mes');
    expect(el().querySelectorAll('.barra').length).toBe(12);
  });
});
