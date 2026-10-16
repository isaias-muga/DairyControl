import { LimitesCalidad } from '../models/configuracion';
import { MotivoFueraDeRango } from '../models/recepcion-listado';

const ESCALA_LITROS = 1000;

/**
 * Litros reales (liters minus the water), rounded to 3 decimals like the API does.
 * For the live preview in the form only: the API computes and stores the real figure.
 */
export function litrosReales(litros: number, aguaPorcentaje: number | null | undefined): number {
  const reales = litros * (1 - (aguaPorcentaje ?? 0) / 100);
  return Math.round((reales + Number.EPSILON) * ESCALA_LITROS) / ESCALA_LITROS;
}

/**
 * Which quality limits a reading exceeds, for the live preview in the form only. The limits come from the
 * API (never hardcoded) and the API remains the source of truth: lists show the reasons it returns.
 */
export function motivosFueraDeRango(
  limites: Pick<LimitesCalidad, 'acidezMaxima' | 'temperaturaMaxima' | 'aguaMaxima'>,
  lectura: { acidez: number | null; temperatura: number | null; aguaPorcentaje: number | null },
): MotivoFueraDeRango[] {
  const motivos: MotivoFueraDeRango[] = [];
  if (lectura.acidez != null && lectura.acidez > limites.acidezMaxima) {
    motivos.push('Acidez');
  }
  if (lectura.temperatura != null && lectura.temperatura > limites.temperaturaMaxima) {
    motivos.push('Temperatura');
  }
  if ((lectura.aguaPorcentaje ?? 0) > limites.aguaMaxima) {
    motivos.push('Agua');
  }
  return motivos;
}
