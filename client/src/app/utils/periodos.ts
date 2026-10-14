export const ZONA_PLANTA = 'America/Argentina/Buenos_Aires';

export type PeriodoPreset = 'hoy' | 'ultimos-7' | 'ultimos-30' | 'este-mes' | 'mes-anterior';

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

export function rangoDePeriodo(preset: PeriodoPreset, hoy: string): RangoFechas {
  const [anio, mes] = hoy.split('-').map(Number);
  switch (preset) {
    case 'hoy':
      return { desde: hoy, hasta: hoy };
    case 'ultimos-7':
      return { desde: sumarDias(hoy, -6), hasta: hoy };
    case 'ultimos-30':
      return { desde: sumarDias(hoy, -29), hasta: hoy };
    case 'este-mes':
      return { desde: aIso(Date.UTC(anio, mes - 1, 1)), hasta: hoy };
    case 'mes-anterior':
      return {
        desde: aIso(Date.UTC(anio, mes - 2, 1)),
        hasta: aIso(Date.UTC(anio, mes - 1, 0)), // day 0 = last day of the previous month
      };
  }
}

function aUtc(fecha: string): number {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  return Date.UTC(anio, mes - 1, dia);
}

function aIso(utcMs: number): string {
  return new Date(utcMs).toISOString().slice(0, 10);
}

function sumarDias(fecha: string, dias: number): string {
  return aIso(aUtc(fecha) + dias * MS_POR_DIA);
}
