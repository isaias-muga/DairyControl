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

  describe('plausible ranges (typing errors, not quality limits)', () => {
    type Campo = 'litros' | 'grasa' | 'acidez' | 'temperatura' | 'silo' | 'aguaPorcentaje';

    const control = (campo: Campo) => component.form.controls[campo];

    // [field, value just inside / on the edge, value just outside]
    const dentro: [Campo, number][] = [
      ['litros', 0.001], ['litros', 30000],
      ['grasa', 1], ['grasa', 10],
      ['acidez', 10], ['acidez', 30],
      ['temperatura', 0], ['temperatura', 45],
      ['silo', 1], ['silo', 20],
      ['aguaPorcentaje', 0], ['aguaPorcentaje', 100],
    ];
    const fuera: [Campo, number][] = [
      ['litros', 0], ['litros', -1], ['litros', 0.0009], ['litros', 30000.01],
      ['grasa', 0.99], ['grasa', 10.01],
      ['acidez', 9.99], ['acidez', 30.01],
      ['temperatura', -0.01], ['temperatura', 45.01],
      ['silo', 0], ['silo', 21],
      ['aguaPorcentaje', -0.01], ['aguaPorcentaje', 100.01],
    ];

    it.each(dentro)('accepts %s = %s', (campo, valor) => {
      completarObligatorios();
      control(campo).setValue(valor);

      expect(control(campo).valid).toBe(true);
    });

    it.each(fuera)('rejects %s = %s', (campo, valor) => {
      completarObligatorios();
      control(campo).setValue(valor);

      expect(control(campo).invalid).toBe(true);
      expect(component.form.invalid).toBe(true);
    });

    it('does not require the optional grasa and silo', () => {
      completarObligatorios();

      expect(control('grasa').valid).toBe(true);
      expect(control('silo').valid).toBe(true);
    });

    it('rejects a non-integer silo', () => {
      completarObligatorios();
      control('silo').setValue(2.5);

      expect(control('silo').invalid).toBe(true);
    });

    it('does not submit an impossible value', () => {
      completarObligatorios();
      control('grasa').setValue(12);

      component.submit();

      http.expectNone((r) => r.url.endsWith('/recepciones'));
    });

    it('shows a clear message next to each field with an impossible value', () => {
      component.form.patchValue({
        litros: 40000, grasa: 12, acidez: 5, temperatura: 60, silo: 99, aguaPorcentaje: 150,
      });
      component.form.markAllAsTouched();
      fixture.detectChanges();

      const texto = fixture.nativeElement.textContent as string;

      expect(texto).toContain('Entre 0,001 y 30.000.');
      expect(texto).toContain('Entre 1 y 10 %.');
      expect(texto).toContain('Requerido, entre 10 y 30 °D.');
      expect(texto).toContain('Requerido, entre 0 y 45 °C.');
      expect(texto).toContain('Número entero entre 1 y 20.');
      expect(texto).toContain('Entre 0 y 100.');
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
