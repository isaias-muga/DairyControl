import { Component, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { Subscription } from 'rxjs';
import { RecepcionesService } from '../../services/recepciones';
import { ResumenRecepciones } from '../../models/resumen';
import { RESUMEN_MAX_DIAS } from '../../models/limits';
import { getApiErrorMessage } from '../../utils/api-error';
import {
  PeriodoPreset,
  RangoFechas,
  diasEnRango,
  hoyEnPlanta,
  rangoDePeriodo,
} from '../../utils/periodos';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';

type Periodo = PeriodoPreset | 'personalizado';

const PRESETS: { valor: PeriodoPreset; etiqueta: string }[] = [
  { valor: 'hoy', etiqueta: 'Hoy' },
  { valor: 'ultimos-7', etiqueta: 'Últimos 7 días' },
  { valor: 'ultimos-30', etiqueta: 'Últimos 30 días' },
  { valor: 'este-mes', etiqueta: 'Este mes' },
  { valor: 'mes-anterior', etiqueta: 'Mes anterior' },
];

function rangoValido(group: AbstractControl): ValidationErrors | null {
  const desde = group.get('desde')?.value as string;
  const hasta = group.get('hasta')?.value as string;
  if (!desde || !hasta) {
    return { requerido: 'Completá las dos fechas.' };
  }
  if (desde > hasta) {
    return { rango: 'La fecha desde no puede ser posterior a la fecha hasta.' };
  }
  if (diasEnRango(desde, hasta) > RESUMEN_MAX_DIAS) {
    return { rango: `El período no puede superar los ${RESUMEN_MAX_DIAS} días.` };
  }
  return null;
}

@Component({
  selector: 'app-resumen',
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTableModule,
  ],
  templateUrl: './resumen.html',
  styleUrl: './resumen.css',
})
export class Resumen {
  private recepcionesService = inject(RecepcionesService);
  private fb = inject(FormBuilder).nonNullable;
  private request?: Subscription;

  protected presets = PRESETS;
  protected columnasProveedores = ['nombre', 'litros', 'recepciones', 'acidez'];
  protected columnasDias = ['fecha', 'litros', 'recepciones'];

  periodo = signal<Periodo>('ultimos-30');
  resumen = signal<ResumenRecepciones | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  protected form = this.fb.group({ desde: [''], hasta: [''] }, { validators: rangoValido });

  constructor() {
    this.cargar(rangoDePeriodo('ultimos-30', hoyEnPlanta()));
  }

  protected seleccionar(periodo: Periodo | undefined): void {
    if (!periodo) {
      return; // clicking the selected chip deselects it; keep the current period
    }
    this.periodo.set(periodo);
    if (periodo === 'personalizado') {
      const actual = this.resumen();
      if (actual) {
        this.form.setValue({ desde: actual.desde, hasta: actual.hasta });
      }
      return;
    }
    this.cargar(rangoDePeriodo(periodo, hoyEnPlanta()));
  }

  protected aplicarPersonalizado(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.cargar(this.form.getRawValue());
  }

  protected errorRango(): string | null {
    const errors = this.form.errors;
    return errors ? ((errors['rango'] ?? errors['requerido']) as string) : null;
  }

  private cargar(rango: RangoFechas): void {
    this.request?.unsubscribe();
    this.loading.set(true);
    this.error.set(null);

    this.request = this.recepcionesService.getResumen(rango.desde, rango.hasta).subscribe({
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
