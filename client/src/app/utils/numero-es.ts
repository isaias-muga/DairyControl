import { AbstractControl } from '@angular/forms';

export type ResultadoNumero = { ok: true; valor: number | null } | { ok: false; mensaje: string };

export interface OpcionesNumero {
  /** Integer-only fields (ticket, silo): any decimal part is rejected. */
  entero?: boolean;
}

const MENSAJE_FORMATO = 'Usá punto para los miles y coma para los decimales (1.234,5).';
const MENSAJE_INVALIDO = 'Escribí solo números, con coma para los decimales (3,5).';
const MENSAJE_ENTERO = 'Ingresá un número entero, sin decimales.';
const MENSAJE_GRANDE = 'El número es demasiado grande.';
const MAX_DIGITOS = 15;

const AGRUPADO = /^\d{1,3}(\.\d{3})+$/;
const SOLO_DIGITOS = /^\d+$/;

function rechazar(mensaje: string): ResultadoNumero {
  return { ok: false, mensaje };
}

function aNumero(entera: string, decimales: string, opciones: OpcionesNumero): ResultadoNumero {
  if (decimales !== '' && opciones.entero) {
    return rechazar(MENSAJE_ENTERO);
  }
  if (entera.length + decimales.length > MAX_DIGITOS) {
    return rechazar(MENSAJE_GRANDE);
  }
  return { ok: true, valor: Number(decimales === '' ? entera : `${entera}.${decimales}`) };
}

/**
 * Reads a number typed the es-AR way: "." groups thousands, "," is the decimal separator.
 * Anything ambiguous or invalid is rejected with a Spanish message, never converted silently.
 * Empty text is valid and gives null (the `required` validator reports it).
 */
export function parsearNumeroEs(texto: string, opciones: OpcionesNumero = {}): ResultadoNumero {
  const t = texto.trim();
  if (t === '') {
    return { ok: true, valor: null };
  }
  if (!/^[0-9.,]+$/.test(t)) {
    return rechazar(MENSAJE_INVALIDO);
  }

  const comas = t.split(',').length - 1;
  if (comas > 1) {
    return rechazar(MENSAJE_FORMATO);
  }
  if (comas === 1) {
    const [entera, decimales] = t.split(',');
    const enteraValida = entera === '' || SOLO_DIGITOS.test(entera) || AGRUPADO.test(entera);
    if (!enteraValida || !SOLO_DIGITOS.test(decimales)) {
      return rechazar(MENSAJE_FORMATO);
    }
    return aNumero(entera.replaceAll('.', '') || '0', decimales, opciones);
  }

  const puntos = t.split('.').length - 1;
  if (puntos === 0) {
    return aNumero(t, '', opciones);
  }
  if (AGRUPADO.test(t) && !t.startsWith('0')) {
    return aNumero(t.replaceAll('.', ''), '', opciones); // "1.234" is 1234, "1.234.567" is 1234567
  }
  if (puntos === 1 && /^[0-9]+\.[0-9]+$/.test(t)) {
    const [entera, decimales] = t.split('.');
    return aNumero(entera, decimales, opciones); // "3.5", "1234.5", "0.001": the dot is a decimal point
  }
  return rechazar(MENSAJE_FORMATO); // "1.2.3", "12.34.567", "5."
}

/** Shows a number the es-AR way ("1.234,5"). Integer fields (ticket, silo) are identifiers and are never grouped. */
export function formatearNumeroEs(valor: number | null | undefined, opciones: OpcionesNumero = {}): string {
  if (valor == null || !Number.isFinite(valor)) {
    return '';
  }
  return new Intl.NumberFormat('es-AR', {
    // The TypeScript lib types only allow a boolean here, but the runtime accepts 'always'
    useGrouping: (opciones.entero ? false : 'always') as unknown as boolean,
    maximumFractionDigits: 10,
  }).format(valor);
}

/** The parser's message when the control has the `numero` error, else the field's usual range message. */
export function errorNumero(control: AbstractControl, porDefecto: string): string {
  return control.errors?.['numero'] ?? porDefecto;
}
