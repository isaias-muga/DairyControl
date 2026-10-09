import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { RegistrarRecepcionDialog } from './registrar-recepcion-dialog';

describe('RegistrarRecepcionDialog', () => {
  let component: RegistrarRecepcionDialog;
  let fixture: ComponentFixture<RegistrarRecepcionDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrarRecepcionDialog],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MAT_DIALOG_DATA, useValue: { proveedorId: 'test-id' } },
        { provide: MatDialogRef, useValue: { close: () => {} } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistrarRecepcionDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
