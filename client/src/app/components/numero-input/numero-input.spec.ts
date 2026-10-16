import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { NumeroInput } from './numero-input';

@Component({
  imports: [ReactiveFormsModule, NumeroInput],
  template: `
    <input id="decimal" appNumero [formControl]="decimal" />
    <input id="entero" appNumero="entero" [formControl]="entero" />
  `,
})
class Anfitrion {
  decimal = new FormControl<number | null>(null, [Validators.required, Validators.min(1), Validators.max(30000)]);
  entero = new FormControl<number | null>(null);
}

describe('NumeroInput', () => {
  let fixture: ComponentFixture<Anfitrion>;
  let anfitrion: Anfitrion;
  let decimal: HTMLInputElement;
  let entero: HTMLInputElement;

  function escribir(campo: HTMLInputElement, texto: string): void {
    campo.value = texto;
    campo.dispatchEvent(new Event('input'));
  }

  function salir(campo: HTMLInputElement): void {
    campo.dispatchEvent(new Event('blur'));
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Anfitrion] }).compileComponents();
    fixture = TestBed.createComponent(Anfitrion);
    anfitrion = fixture.componentInstance;
    fixture.detectChanges();
    decimal = fixture.nativeElement.querySelector('#decimal');
    entero = fixture.nativeElement.querySelector('#entero');
  });

  it('is a text input with the right keyboard hint, never type=number', () => {
    // Arrange / Act / Assert
    expect(decimal.type).toBe('text');
    expect(decimal.getAttribute('inputmode')).toBe('decimal');
    expect(entero.getAttribute('inputmode')).toBe('numeric');
  });

  it('typing "1.234,5" puts 1234.5 in the control', () => {
    // Arrange / Act
    escribir(decimal, '1.234,5');

    // Assert
    expect(anfitrion.decimal.value).toBe(1234.5);
    expect(anfitrion.decimal.errors).toBeNull();
  });

  it('leaves the typed text untouched while editing and formats it on blur', () => {
    // Arrange
    escribir(decimal, '1234,5');
    expect(decimal.value).toBe('1234,5');

    // Act
    salir(decimal);

    // Assert
    expect(decimal.value).toBe('1.234,5');
    expect(anfitrion.decimal.value).toBe(1234.5);
    expect(anfitrion.decimal.touched).toBe(true);
  });

  it('shows a value set from the code formatted es-AR', () => {
    // Arrange / Act
    anfitrion.decimal.setValue(1234.5);
    anfitrion.entero.setValue(1000001);

    // Assert
    expect(decimal.value).toBe('1.234,5');
    expect(entero.value).toBe('1000001');
  });

  it('an ambiguous text gives null and the parser message, and is left as typed on blur', () => {
    // Arrange / Act
    escribir(decimal, '1.2.3');
    salir(decimal);

    // Assert
    expect(anfitrion.decimal.value).toBeNull();
    expect(anfitrion.decimal.errors?.['numero']).toContain('Usá punto para los miles');
    expect(decimal.value).toBe('1.2.3');
  });

  it('the error goes away when the text is fixed', () => {
    // Arrange
    escribir(decimal, 'abc');
    expect(anfitrion.decimal.errors?.['numero']).toBeDefined();

    // Act
    escribir(decimal, '12');

    // Assert
    expect(anfitrion.decimal.errors).toBeNull();
    expect(anfitrion.decimal.value).toBe(12);
  });

  it('the plausible range still applies to the parsed number', () => {
    // Arrange / Act
    escribir(decimal, '1.234.567');

    // Assert
    expect(anfitrion.decimal.value).toBe(1234567);
    expect(anfitrion.decimal.errors?.['max']).toBeDefined();
  });

  it('1.234,5 in a field limited to 30 is out of range, never 1.2345', () => {
    // Arrange
    anfitrion.decimal.setValidators([Validators.min(10), Validators.max(30)]);

    // Act
    escribir(decimal, '1.234,5');

    // Assert
    expect(anfitrion.decimal.value).toBe(1234.5);
    expect(anfitrion.decimal.errors?.['max']).toBeDefined();
  });

  it('an empty text is null with no parser error, so required reports it', () => {
    // Arrange / Act
    escribir(decimal, '   ');
    salir(decimal);

    // Assert
    expect(anfitrion.decimal.value).toBeNull();
    expect(anfitrion.decimal.errors?.['numero']).toBeUndefined();
    expect(anfitrion.decimal.errors?.['required']).toBe(true);
    expect(decimal.value).toBe('');
  });

  it('an integer field rejects decimals', () => {
    // Arrange / Act
    escribir(entero, '3,5');

    // Assert
    expect(anfitrion.entero.value).toBeNull();
    expect(anfitrion.entero.errors?.['numero']).toBe('Ingresá un número entero, sin decimales.');
  });

  it('an integer field is not grouped on blur', () => {
    // Arrange
    escribir(entero, '1.000.001');

    // Act
    salir(entero);

    // Assert
    expect(anfitrion.entero.value).toBe(1000001);
    expect(entero.value).toBe('1000001');
  });

  it('reset clears the text and the error', () => {
    // Arrange
    escribir(decimal, 'abc');

    // Act
    anfitrion.decimal.reset();

    // Assert
    expect(decimal.value).toBe('');
    expect(anfitrion.decimal.errors?.['numero']).toBeUndefined();
  });
});
