import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of, Subject } from 'rxjs';
import { RegistrarRecepcionDialog, RegistrarRecepcionDialogData } from './registrar-recepcion-dialog';
import { RecepcionForm } from '../recepcion-form/recepcion-form';

describe('RegistrarRecepcionDialog', () => {
  let fixture: ComponentFixture<RegistrarRecepcionDialog>;
  let component: RegistrarRecepcionDialog;
  let http: HttpTestingController;
  let close: ReturnType<typeof vi.fn>;
  let backdrop: Subject<MouseEvent>;
  let teclas: Subject<KeyboardEvent>;

  async function crear(data: RegistrarRecepcionDialogData): Promise<void> {
    close = vi.fn();
    backdrop = new Subject<MouseEvent>();
    teclas = new Subject<KeyboardEvent>();
    await TestBed.configureTestingModule({
      imports: [RegistrarRecepcionDialog],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MAT_DIALOG_DATA, useValue: data },
        {
          provide: MatDialogRef,
          useValue: { close, backdropClick: () => backdrop, keydownEvents: () => teclas },
        },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(RegistrarRecepcionDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
    http.match((r) => r.url.endsWith('/Recepciones/siguiente-ticket'));
    http.match((r) => r.url.endsWith('/Configuracion/calidad'));
    http.match((r) => r.url.endsWith('/Proveedores'));
    fixture.detectChanges();
  }

  function formulario(): RecepcionForm {
    return fixture.debugElement.query(By.directive(RecepcionForm)).componentInstance;
  }

  describe('with a proveedor', () => {
    beforeEach(() => crear({ proveedorId: 'test-id' }));

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('does not show the proveedor selector', () => {
      expect(fixture.nativeElement.querySelector('#proveedorId')).toBeNull();
    });

    it('closes reporting a save after a plain "Registrar"', () => {
      (component as unknown as { onRegistrada(cargarOtra: boolean): void }).onRegistrada(false);

      expect(close).toHaveBeenCalledExactlyOnceWith(true);
    });

    it('stays open after "Registrar y cargar otra" and reports the save when it is closed later', () => {
      const interno = component as unknown as { onRegistrada(c: boolean): void; cerrar(): void };

      interno.onRegistrada(true);
      expect(close).not.toHaveBeenCalled();
      interno.cerrar();

      expect(close).toHaveBeenCalledExactlyOnceWith(true);
    });

    it('reports no save when it is cancelled without registering anything', () => {
      (component as unknown as { cerrar(): void }).cerrar();

      expect(close).toHaveBeenCalledExactlyOnceWith(false);
    });

    it('closes through Escape and the backdrop with the same result as Cancelar', () => {
      (component as unknown as { onRegistrada(c: boolean): void }).onRegistrada(true);

      teclas.next(new KeyboardEvent('keydown', { key: 'Escape' }));
      backdrop.next(new MouseEvent('click'));
      teclas.next(new KeyboardEvent('keydown', { key: 'Enter' }));

      expect(close).toHaveBeenCalledTimes(2);
      expect(close).toHaveBeenNthCalledWith(1, true);
      expect(close).toHaveBeenNthCalledWith(2, true);
    });

    it('does not close while a save is in flight, so the list is told about it when it finishes', () => {
      formulario().saving.set(true);

      (component as unknown as { cerrar(): void }).cerrar();
      teclas.next(new KeyboardEvent('keydown', { key: 'Escape' }));
      backdrop.next(new MouseEvent('click'));

      expect(close).not.toHaveBeenCalled();
    });

    it('closes from the Cancelar button', () => {
      const cancelar = Array.from(
        fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
      ).find((b) => b.textContent?.trim() === 'Cancelar');

      cancelar!.click();

      expect(close).toHaveBeenCalledExactlyOnceWith(false);
    });

    it('offers both "Registrar" and "Registrar y cargar otra"', () => {
      const textos = Array.from(
        fixture.nativeElement.querySelectorAll('.actions button') as NodeListOf<HTMLElement>,
      ).map((b) => b.textContent?.trim());

      expect(textos).toEqual(expect.arrayContaining(['Cancelar', 'Registrar y cargar otra', 'Registrar']));
    });

    it('passes the proveedor to the form', () => {
      expect(formulario().proveedorId()).toBe('test-id');
    });
  });

  describe('without a proveedor', () => {
    beforeEach(() => crear({}));

    it('passes no proveedor to the form, which then shows the selector', () => {
      expect(formulario().proveedorId()).toBeNull();
      expect(fixture.nativeElement.querySelector('#proveedorId')).toBeTruthy();
    });
  });

  describe('abrir', () => {
    it('opens with disableClose so every way of closing reports whether something was saved', () => {
      const open = vi.fn().mockReturnValue({ afterClosed: () => of(true) });
      const dialog = { open } as unknown as MatDialog;
      let resultado: boolean | undefined;

      RegistrarRecepcionDialog.abrir(dialog, { proveedorId: 'x' }).subscribe((r) => (resultado = r));

      expect(resultado).toBe(true);
      expect(open).toHaveBeenCalledWith(
        RegistrarRecepcionDialog,
        expect.objectContaining({ data: { proveedorId: 'x' }, disableClose: true, width: '640px' }),
      );
    });
  });
});
