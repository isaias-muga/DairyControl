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

  it('does not submit when water is out of range', () => {
    completarObligatorios();
    component.form.controls.aguaPorcentaje.setValue(150);

    component.submit();

    http.expectNone((r) => r.url.endsWith('/recepciones'));
  });
});
