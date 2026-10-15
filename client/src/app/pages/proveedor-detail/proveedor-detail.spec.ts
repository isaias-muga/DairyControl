import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';
import { ComponentFixture, TestBed } from '@angular/core/testing';
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

  it('shows Ticket after the date and % agua and Litros reales next to Litros', async () => {
    await cargar([recepcion({})]);

    const encabezados = Array.from(
      fixture.nativeElement.querySelectorAll('th') as NodeListOf<HTMLElement>,
    ).map((th) => (th.textContent ?? '').trim());

    expect(encabezados.slice(0, 5)).toEqual([
      'Fecha y hora',
      'Ticket',
      'Litros',
      '% agua',
      'Litros reales',
    ]);
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
