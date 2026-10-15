import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatTooltip } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProveedorDetail } from './proveedor-detail';
import { ProveedorDetalle, Recepcion } from '../../models/proveedor';

registerLocaleData(localeEsAr);

const recepcion = (cambios: Partial<Recepcion>): Recepcion => ({
  id: 'r',
  fechaHora: '2026-10-14T08:18:00',
  litros: 2723,
  grasa: null,
  acidez: 17,
  temperatura: 6.5,
  silo: 3,
  observaciones: null,
  aguaPorcentaje: null,
  ticket: null,
  litrosAPagar: 2723,
  ...cambios,
});

describe('ProveedorDetail', () => {
  let component: ProveedorDetail;
  let fixture: ComponentFixture<ProveedorDetail>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProveedorDetail],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LOCALE_ID, useValue: 'es-AR' },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ProveedorDetail);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('id', 'test-id');
    await fixture.whenStable();
  });

  async function cargar(recepciones: Recepcion[]): Promise<void> {
    const detalle: ProveedorDetalle = { id: 'test-id', nombre: 'Tambo Test', recepciones };
    http.expectOne((r) => r.url.endsWith('/Proveedores/test-id')).flush(detalle);
    await fixture.whenStable();
    fixture.detectChanges();
  }

  const filas = (): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('tr.mat-mdc-row'));
  const celdas = (fila: HTMLElement): string[] =>
    Array.from(fila.querySelectorAll('td')).map((td) => (td.textContent ?? '').trim());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows short one-line headers, with the full name in the tooltip and aria-label', async () => {
    await cargar([recepcion({})]);

    const encabezados = fixture.debugElement.queryAll(By.css('th'));
    const visibles = encabezados.map((th) => th.nativeElement.textContent.trim());
    const completos = encabezados.map((th) => th.nativeElement.getAttribute('aria-label'));
    const tooltips = encabezados.map((th) => th.injector.get(MatTooltip, null)?.message ?? null);

    expect(visibles).toEqual([
      'Fecha', 'Ticket', 'Litros', 'Agua %', 'L. reales', 'Grasa %', 'Acidez °D', 'Temp. °C', 'Silo', 'Obs.',
    ]);
    expect(completos).toEqual([
      'Fecha y hora', 'Ticket', 'Litros', '% agua', 'Litros reales', 'Grasa (%)', 'Acidez', 'Temp. (°C)', 'Silo', 'Observaciones',
    ]);
    // abbreviated headers carry the full name as a tooltip; headers that are already complete don't repeat it
    expect(tooltips).toEqual([
      'Fecha y hora', null, null, '% agua', 'Litros reales', 'Grasa (%)', 'Acidez', 'Temp. (°C)', null, 'Observaciones',
    ]);
  });

  it('shows Ticket after the date and % agua and Litros reales next to Litros', async () => {
    await cargar([recepcion({})]);

    const columnas = Array.from(
      fixture.nativeElement.querySelectorAll('th') as NodeListOf<HTMLElement>,
    ).map((th) => th.getAttribute('aria-label'));

    expect(columnas.slice(0, 5)).toEqual([
      'Fecha y hora',
      'Ticket',
      'Litros',
      '% agua',
      'Litros reales',
    ]);
  });

  it('wraps the table in a horizontally scrollable container', async () => {
    await cargar([recepcion({})]);

    expect(fixture.nativeElement.querySelector('.table-wrapper table.mat-mdc-table')).toBeTruthy();
  });

  it('aligns quantities to the right and identifiers to the center, each header like its column', async () => {
    await cargar([recepcion({ ticket: 4901, observaciones: 'Acidez alta' })]);

    const alineacion = (el: Element) => {
      const clase = el.classList.contains('cantidad')
        ? 'cantidad'
        : el.classList.contains('identificador')
          ? 'identificador'
          : 'texto';
      return clase + ':' + getComputedStyle(el).textAlign;
    };
    const encabezados = Array.from(
      fixture.nativeElement.querySelectorAll('th') as NodeListOf<HTMLElement>,
    );
    const [fila] = filas();
    const celdasFila = Array.from(fila.querySelectorAll('td'));

    // Fecha, Ticket, Litros, Agua %, L. reales, Grasa %, Acidez °D, Temp. °C, Silo, Obs.
    const esperado = [
      'texto:',
      'identificador:center',
      'cantidad:right',
      'cantidad:right',
      'cantidad:right',
      'cantidad:right',
      'cantidad:right',
      'cantidad:right',
      'identificador:center',
      'texto:',
    ];
    expect(encabezados.map(alineacion).map((a) => a.replace(/:(left|start)$/, ':'))).toEqual(esperado);
    expect(celdasFila.map(alineacion).map((a) => a.replace(/:(left|start)$/, ':'))).toEqual(esperado);
  });

  it('shows the observation as a button with the full text as tooltip, and nothing when empty', async () => {
    const larga = 'Entrega con demora por lluvia; el camión llegó tarde y el silo estaba ocupado.';
    await cargar([
      recepcion({ id: 'a', observaciones: larga }),
      recepcion({ id: 'b', observaciones: null }),
    ]);

    const botones = fixture.debugElement.queryAll(By.css('td app-observacion-celda button'));
    const celdasObs = fixture.debugElement.queryAll(By.css('td.mat-column-observaciones'));

    expect(botones).toHaveLength(1);
    expect(botones[0].nativeElement.textContent).toContain(larga);
    expect(botones[0].injector.get(MatTooltip).message).toBe(larga);
    expect(celdasObs).toHaveLength(2);
    expect(celdasObs[1].nativeElement.querySelector('button')).toBeNull();
  });

  it('opens a dialog with the full text, ticket, proveedor and fecha y hora when the observation is clicked', async () => {
    const larga = 'Entrega con demora por lluvia; el camión llegó tarde y el silo estaba ocupado.';
    await cargar([recepcion({ ticket: 4901, observaciones: larga })]);

    (fixture.nativeElement.querySelector('td app-observacion-celda button') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    const dialogo = document.querySelector('mat-dialog-container') as HTMLElement;
    expect(dialogo).toBeTruthy();
    expect(dialogo.textContent).toContain(larga);
    expect(dialogo.textContent).toContain('4901');
    expect(dialogo.textContent).toContain('Tambo Test');
    expect(dialogo.textContent).toContain('14/10/2026 08:18');

    TestBed.inject(MatDialog).closeAll();
  });

  it('uses a fixed layout with percentage widths, so it does not depend on the loaded rows', async () => {
    await cargar([recepcion({ observaciones: null })]);

    const tabla = fixture.nativeElement.querySelector('table') as HTMLElement;
    const ancho = (columna: string) =>
      getComputedStyle(
        fixture.nativeElement.querySelector(`th.mat-column-${columna}`) as HTMLElement,
      ).width;

    expect(getComputedStyle(tabla).tableLayout).toBe('fixed');
    expect(getComputedStyle(tabla).minWidth).toBe('860px');
    expect({
      fechaHora: ancho('fechaHora'),
      ticket: ancho('ticket'),
      litros: ancho('litros'),
      aguaPorcentaje: ancho('aguaPorcentaje'),
      litrosAPagar: ancho('litrosAPagar'),
      grasa: ancho('grasa'),
      acidez: ancho('acidez'),
      temperatura: ancho('temperatura'),
      silo: ancho('silo'),
    }).toEqual({
      fechaHora: '17%',
      ticket: '6%',
      litros: '9%',
      aguaPorcentaje: '8%',
      litrosAPagar: '11%',
      grasa: '9%',
      acidez: '10%',
      temperatura: '10%',
      silo: '4.5%',
    });
    // Observaciones has no explicit width: it takes the rest (15.5%)
    expect(ancho('observaciones')).toBe('auto');
  });

  it('keeps headers and cells on one line, vertically centered, with the same vertical padding', async () => {
    await cargar([recepcion({})]);

    const encabezado = getComputedStyle(
      fixture.nativeElement.querySelector('th.mat-column-litrosAPagar') as HTMLElement,
    );
    const celda = getComputedStyle(
      fixture.nativeElement.querySelector('td.mat-column-litrosAPagar') as HTMLElement,
    );

    expect(encabezado.whiteSpace).toBe('nowrap');
    expect(celda.whiteSpace).toBe('nowrap');
    expect(encabezado.verticalAlign).toBe('middle');
    expect(celda.verticalAlign).toBe('middle');
    // jsdom does not cascade Material's own padding rules, so the 12px is checked through the variable both use
    expect(
      getComputedStyle(fixture.nativeElement.querySelector('table') as HTMLElement).getPropertyValue(
        '--tabla-padding-vertical',
      ),
    ).toBe('12px');
    expect(celda.paddingTop).toBe(encabezado.paddingTop);
    expect(celda.paddingBottom).toBe(encabezado.paddingBottom);
  });

  it('uses the same padding on the first and the last column, header included', async () => {
    await cargar([recepcion({})]);

    const estilo = (selector: string) =>
      getComputedStyle(fixture.nativeElement.querySelector(selector) as HTMLElement);

    for (const [primera, ultima] of [
      ['th.mat-column-fechaHora', 'th.mat-column-observaciones'],
      ['td.mat-column-fechaHora', 'td.mat-column-observaciones'],
    ]) {
      expect(estilo(primera).paddingLeft).toBe('16px');
      expect(estilo(ultima).paddingRight).toBe('16px');
    }
  });

  it('shows a dash when ticket and water are empty', async () => {
    await cargar([recepcion({ ticket: null, aguaPorcentaje: null })]);

    const [, ticket, , agua] = celdas(filas()[0]);

    expect(ticket).toBe('—');
    expect(agua).toBe('—');
  });

  it('shows zero water as 0 and decimals in es-AR format', async () => {
    await cargar([
      recepcion({ id: 'a', ticket: 4901, aguaPorcentaje: 0 }),
      recepcion({ id: 'b', ticket: 4902, aguaPorcentaje: 0.5, litros: 1000, litrosAPagar: 995 }),
    ]);

    const [primera, segunda] = filas().map(celdas);

    expect(primera.slice(1, 5)).toEqual(['4901', '2.723', '0', '2.723']);
    expect(segunda.slice(1, 5)).toEqual(['4902', '1.000', '0,5', '995']);
  });
});
