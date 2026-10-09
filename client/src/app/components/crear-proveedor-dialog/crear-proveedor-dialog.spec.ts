import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
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
});
