import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RecepcionForm } from './recepcion-form';

describe('RecepcionForm', () => {
  let component: RecepcionForm;
  let fixture: ComponentFixture<RecepcionForm>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecepcionForm],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(RecepcionForm);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('proveedorId', 'test-id');
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  function completarObligatorios(): void {
    component.form.patchValue({ litros: 1000, acidez: 17, temperatura: 5 });
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the optional % agua and Ticket fields', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#aguaPorcentaje')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#ticket')).toBeTruthy();
  });

  describe('optional fields', () => {
    const etiquetas = (): string[] =>
      Array.from(
        fixture.nativeElement.querySelectorAll('mat-form-field mat-label') as NodeListOf<HTMLElement>,
      ).map((l) => (l.textContent ?? '').trim());

    it('marks the optional fields in the label', () => {
      fixture.detectChanges();

      expect(etiquetas()).toEqual(
        expect.arrayContaining([
          'Grasa (%) (opcional)',
          'Silo (opcional)',
          '% agua (opcional)',
          'Ticket (opcional)',
          'Observaciones (opcional)',
        ]),
      );
    });

    it('does not mark the required fields as optional', () => {
      fixture.detectChanges();

      const requeridos = etiquetas().filter((e) =>
        ['Fecha y hora', 'Litros', 'Acidez', 'Temperatura (°C)'].includes(e),
      );

      expect(requeridos).toHaveLength(4);
    });

    it('does not use mat-hint for "opcional"', () => {
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('mat-hint')).toBeNull();
      expect(fixture.nativeElement.textContent).not.toMatch(/\bopcional\b(?!\))/);
    });
  });

  it('is valid without water and ticket', () => {
    completarObligatorios();

    expect(component.form.valid).toBe(true);
  });

  it.each([-0.01, 100.01])('rejects % agua %s', (valor) => {
    completarObligatorios();
    component.form.controls.aguaPorcentaje.setValue(valor);

    expect(component.form.controls.aguaPorcentaje.invalid).toBe(true);
  });

  it.each([0, 100])('accepts % agua %s', (valor) => {
    completarObligatorios();
    component.form.controls.aguaPorcentaje.setValue(valor);

    expect(component.form.controls.aguaPorcentaje.valid).toBe(true);
  });

  it.each([0, -1, 1.5])('rejects ticket %s', (valor) => {
    completarObligatorios();
    component.form.controls.ticket.setValue(valor);

    expect(component.form.controls.ticket.invalid).toBe(true);
  });

  it('sends null water and ticket when left empty', () => {
    completarObligatorios();

    component.submit();

    const req = http.expectOne((r) => r.url.endsWith('/Proveedores/test-id/recepciones'));
    expect(req.request.body.aguaPorcentaje).toBeNull();
    expect(req.request.body.ticket).toBeNull();
  });

  it('sends water and ticket when filled', () => {
    completarObligatorios();
    component.form.patchValue({ aguaPorcentaje: 2.5, ticket: 4501 });

    component.submit();

    const req = http.expectOne((r) => r.url.endsWith('/Proveedores/test-id/recepciones'));
    expect(req.request.body.aguaPorcentaje).toBe(2.5);
    expect(req.request.body.ticket).toBe(4501);
  });

  describe('duplicate ticket (409)', () => {
    const mensaje = 'El ticket 6311 ya está registrado (Tambo Las Acacias, 11/10/2026)';

    function enviarConTicketDuplicado(): void {
      completarObligatorios();
      component.form.patchValue({ ticket: 6311 });
      component.submit();
      http
        .expectOne((r) => r.url.endsWith('/Proveedores/test-id/recepciones'))
        .flush({ error: mensaje }, { status: 409, statusText: 'Conflict' });
      fixture.detectChanges();
    }

    it('shows the message next to the ticket field, not as a generic error', () => {
      enviarConTicketDuplicado();

      const campo = fixture.nativeElement.querySelector('#ticket').closest('mat-form-field');
      expect(campo.textContent).toContain(mensaje);
      expect(component.saveError()).toBeNull();
      expect(component.saving()).toBe(false);
    });

    it('keeps the entered values (the form is not reset)', () => {
      enviarConTicketDuplicado();

      expect(component.form.controls.ticket.value).toBe(6311);
      expect(component.form.controls.litros.value).toBe(1000);
    });

    it('clears the ticket error when the user edits the ticket', () => {
      enviarConTicketDuplicado();

      component.form.controls.ticket.setValue(6312);

      expect(component.form.controls.ticket.errors).toBeNull();
    });
  });

  it('shows other API errors in the generic form error', () => {
    completarObligatorios();

    component.submit();
    http
      .expectOne((r) => r.url.endsWith('/Proveedores/test-id/recepciones'))
      .flush({ error: 'Dato inválido' }, { status: 400, statusText: 'Bad Request' });

    expect(component.saveError()).toBe('Dato inválido');
    expect(component.form.controls.ticket.errors).toBeNull();
  });

  it('does not submit when water is out of range', () => {
    completarObligatorios();
    component.form.controls.aguaPorcentaje.setValue(150);

    component.submit();

    http.expectNone((r) => r.url.endsWith('/recepciones'));
  });
});
