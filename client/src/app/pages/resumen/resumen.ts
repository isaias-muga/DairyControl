import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { provideNativeDateAdapter } from '@angular/material/core';
import { Subscription } from 'rxjs';
import { RecepcionesService } from '../../services/recepciones';
import { ProveedoresService } from '../../services/proveedores';
import { Proveedor } from '../../models/proveedor';
import { ResumenRecepciones } from '../../models/resumen';
import { RESUMEN_MAX_DIAS } from '../../models/limits';
import { getApiErrorMessage } from '../../utils/api-error';
import {
  PeriodoPreset,
  RangoFechas,
  dateAIso,
  diasEnRango,
  etiquetaPeriodo,
  formatearFecha,
  hoyEnPlanta,
  isoADate,
  rangoDePeriodo,
} from '../../utils/periodos';
import { construirSerie } from '../../utils/serie-litros';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-resumen',
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    MatButtonToggleModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './resumen.html',
  styleUrl: './resumen.css',
})
export class Resumen {
  private recepcionesService = inject(RecepcionesService);
  private proveedoresService = inject(ProveedoresService);
  private fb = inject(FormBuilder).nonNullable;
  private request?: Subscription;

  protected columnasProveedores = ['nombre', 'litros', 'participacion', 'recepciones', 'fueraDeRango'];
  protected formatearFecha = formatearFecha;

  // null = custom range typed or picked in the date range field
  periodo = signal<PeriodoPreset | null>('mes');
  rango = signal<RangoFechas>(rangoDePeriodo('mes', hoyEnPlanta()));
  proveedores = signal<Proveedor[]>([]);
  resumen = signal<ResumenRecepciones | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  errorRango = signal<string | null>(null);
  proveedorId = signal<string | null>(null); // mirrors proveedorControl so computed() can react to it

  protected readonly TODOS = 'todos'; // value of the "Todos" option (mat-select ignores null as a selection)
  protected proveedorControl = this.fb.control<string>(this.TODOS);
  protected rangoForm = this.fb.group({
    inicio: this.fb.control<Date | null>(isoADate(this.rango().desde)),
    fin: this.fb.control<Date | null>(isoADate(this.rango().hasta)),
  });

  protected subtitulo = computed(() => {
    const nombre = this.proveedores().find((p) => p.id === this.proveedorId())?.nombre;
    return `${etiquetaPeriodo(this.rango(), this.periodo())} · ${nombre ?? 'todos los proveedores'}`;
  });

  protected serie = computed(() => {
    const r = this.resumen();
    return r ? construirSerie(r.desde, r.hasta, r.dias) : null;
  });

  /** Change of liters against the previous period, or null when there is nothing to compare with. */
  protected variacion = computed(() => {
    const t = this.resumen()?.totales;
    if (!t || t.litrosPeriodoAnterior <= 0) {
      return null;
    }
    const porcentaje = ((t.litros - t.litrosPeriodoAnterior) / t.litrosPeriodoAnterior) * 100;
    const sentido = porcentaje > 0 ? 'sube' : porcentaje < 0 ? 'baja' : 'igual';
    return { porcentaje: Math.abs(porcentaje), sentido };
  });

  protected filasProveedores = computed(() => {
    const r = this.resumen();
    if (!r) {
      return [];
    }
    return r.proveedores.map((p) => ({
      ...p,
      participacion: r.totales.litros > 0 ? (p.litros / r.totales.litros) * 100 : 0,
    }));
  });

  constructor() {
    this.proveedoresService.getAll().subscribe({
      next: (lista) => this.proveedores.set(lista),
      error: () => this.proveedores.set([]), // the filter simply offers "Todos"
    });
    this.cargar();
  }

  protected seleccionarPeriodo(preset: PeriodoPreset | undefined): void {
    if (!preset) {
      return;
    }
    this.errorRango.set(null);
    this.periodo.set(preset);
    this.rango.set(rangoDePeriodo(preset, hoyEnPlanta()));
    this.rangoForm.setValue({
      inicio: isoADate(this.rango().desde),
      fin: isoADate(this.rango().hasta),
    });
    this.cargar();
  }

  /** Called when the end date of the range field changes (both ends are then set). */
  protected rangoPersonalizadoCambiado(): void {
    const { inicio, fin } = this.rangoForm.getRawValue();
    if (!inicio || !fin) {
      return;
    }
    const nuevo = { desde: dateAIso(inicio), hasta: dateAIso(fin) };
    if (diasEnRango(nuevo.desde, nuevo.hasta) > RESUMEN_MAX_DIAS) {
      this.errorRango.set(`El período no puede superar los ${RESUMEN_MAX_DIAS} días.`);
      return;
    }
    this.errorRango.set(null);
    this.periodo.set(null);
    this.rango.set(nuevo);
    this.cargar();
  }

  protected proveedorCambiado(): void {
    this.proveedorId.set(this.proveedorSeleccionado());
    this.cargar();
  }

  private proveedorSeleccionado(): string | null {
    const id = this.proveedorControl.value;
    return id === this.TODOS ? null : id;
  }

  private cargar(): void {
    this.request?.unsubscribe();
    this.loading.set(true);
    this.error.set(null);

    const { desde, hasta } = this.rango();
    this.request = this.recepcionesService
      .getResumen(desde, hasta, this.proveedorSeleccionado())
      .subscribe({
        next: (data) => {
          this.resumen.set(data);
          this.loading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.resumen.set(null);
          this.error.set(getApiErrorMessage(err, 'No se pudo cargar el resumen.'));
          this.loading.set(false);
        },
      });
  }
}
