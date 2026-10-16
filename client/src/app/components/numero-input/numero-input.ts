import { Directive, ElementRef, forwardRef, inject, input } from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import { formatearNumeroEs, parsearNumeroEs } from '../../utils/numero-es';

/**
 * A text input for numbers typed the es-AR way ("1.234,5"): `<input matInput appNumero formControlName="litros" />`,
 * or `appNumero="entero"` for ticket and silo. It is not `type="number"`, so the browser never reinterprets the
 * text. The form control holds a plain `number | null`; text the parser rejects leaves `null` and a `numero` error
 * with the message to show (see `errorNumero`). A valid text is rewritten in the same format when the field loses
 * the focus; nothing changes while editing.
 */
@Directive({
  selector: 'input[appNumero]',
  host: {
    type: 'text',
    autocomplete: 'off',
    '[attr.inputmode]': "modo() === 'entero' ? 'numeric' : 'decimal'",
    '(input)': 'alEscribir()',
    '(blur)': 'alSalir()',
  },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => NumeroInput), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => NumeroInput), multi: true },
  ],
})
export class NumeroInput implements ControlValueAccessor, Validator {
  private elemento = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;

  /** `appNumero` alone is a decimal field; `appNumero="entero"` rejects decimals. */
  readonly modo = input<'' | 'entero'>('', { alias: 'appNumero' });

  private mensaje: string | null = null;
  private onChange: (valor: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(valor: number | null): void {
    this.mensaje = null;
    this.elemento.value = formatearNumeroEs(valor, { entero: this.modo() === 'entero' });
  }

  registerOnChange(fn: (valor: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(deshabilitado: boolean): void {
    this.elemento.disabled = deshabilitado;
  }

  validate(_: AbstractControl): ValidationErrors | null {
    return this.mensaje ? { numero: this.mensaje } : null;
  }

  protected alEscribir(): void {
    const resultado = parsearNumeroEs(this.elemento.value, { entero: this.modo() === 'entero' });
    this.mensaje = resultado.ok ? null : resultado.mensaje;
    this.onChange(resultado.ok ? resultado.valor : null);
  }

  protected alSalir(): void {
    const entero = this.modo() === 'entero';
    const resultado = parsearNumeroEs(this.elemento.value, { entero });
    if (resultado.ok) {
      this.elemento.value = formatearNumeroEs(resultado.valor, { entero }); // '' when only spaces were typed
    }
    this.onTouched();
  }
}
