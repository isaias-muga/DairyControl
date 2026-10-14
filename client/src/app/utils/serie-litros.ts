import { ResumenDia } from '../models/resumen';
import { diasEnRango, formatearFecha, nombreDeMes, sumarDias } from './periodos';

/** Above this many days the chart groups the days into monthly bars. */
export const MAX_DIAS_BARRAS_DIARIAS = 62;

export interface Barra {
  etiqueta: string;
  mostrarEtiqueta: boolean;
  titulo: string;
  litros: number;
}

export interface SerieLitros {
  agrupacion: 'dia' | 'mes';
  barras: Barra[];
  ticks: number[]; // ascending, the last one is the axis maximum
  maximoEje: number;
  promedioDiario: number;
}

const formatoLitros = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 });

/** Builds the chart bars for desde..hasta, filling days without deliveries with zero liters. */
export function construirSerie(desde: string, hasta: string, dias: ResumenDia[]): SerieLitros {
  const totalDias = diasEnRango(desde, hasta);
  const litrosPorDia = new Map(dias.map((d) => [d.fecha, d.litros]));
  const total = dias.reduce((suma, d) => suma + d.litros, 0);

  const agrupacion = totalDias > MAX_DIAS_BARRAS_DIARIAS ? 'mes' : 'dia';
  const barras =
    agrupacion === 'dia'
      ? barrasDiarias(desde, totalDias, litrosPorDia)
      : barrasMensuales(desde, totalDias, litrosPorDia);

  const ticks = ticksDelEje(Math.max(0, ...barras.map((b) => b.litros)));
  return {
    agrupacion,
    barras,
    ticks,
    maximoEje: ticks[ticks.length - 1],
    promedioDiario: totalDias > 0 ? total / totalDias : 0,
  };
}

function barrasDiarias(desde: string, totalDias: number, litrosPorDia: Map<string, number>): Barra[] {
  const paso = Math.ceil(totalDias / 7);
  return Array.from({ length: totalDias }, (_, i) => {
    const fecha = sumarDias(desde, i);
    const litros = litrosPorDia.get(fecha) ?? 0;
    return {
      etiqueta: String(Number(fecha.slice(8, 10))),
      mostrarEtiqueta: i % paso === 0,
      titulo: `${formatearFecha(fecha)}: ${formatoLitros.format(litros)} L`,
      litros,
    };
  });
}

function barrasMensuales(desde: string, totalDias: number, litrosPorDia: Map<string, number>): Barra[] {
  const porMes = new Map<string, number>(); // YYYY-MM -> liters, in chronological order
  for (let i = 0; i < totalDias; i++) {
    const fecha = sumarDias(desde, i);
    const mes = fecha.slice(0, 7);
    porMes.set(mes, (porMes.get(mes) ?? 0) + (litrosPorDia.get(fecha) ?? 0));
  }
  return [...porMes].map(([mes, litros]) => {
    const primerDia = `${mes}-01`;
    return {
      etiqueta: nombreDeMes(primerDia, 'short'),
      mostrarEtiqueta: true,
      titulo: `${nombreDeMes(primerDia)} ${mes.slice(0, 4)}: ${formatoLitros.format(litros)} L`,
      litros,
    };
  });
}

/** Round axis ticks (1, 2 or 5 times a power of ten) covering 0..maximo, at most 4 steps. */
export function ticksDelEje(maximo: number): number[] {
  if (maximo <= 0) {
    return [0, 1];
  }
  const crudo = maximo / 4;
  const potencia = Math.pow(10, Math.floor(Math.log10(crudo)));
  const paso = [1, 2, 5, 10].map((m) => m * potencia).find((p) => p >= crudo)!;
  const cantidad = Math.ceil(maximo / paso);
  return Array.from({ length: cantidad + 1 }, (_, i) => i * paso);
}
