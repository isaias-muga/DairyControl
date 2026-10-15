import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { CrearProveedorDialog } from './crear-proveedor-dialog';

describe('CrearProveedorDialog', () => {
  let component: CrearProveedorDialog;
  let fixture: ComponentFixture<CrearProveedorDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearProveedorDialog],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: { close: () => {} } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CrearProveedorDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sends only one request when submitted twice before the response arrives', () => {
    const http = TestBed.inject(HttpTestingController);
    component.form.setValue({ nombre: 'Tambo Las Acacias' });

    component.crear();
    component.crear();

    const requests = http.match((r) => r.method === 'POST');
    expect(requests).toHaveLength(1);
    requests[0].flush({ id: '1', nombre: 'Tambo Las Acacias', cantidadRecepciones: 0 });
    http.verify();
  });
});
