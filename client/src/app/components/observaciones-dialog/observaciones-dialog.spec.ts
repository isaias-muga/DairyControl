import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ObservacionesDialog, ObservacionesDialogData } from './observaciones-dialog';

registerLocaleData(localeEsAr);

describe('ObservacionesDialog', () => {
  let fixture: ComponentFixture<ObservacionesDialog>;

  async function setup(data: ObservacionesDialogData): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [ObservacionesDialog],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: LOCALE_ID, useValue: 'es-AR' },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ObservacionesDialog);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  const texto = (): string => fixture.nativeElement.textContent;

  it('shows the full text with ticket, proveedor and fecha y hora', async () => {
    await setup({
      ticket: 98765,
      proveedor: 'Tambo La Esperanza',
      fechaHora: '2026-10-15T15:34:00',
      observaciones: 'Entrega con demora por lluvia; el camión llegó tarde.',
    });

    expect(texto()).toContain('Observaciones');
    expect(texto()).toContain('98765');
    expect(texto()).toContain('Tambo La Esperanza');
    expect(texto()).toContain('15/10/2026 15:34');
    expect(fixture.nativeElement.querySelector('.texto').textContent).toBe(
      'Entrega con demora por lluvia; el camión llegó tarde.',
    );
  });

  it('shows a dash when the recepción has no ticket', async () => {
    await setup({
      ticket: null,
      proveedor: 'Tambo La Esperanza',
      fechaHora: '2026-10-15T15:34:00',
      observaciones: 'Acidez alta',
    });

    const ticket = fixture.nativeElement.querySelector('.contexto dd');

    expect(ticket.textContent.trim()).toBe('—');
  });

  it('has a Cerrar button', async () => {
    await setup({ ticket: 1, proveedor: 'P', fechaHora: '2026-10-15T15:34:00', observaciones: 'x' });

    const botones: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));

    expect(botones.some((b) => b.textContent?.includes('Cerrar'))).toBe(true);
  });
});
