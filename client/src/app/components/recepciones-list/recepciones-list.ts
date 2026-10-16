import { Component, computed, inject, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  MotivoFueraDeRango,
  RecepcionListado,
  SubtotalDia,
} from '../../models/recepcion-listado';
import { formatearFecha } from '../../utils/periodos';
import { ObservacionCelda } from '../observacion-celda/observacion-celda';
import {
  ObservacionesDialog,
  ObservacionesDialogData,
} from '../observaciones-dialog/observaciones-dialog';

interface FilaDia {
  tipo: 'dia';
  etiqueta: string;
  subtotal: SubtotalDia | null;
}

interface FilaRecepcion {
  tipo: 'recepcion';
  recepcion: RecepcionListado;
}

type Fila = FilaDia | FilaRecepcion;

const ETIQUETA_MOTIVO: Record<MotivoFueraDeRango, string> = {
  Acidez: 'Acidez alta',
  Temperatura: 'Temp. alta',
  Agua: 'Agua',
};

/** Recepciones grouped by day (newest first) with the day subtotals, in a table that follows the Tables convention. */
@Component({
  selector: 'app-recepciones-list',
  imports: [
    DecimalPipe,
    RouterLink,
    MatButtonModule,
    MatTableModule,
    MatTooltipModule,
    ObservacionCelda,
  ],
  templateUrl: './recepciones-list.html',
  styleUrl: './recepciones-list.css',
})
export class RecepcionesList {
  private dialog = inject(MatDialog);

  items = input.required<RecepcionListado[]>();
  /** Subtotals of the whole day, for the days that appear in `items`. */
  dias = input<SubtotalDia[]>([]);
  /** Hide the proveedor column where it is redundant (the proveedor's own page). */
  mostrarProveedor = input(true);
  hayMas = input(false);
  cargandoMas = input(false);
  cargarMas = output<void>();

  protected columnas = computed(() => {
    const base = [
      'hora', 'ticket', 'proveedor', 'litros', 'agua', 'litrosReales',
      'grasa', 'acidez', 'temperatura', 'silo', 'estado', 'observaciones',
    ];
    return this.mostrarProveedor() ? base : base.filter((c) => c !== 'proveedor');
  });

  protected filas = computed<Fila[]>(() => {
    const subtotales = new Map(this.dias().map((d) => [d.fecha, d]));
    const filas: Fila[] = [];
    let diaActual = '';
    for (const recepcion of this.items()) {
      const dia = recepcion.fechaHora.slice(0, 10);
      if (dia !== diaActual) {
        diaActual = dia;
        filas.push({ tipo: 'dia', etiqueta: etiquetaDia(dia), subtotal: subtotales.get(dia) ?? null });
      }
      filas.push({ tipo: 'recepcion', recepcion });
    }
    return filas;
  });

  protected esDia = (_: number, fila: Fila): boolean => fila.tipo === 'dia';
  protected esRecepcion = (_: number, fila: Fila): boolean => fila.tipo === 'recepcion';

  protected dia(fila: Fila): FilaDia {
    return fila as FilaDia;
  }

  protected r(fila: Fila): RecepcionListado {
    return (fila as FilaRecepcion).recepcion;
  }

  protected hora(r: RecepcionListado): string {
    return r.fechaHora.slice(11, 16);
  }

  protected fuera(r: RecepcionListado, motivo: MotivoFueraDeRango): boolean {
    return r.motivos.includes(motivo);
  }

  protected etiquetaEstado(r: RecepcionListado): string {
    const [primero, ...resto] = r.motivos;
    return resto.length > 0 ? `${ETIQUETA_MOTIVO[primero]} +${resto.length}` : ETIQUETA_MOTIVO[primero];
  }

  protected detalleEstado(r: RecepcionListado): string {
    return r.motivos.map((m) => ETIQUETA_MOTIVO[m]).join(', ');
  }

  protected verObservaciones(r: RecepcionListado): void {
    this.dialog.open<ObservacionesDialog, ObservacionesDialogData>(ObservacionesDialog, {
      data: {
        ticket: r.ticket,
        proveedor: r.proveedorNombre,
        fechaHora: r.fechaHora,
        observaciones: r.observaciones ?? '',
      },
      width: '480px',
      maxWidth: '95vw',
    });
  }
}

/** "Jueves 15/10/2026" for a YYYY-MM-DD date (day of the week in es-AR, whatever the browser's zone is). */
export function etiquetaDia(iso: string): string {
  const [anio, mes, dia] = iso.split('-').map(Number);
  const nombre = new Intl.DateTimeFormat('es-AR', { weekday: 'long', timeZone: 'UTC' }).format(
    new Date(Date.UTC(anio, mes - 1, dia)),
  );
  return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} ${formatearFecha(iso)}`;
}
