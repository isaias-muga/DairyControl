export const ZONA_PLANTA = 'America/Argentina/Buenos_Aires';

export type PeriodoPreset = 'dia' | 'semana' | 'mes' | 'anio';

export interface RangoFechas {
  desde: string; // YYYY-MM-DD
  hasta: string; // YYYY-MM-DD
}

const MS_POR_DIA = 24 * 60 * 60 * 1000;

/** Today's date in the plant time zone as YYYY-MM-DD, whatever the browser's zone is. */
export function hoyEnPlanta(ahora: Date = new Date()): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_PLANTA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(ahora);
  const get = (tipo: string) => partes.find((p) => p.type === tipo)!.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Days between two YYYY-MM-DD dates, inclusive of both ends. */
export function diasEnRango(desde: string, hasta: string): number {
  return Math.round((aUtc(hasta) - aUtc(desde)) / MS_POR_DIA) + 1;
}

/**
 * The current day, week (from Monday), month or year, always ending today (`hoy`) so that
 * comparisons and daily averages only cover days that have already happened.
 */
export function rangoDePeriodo(preset: PeriodoPreset, hoy: string): RangoFechas {
  const [anio, mes] = hoy.split('-').map(Number);
  switch (preset) {
    case 'dia':
      return { desde: hoy, hasta: hoy };
    case 'semana': {
      const lunesPrimero = (new Date(aUtc(hoy)).getUTCDay() + 6) % 7; // 0 = Monday
      const lunes = sumarDias(hoy, -lunesPrimero);
      return { desde: lunes, hasta: hoy };
    }
    case 'mes':
      return { desde: aIso(Date.UTC(anio, mes - 1, 1)), hasta: hoy };
    case 'anio':
      return { desde: `${anio}-01-01`, hasta: hoy };
  }
}

/** YYYY-MM-DD to dd/MM/yyyy. */
export function formatearFecha(iso: string): string {
  const [anio, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${anio}`;
}

/** Nombre del mes (capitalizado) de una fecha YYYY-MM-DD, en es-AR. */
export function nombreDeMes(iso: string, formato: 'long' | 'short' = 'long'): string {
  const nombre = new Intl.DateTimeFormat('es-AR', { month: formato, timeZone: 'UTC' }).format(
    new Date(aUtc(iso)),
  );
  return nombre.charAt(0).toUpperCase() + nombre.slice(1).replace('.', '');
}

/** Human description of the period for the page subtitle. `preset` is null for a custom range. */
export function etiquetaPeriodo(rango: RangoFechas, preset: PeriodoPreset | null): string {
  switch (preset) {
    case 'dia':
      return formatearFecha(rango.desde);
    case 'semana':
      return `Semana del ${formatearFecha(rango.desde)} al ${formatearFecha(rango.hasta)}`;
    case 'mes':
      return `${nombreDeMes(rango.desde)} ${rango.desde.slice(0, 4)}`;
    case 'anio':
      return rango.desde.slice(0, 4);
    default:
      return `${formatearFecha(rango.desde)} – ${formatearFecha(rango.hasta)}`;
  }
}

/** YYYY-MM-DD to a local Date (for Material date pickers). */
export function isoADate(iso: string): Date {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}

/** Local Date to YYYY-MM-DD, using local components (never toISOString, which shifts to UTC). */
export function dateAIso(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

export function sumarDias(fecha: string, dias: number): string {
  return aIso(aUtc(fecha) + dias * MS_POR_DIA);
}

function aUtc(fecha: string): number {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  return Date.UTC(anio, mes - 1, dia);
}

function aIso(utcMs: number): string {
  return new Date(utcMs).toISOString().slice(0, 10);
}
